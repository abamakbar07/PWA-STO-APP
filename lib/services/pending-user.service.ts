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
  }): Promise<{ pendingUser: PendingUser; otpCode: string; emailSent: boolean }> {
    const { email, name, password, role, adminEmail } = userData

    if (!sql) {
      throw new Error("Database not available")
    }

    // Check if user already exists in users table
    const [existingUser] = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Clean up any expired pending users for this email
    await sql`
      DELETE FROM pending_users 
      WHERE email = ${email} AND expires_at < NOW()
    `

    // Check if there's still a valid pending user
    const [existingPendingUser] = await sql`
      SELECT id FROM pending_users 
      WHERE email = ${email} AND expires_at > NOW()
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
    const emailResult = await EmailService.sendOTP(email, name, otpCode, "Account Verification")

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error)
      // Don't throw error, but log it and continue
      // The user can still use the resend functionality
    }

    return {
      pendingUser,
      otpCode,
      emailSent: emailResult.success,
    }
  }

  static async verifyOTP(
    email: string,
    otpCode: string,
  ): Promise<{ verified: boolean; user?: any; emailSent?: boolean }> {
    if (!sql) {
      throw new Error("Database not available")
    }

    const verified = await OTPService.verifyOTP(email, otpCode, "SIGNUP")

    if (!verified) {
      return { verified: false }
    }

    // Update pending user to mark OTP as verified
    const [updatedPendingUser] = await sql`
      UPDATE pending_users
      SET otp_verified = true
      WHERE email = ${email} AND expires_at > NOW()
      RETURNING *
    `

    if (!updatedPendingUser) {
      throw new Error("Pending user not found or expired")
    }

    // Check if admin approval is required
    if (updatedPendingUser.admin_email) {
      // Send approval request to admin
      const approvalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/approve?token=${updatedPendingUser.id}`
      const emailResult = await EmailService.sendAdminApprovalRequest(
        updatedPendingUser.admin_email,
        updatedPendingUser.email,
        updatedPendingUser.name,
        approvalLink,
      )

      return {
        verified: true,
        emailSent: emailResult.success,
        user: {
          email: updatedPendingUser.email,
          name: updatedPendingUser.name,
          status: "pending_admin_approval",
          admin_email: updatedPendingUser.admin_email,
        },
      }
    } else {
      // Auto-approve if no admin email specified
      const approvedUser = await this.approvePendingUser(updatedPendingUser.id)

      return {
        verified: true,
        emailSent: true, // Welcome email is sent in approvePendingUser
        user: {
          email: approvedUser.email,
          name: approvedUser.name,
          status: "approved",
          id: approvedUser.id,
        },
      }
    }
  }

  static async approvePendingUser(pendingUserId: string): Promise<any> {
    if (!sql) {
      throw new Error("Database not available")
    }

    // Get pending user
    const [pendingUser] = await sql`
      SELECT * FROM pending_users
      WHERE id = ${pendingUserId}
      AND otp_verified = true
      AND admin_approved = false
      AND expires_at > NOW()
    `

    if (!pendingUser) {
      throw new Error("Pending user not found, already approved, or expired")
    }

    try {
      // Start transaction by creating the user first
      const [user] = await sql`
        INSERT INTO users (
          email, name, password_hash, role, is_active
        ) VALUES (
          ${pendingUser.email}, 
          ${pendingUser.name}, 
          ${pendingUser.password_hash}, 
          ${pendingUser.role}, 
          true
        )
        RETURNING id, email, name, role, is_active, created_at
      `

      // Mark pending user as approved
      await sql`
        UPDATE pending_users
        SET admin_approved = true
        WHERE id = ${pendingUserId}
      `

      // Send welcome email
      const emailResult = await EmailService.sendWelcomeEmail(user.email, user.name)

      if (!emailResult.success) {
        console.error("Failed to send welcome email:", emailResult.error)
        // Don't fail the approval process if email fails
      }

      return user
    } catch (error) {
      console.error("Error approving pending user:", error)
      throw new Error("Failed to approve user")
    }
  }

  static async getPendingUserByEmail(email: string): Promise<PendingUser | null> {
    if (!sql) {
      return null
    }

    const [pendingUser] = await sql`
      SELECT * FROM pending_users
      WHERE email = ${email} AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `

    return pendingUser || null
  }

  static async getPendingUserById(id: string): Promise<PendingUser | null> {
    if (!sql) {
      return null
    }

    const [pendingUser] = await sql`
      SELECT * FROM pending_users
      WHERE id = ${id}
    `

    return pendingUser || null
  }

  static async resendOTP(email: string): Promise<{ otpCode: string; emailSent: boolean }> {
    if (!sql) {
      throw new Error("Database not available")
    }

    // Check if there's a valid pending user
    const [pendingUser] = await sql`
      SELECT * FROM pending_users
      WHERE email = ${email} 
      AND expires_at > NOW()
      AND otp_verified = false
    `

    if (!pendingUser) {
      throw new Error("No pending registration found for this email")
    }

    // Generate new OTP
    const otpCode = await OTPService.createOTP(email, "SIGNUP")

    // Send OTP via email
    const emailResult = await EmailService.sendOTP(email, pendingUser.name, otpCode, "Account Verification")

    return {
      otpCode,
      emailSent: emailResult.success,
    }
  }

  static async cleanupExpiredPendingUsers(): Promise<void> {
    if (!sql) {
      return
    }

    await sql`
      DELETE FROM pending_users
      WHERE expires_at < NOW()
    `
  }
}
