export class EmailService {
  static async sendOTP(email: string, otpCode: string, purpose: string): Promise<void> {
    // In a production environment, you would integrate with an email service like:
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

  static async sendAdminApprovalRequest(
    adminEmail: string,
    userEmail: string,
    userName: string,
    approvalLink: string,
  ): Promise<void> {
    console.log(`[EMAIL SERVICE] Sending admin approval request to ${adminEmail}`)
    console.log(`Subject: STO Manager - New User Approval Required`)
    console.log(`A new user has requested access to STO Manager:`)
    console.log(`Name: ${userName}`)
    console.log(`Email: ${userEmail}`)
    console.log(`Approval Link: ${approvalLink}`)

    // For demo purposes, we'll just log the approval request
    // In production, replace this with actual email sending logic
  }

  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    console.log(`[EMAIL SERVICE] Sending welcome email to ${email}`)
    console.log(`Subject: Welcome to STO Manager!`)
    console.log(`Hello ${name},`)
    console.log(`Your account has been approved and is now active.`)
    console.log(`You can now sign in to STO Manager and start using the application.`)

    // For demo purposes, we'll just log the welcome email
    // In production, replace this with actual email sending logic
  }
}
