import { sql } from "@/lib/database"
import { hashPassword } from "@/lib/auth/password"
import { OTPService } from "./otp.service"
import { EmailService } from "./email.service"

interface PendingUser {
  id: string
  email: string
  name: string
  role: "SUPER_USER" | "ADMIN_USER"
  admin_email: string | null
  otp_verified: boolean
  admin_approved: boolean
  created_at: Date
  expires_at: Date
}

export class PendingUserService {
  static async createPendingUser(userData: {
    email: string
    name: string
    password: string
    role: "SUPER_USER" | "ADMIN_USER"
    adminEmail?: string
  }): Promise<{ pendingUser: PendingUser; otpCode: string }> {
    const { email, name, password, role, adminEmail } = userData

    // Check if user already exists in users table
    const [existingUser] = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Check if pending user already exists
    const [existingPendingUser] = await sql`
      SELECT id FROM pending_users WHERE email = ${email}
    `

    if (existingPendingUser) {
      throw new Error("A signup request with this email is already pending")
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create pending user
    const [pendingUser] = await sql`
      INSERT INTO pending_users (
        email, name, password_hash, role, admin_email
      ) VALUES (
        ${email}, ${name}, ${passwordHash}, ${role}, ${adminEmail || null}
      )
      RETURNING *
    `

    // Generate OTP for email verification
    const otpCode = await OTPService.createOTP(email, "SIGNUP")

    // Send OTP via email
    await EmailService.sendOTP(email, otpCode, "Account Verification")

    return { pendingUser, otpCode }
  }

  static async verifyOTP(email: string, otpCode: string): Promise<boolean> {
    const verified = await OTPService.verifyOTP(email, otpCode, "SIGNUP")

    if (verified) {
      // Update pending user
      await sql`
        UPDATE pending_users
        SET otp_verified = true
        WHERE email = ${email}
      `

      // Get pending user
      const [pendingUser] = await sql`
        SELECT * FROM pending_users
        WHERE email = ${email}
      `

      // If admin email is provided, send approval request
      if (pendingUser && pendingUser.admin_email) {
        const approvalLink = `${process.env.NEXTAUTH_URL}/api/auth/approve?token=${pendingUser.id}`
        await EmailService.sendAdminApprovalRequest(
          pendingUser.admin_email,
          pendingUser.email,
          pendingUser.name,
          approvalLink,
        )
      } else if (pendingUser) {
        // Auto-approve if no admin email
        await this.approvePendingUser(pendingUser.id)
      }
    }

    return verified
  }

  static async approvePendingUser(pendingUserId: string): Promise<boolean> {
    // Get pending user
    const [pendingUser] = await sql`
      SELECT * FROM pending_users
      WHERE id = ${pendingUserId}
      AND otp_verified = true
      AND admin_approved = false
    `

    if (!pendingUser) {
      return false
    }

    // Create actual user
    const [user] = await sql`
      INSERT INTO users (
        email, name, password_hash, role, is_active
      ) VALUES (
        ${pendingUser.email}, ${pendingUser.name}, ${pendingUser.password_hash}, ${pendingUser.role}, true
      )
      RETURNING *
    `

    // Mark pending user as approved
    await sql`
      UPDATE pending_users
      SET admin_approved = true
      WHERE id = ${pendingUserId}
    `

    // Send welcome email
    await EmailService.sendWelcomeEmail(user.email, user.name)

    return true
  }

  static async getPendingUserByEmail(email: string): Promise<PendingUser | null> {
    const [pendingUser] = await sql`
      SELECT * FROM pending_users
      WHERE email = ${email}
    `

    return pendingUser || null
  }

  static async getPendingUserById(id: string): Promise<PendingUser | null> {
    const [pendingUser] = await sql`
      SELECT * FROM pending_users
      WHERE id = ${id}
    `

    return pendingUser || null
  }

  static async cleanupExpiredPendingUsers(): Promise<void> {
    await sql`
      DELETE FROM pending_users
      WHERE expires_at < NOW()
    `
  }
}
