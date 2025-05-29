import { createTransporter, testEmailConnection, getEmailConfig } from "@/lib/email/config"
import { getOTPEmailTemplate, getAdminApprovalEmailTemplate, getWelcomeEmailTemplate } from "@/lib/email/templates"

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export class EmailService {
  private static async sendEmail(to: string, subject: string, html: string, text: string): Promise<EmailResult> {
    try {
      // Test connection first
      const connectionTest = await testEmailConnection()
      if (!connectionTest.success) {
        console.error("Email connection test failed:", connectionTest.error)
        return {
          success: false,
          error: `Email service unavailable: ${connectionTest.error}`,
        }
      }

      const config = getEmailConfig()
      const transporter = createTransporter()

      const mailOptions = {
        from: {
          name: "STO Manager",
          address: config.from,
        },
        to,
        subject,
        html,
        text,
        headers: {
          "X-Mailer": "STO Manager v1.0",
          "X-Priority": "3",
        },
      }

      console.log(`📧 [EMAIL SERVICE] Sending email to: ${to}`)
      console.log(`📧 [EMAIL SERVICE] Subject: ${subject}`)

      const info = await transporter.sendMail(mailOptions)

      console.log(`✅ [EMAIL SERVICE] Email sent successfully`)
      console.log(`📧 [EMAIL SERVICE] Message ID: ${info.messageId}`)

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      console.error("❌ [EMAIL SERVICE] Failed to send email:", error)

      let errorMessage = "Unknown error occurred"
      if (error instanceof Error) {
        errorMessage = error.message

        // Provide more specific error messages
        if (errorMessage.includes("EAUTH")) {
          errorMessage = "Email authentication failed. Please check your email credentials."
        } else if (errorMessage.includes("ECONNECTION")) {
          errorMessage = "Failed to connect to email server. Please check your network connection."
        } else if (errorMessage.includes("ETIMEDOUT")) {
          errorMessage = "Email sending timed out. Please try again later."
        } else if (errorMessage.includes("Invalid login")) {
          errorMessage = "Invalid email credentials. Please check your email username and password."
        }
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  static async sendOTP(email: string, name: string, otpCode: string, purpose: string): Promise<EmailResult> {
    try {
      const template = getOTPEmailTemplate(name, otpCode, purpose)

      const result = await this.sendEmail(email, template.subject, template.html, template.text)

      if (result.success) {
        console.log(`✅ [EMAIL SERVICE] OTP sent successfully to ${email}`)
        console.log(`🔢 [EMAIL SERVICE] OTP Code: ${otpCode} (for development)`)
      } else {
        console.error(`❌ [EMAIL SERVICE] Failed to send OTP to ${email}:`, result.error)
      }

      return result
    } catch (error) {
      console.error("❌ [EMAIL SERVICE] Error in sendOTP:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send OTP email",
      }
    }
  }

  static async sendAdminApprovalRequest(
    adminEmail: string,
    userEmail: string,
    userName: string,
    approvalLink: string,
  ): Promise<EmailResult> {
    try {
      // Extract admin name from email (fallback to email if no name available)
      const adminName = adminEmail
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())

      const template = getAdminApprovalEmailTemplate(adminName, userEmail, userName, approvalLink)

      const result = await this.sendEmail(adminEmail, template.subject, template.html, template.text)

      if (result.success) {
        console.log(`✅ [EMAIL SERVICE] Admin approval request sent to ${adminEmail}`)
        console.log(`👤 [EMAIL SERVICE] For user: ${userName} (${userEmail})`)
        console.log(`🔗 [EMAIL SERVICE] Approval link: ${approvalLink}`)
      } else {
        console.error(`❌ [EMAIL SERVICE] Failed to send approval request to ${adminEmail}:`, result.error)
      }

      return result
    } catch (error) {
      console.error("❌ [EMAIL SERVICE] Error in sendAdminApprovalRequest:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send admin approval request",
      }
    }
  }

  static async sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
    try {
      const template = getWelcomeEmailTemplate(name)

      const result = await this.sendEmail(email, template.subject, template.html, template.text)

      if (result.success) {
        console.log(`✅ [EMAIL SERVICE] Welcome email sent to ${email}`)
        console.log(`👋 [EMAIL SERVICE] Welcome message for: ${name}`)
      } else {
        console.error(`❌ [EMAIL SERVICE] Failed to send welcome email to ${email}:`, result.error)
      }

      return result
    } catch (error) {
      console.error("❌ [EMAIL SERVICE] Error in sendWelcomeEmail:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send welcome email",
      }
    }
  }

  // Test email functionality
  static async sendTestEmail(to?: string): Promise<EmailResult> {
    try {
      const config = getEmailConfig()
      const testEmail = to || config.to

      const subject = "STO Manager - Email Configuration Test"
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🧪 Email Configuration Test</h2>
          <p>This is a test email to verify that your STO Manager email configuration is working correctly.</p>
          <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #1e40af;">✅ Configuration Status</h3>
            <p style="margin: 0; color: #1e40af;">Email service is configured and working properly!</p>
          </div>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Sent at: ${new Date().toISOString()}</li>
            <li>From: ${config.from}</li>
            <li>SMTP Host: ${config.host}</li>
            <li>SMTP Port: ${config.port}</li>
          </ul>
          <p>If you received this email, your STO Manager email configuration is working correctly.</p>
        </div>
      `
      const text = `
STO Manager - Email Configuration Test

This is a test email to verify that your STO Manager email configuration is working correctly.

Configuration Status: Email service is configured and working properly!

Test Details:
- Sent at: ${new Date().toISOString()}
- From: ${config.from}
- SMTP Host: ${config.host}
- SMTP Port: ${config.port}

If you received this email, your STO Manager email configuration is working correctly.
      `

      const result = await this.sendEmail(testEmail, subject, html, text)

      if (result.success) {
        console.log(`✅ [EMAIL SERVICE] Test email sent successfully to ${testEmail}`)
      } else {
        console.error(`❌ [EMAIL SERVICE] Test email failed:`, result.error)
      }

      return result
    } catch (error) {
      console.error("❌ [EMAIL SERVICE] Error in sendTestEmail:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send test email",
      }
    }
  }

  // Check email service health
  static async checkEmailHealth(): Promise<{ healthy: boolean; error?: string; config?: any }> {
    try {
      const connectionTest = await testEmailConnection()

      if (connectionTest.success) {
        const config = getEmailConfig()
        return {
          healthy: true,
          config: {
            host: config.host,
            port: config.port,
            secure: config.secure,
            from: config.from,
          },
        }
      } else {
        return {
          healthy: false,
          error: connectionTest.error,
        }
      }
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
