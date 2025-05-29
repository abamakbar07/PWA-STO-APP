import { sql } from "@/lib/database"
import crypto from "crypto"

interface OTPRecord {
  id: string
  email: string
  otp_code: string
  purpose: "SIGNUP" | "PASSWORD_RESET" | "EMAIL_VERIFICATION"
  expires_at: Date
  used: boolean
  created_at: Date
}

export class OTPService {
  // Generate a 6-digit OTP
  static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString()
  }

  // Create OTP record in database
  static async createOTP(email: string, purpose: "SIGNUP" | "PASSWORD_RESET" | "EMAIL_VERIFICATION"): Promise<string> {
    if (!sql) {
      throw new Error("Database not available")
    }

    const otpCode = this.generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Invalidate any existing OTPs for this email and purpose
    await sql`
      UPDATE otp_codes 
      SET used = true 
      WHERE email = ${email} AND purpose = ${purpose} AND used = false
    `

    // Create new OTP
    await sql`
      INSERT INTO otp_codes (email, otp_code, purpose, expires_at)
      VALUES (${email}, ${otpCode}, ${purpose}, ${expiresAt})
    `

    return otpCode
  }

  // Verify OTP
  static async verifyOTP(
    email: string,
    otpCode: string,
    purpose: "SIGNUP" | "PASSWORD_RESET" | "EMAIL_VERIFICATION",
  ): Promise<boolean> {
    if (!sql) {
      throw new Error("Database not available")
    }

    const [record] = await sql`
      SELECT * FROM otp_codes 
      WHERE email = ${email} 
        AND otp_code = ${otpCode} 
        AND purpose = ${purpose} 
        AND used = false 
        AND expires_at > NOW()
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (!record) {
      return false
    }

    // Mark OTP as used
    await sql`
      UPDATE otp_codes 
      SET used = true 
      WHERE id = ${record.id}
    `

    return true
  }

  // Clean up expired OTPs
  static async cleanupExpiredOTPs(): Promise<void> {
    if (!sql) {
      return
    }

    await sql`
      DELETE FROM otp_codes 
      WHERE expires_at < NOW() OR used = true
    `
  }

  // Send OTP via email (mock implementation - replace with actual email service)
  static async sendOTP(email: string, otpCode: string, purpose: string): Promise<void> {
    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP

    console.log(`[EMAIL SERVICE] Sending OTP to ${email}`)
    console.log(`Subject: Your STO Manager Verification Code`)
    console.log(`OTP Code: ${otpCode}`)
    console.log(`Purpose: ${purpose}`)
    console.log(`Expires in 10 minutes`)

    // For demo purposes, we'll just log the OTP
    // In production, replace this with actual email sending logic
  }
}
