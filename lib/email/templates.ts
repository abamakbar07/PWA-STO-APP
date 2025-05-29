export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export function getOTPEmailTemplate(name: string, otpCode: string, purpose: string): EmailTemplate {
  const subject = `Your STO Manager Verification Code - ${otpCode}`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>STO Manager - Verification Code</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 64px;
                height: 64px;
                background-color: #2563eb;
                border-radius: 8px;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            }
            .title {
                color: #1f2937;
                font-size: 24px;
                font-weight: bold;
                margin: 0;
            }
            .subtitle {
                color: #6b7280;
                font-size: 16px;
                margin: 8px 0 0 0;
            }
            .otp-container {
                background-color: #f3f4f6;
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                padding: 24px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-code {
                font-size: 32px;
                font-weight: bold;
                color: #2563eb;
                letter-spacing: 4px;
                margin: 0;
                font-family: 'Courier New', monospace;
            }
            .otp-label {
                color: #6b7280;
                font-size: 14px;
                margin-top: 8px;
            }
            .content {
                margin: 24px 0;
            }
            .warning {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 16px;
                margin: 24px 0;
                border-radius: 4px;
            }
            .warning-title {
                font-weight: bold;
                color: #92400e;
                margin: 0 0 8px 0;
            }
            .warning-text {
                color: #92400e;
                margin: 0;
                font-size: 14px;
            }
            .footer {
                margin-top: 40px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
            .button {
                display: inline-block;
                background-color: #2563eb;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin: 16px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📦</div>
                <h1 class="title">STO Manager</h1>
                <p class="subtitle">Stock Take Operations Platform</p>
            </div>

            <div class="content">
                <p>Hello ${name},</p>
                <p>You've requested a verification code for <strong>${purpose}</strong>. Please use the code below to complete your verification:</p>
            </div>

            <div class="otp-container">
                <p class="otp-code">${otpCode}</p>
                <p class="otp-label">Verification Code</p>
            </div>

            <div class="content">
                <p>This code will expire in <strong>10 minutes</strong> for security reasons.</p>
                <p>If you didn't request this code, please ignore this email or contact your administrator if you have concerns.</p>
            </div>

            <div class="warning">
                <p class="warning-title">🔒 Security Notice</p>
                <p class="warning-text">Never share this verification code with anyone. STO Manager staff will never ask for your verification code.</p>
            </div>

            <div class="footer">
                <p>This email was sent from STO Manager</p>
                <p>If you have any questions, please contact your system administrator.</p>
            </div>
        </div>
    </body>
    </html>
  `

  const text = `
STO Manager - Verification Code

Hello ${name},

You've requested a verification code for ${purpose}.

Your verification code is: ${otpCode}

This code will expire in 10 minutes for security reasons.

If you didn't request this code, please ignore this email or contact your administrator if you have concerns.

Security Notice: Never share this verification code with anyone. STO Manager staff will never ask for your verification code.

---
This email was sent from STO Manager
If you have any questions, please contact your system administrator.
  `

  return { subject, html, text }
}

export function getAdminApprovalEmailTemplate(
  adminName: string,
  userEmail: string,
  userName: string,
  approvalLink: string,
): EmailTemplate {
  const subject = `STO Manager - New User Approval Required: ${userName}`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>STO Manager - User Approval Required</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 64px;
                height: 64px;
                background-color: #2563eb;
                border-radius: 8px;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            }
            .title {
                color: #1f2937;
                font-size: 24px;
                font-weight: bold;
                margin: 0;
            }
            .subtitle {
                color: #6b7280;
                font-size: 16px;
                margin: 8px 0 0 0;
            }
            .user-info {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 24px;
                margin: 24px 0;
            }
            .user-info h3 {
                margin: 0 0 16px 0;
                color: #1f2937;
            }
            .user-detail {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .user-detail:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: 500;
                color: #6b7280;
            }
            .value {
                color: #1f2937;
            }
            .button {
                display: inline-block;
                background-color: #10b981;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin: 16px 8px 16px 0;
                text-align: center;
            }
            .button-secondary {
                background-color: #6b7280;
            }
            .button-container {
                text-align: center;
                margin: 32px 0;
            }
            .footer {
                margin-top: 40px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
            .content {
                margin: 24px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">👥</div>
                <h1 class="title">User Approval Required</h1>
                <p class="subtitle">STO Manager Administration</p>
            </div>

            <div class="content">
                <p>Hello ${adminName},</p>
                <p>A new user has requested access to STO Manager and requires your approval. The user has successfully verified their email address and is now waiting for administrative approval.</p>
            </div>

            <div class="user-info">
                <h3>📋 User Information</h3>
                <div class="user-detail">
                    <span class="label">Name:</span>
                    <span class="value">${userName}</span>
                </div>
                <div class="user-detail">
                    <span class="label">Email:</span>
                    <span class="value">${userEmail}</span>
                </div>
                <div class="user-detail">
                    <span class="label">Requested Role:</span>
                    <span class="value">Admin User</span>
                </div>
                <div class="user-detail">
                    <span class="label">Status:</span>
                    <span class="value">Email Verified - Pending Approval</span>
                </div>
            </div>

            <div class="button-container">
                <a href="${approvalLink}" class="button">✅ Approve User</a>
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/users/pending" class="button button-secondary">📋 View All Pending</a>
            </div>

            <div class="content">
                <p><strong>What happens next?</strong></p>
                <ul>
                    <li>Click "Approve User" to immediately activate their account</li>
                    <li>The user will receive a welcome email with login instructions</li>
                    <li>They will be able to access STO Manager with Admin User privileges</li>
                </ul>
                
                <p>You can also manage all pending user requests through the STO Manager admin panel.</p>
            </div>

            <div class="footer">
                <p>This email was sent from STO Manager</p>
                <p>If you have any questions about this approval request, please contact your system administrator.</p>
            </div>
        </div>
    </body>
    </html>
  `

  const text = `
STO Manager - User Approval Required

Hello ${adminName},

A new user has requested access to STO Manager and requires your approval.

User Information:
- Name: ${userName}
- Email: ${userEmail}
- Requested Role: Admin User
- Status: Email Verified - Pending Approval

To approve this user, click the following link:
${approvalLink}

Or visit the admin panel to manage all pending requests:
${process.env.NEXTAUTH_URL || "http://localhost:3000"}/users/pending

What happens next:
- Click the approval link to immediately activate their account
- The user will receive a welcome email with login instructions
- They will be able to access STO Manager with Admin User privileges

---
This email was sent from STO Manager
If you have any questions about this approval request, please contact your system administrator.
  `

  return { subject, html, text }
}

export function getWelcomeEmailTemplate(name: string): EmailTemplate {
  const subject = `Welcome to STO Manager - Your Account is Now Active!`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to STO Manager</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 64px;
                height: 64px;
                background-color: #10b981;
                border-radius: 8px;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            }
            .title {
                color: #1f2937;
                font-size: 28px;
                font-weight: bold;
                margin: 0;
            }
            .subtitle {
                color: #6b7280;
                font-size: 16px;
                margin: 8px 0 0 0;
            }
            .welcome-message {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 24px;
                border-radius: 8px;
                text-align: center;
                margin: 24px 0;
            }
            .welcome-title {
                font-size: 20px;
                font-weight: bold;
                margin: 0 0 8px 0;
            }
            .welcome-text {
                margin: 0;
                opacity: 0.9;
            }
            .features {
                margin: 32px 0;
            }
            .feature {
                display: flex;
                align-items: flex-start;
                margin: 16px 0;
                padding: 16px;
                background-color: #f9fafb;
                border-radius: 6px;
            }
            .feature-icon {
                font-size: 20px;
                margin-right: 12px;
                margin-top: 2px;
            }
            .feature-content h4 {
                margin: 0 0 4px 0;
                color: #1f2937;
                font-size: 16px;
            }
            .feature-content p {
                margin: 0;
                color: #6b7280;
                font-size: 14px;
            }
            .button {
                display: inline-block;
                background-color: #2563eb;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin: 24px 0;
                text-align: center;
            }
            .button-container {
                text-align: center;
            }
            .footer {
                margin-top: 40px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
            .content {
                margin: 24px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎉</div>
                <h1 class="title">Welcome to STO Manager!</h1>
                <p class="subtitle">Your account is now active</p>
            </div>

            <div class="welcome-message">
                <h2 class="welcome-title">🎊 Congratulations, ${name}!</h2>
                <p class="welcome-text">Your STO Manager account has been approved and activated. You can now access all the features of our Stock Take Operations platform.</p>
            </div>

            <div class="content">
                <p>Hello ${name},</p>
                <p>We're excited to welcome you to STO Manager! Your account has been successfully approved by an administrator and is now fully active.</p>
            </div>

            <div class="features">
                <h3 style="color: #1f2937; margin-bottom: 16px;">🚀 What you can do now:</h3>
                
                <div class="feature">
                    <div class="feature-icon">📋</div>
                    <div class="feature-content">
                        <h4>Manage Stock Take Forms</h4>
                        <p>Print, distribute, and track counting forms throughout the entire process</p>
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div class="feature-content">
                        <h4>Input Counting Data</h4>
                        <p>Enter physical counting results and manage excess inventory items</p>
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-icon">📈</div>
                    <div class="feature-content">
                        <h4>Generate Reports</h4>
                        <p>Create comprehensive reports and track progress across all operations</p>
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-icon">👥</div>
                    <div class="feature-content">
                        <h4>Collaborate with Team</h4>
                        <p>Work with other team members and track form assignments</p>
                    </div>
                </div>
            </div>

            <div class="button-container">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/signin" class="button">🚀 Sign In to STO Manager</a>
            </div>

            <div class="content">
                <p><strong>Getting Started:</strong></p>
                <ol>
                    <li>Click the "Sign In" button above</li>
                    <li>Use your email address and the password you created during signup</li>
                    <li>Explore the dashboard to familiarize yourself with the platform</li>
                    <li>Contact your administrator if you need any assistance</li>
                </ol>
            </div>

            <div class="footer">
                <p><strong>Need Help?</strong></p>
                <p>If you have any questions or need assistance, please contact your system administrator.</p>
                <p>This email was sent from STO Manager</p>
            </div>
        </div>
    </body>
    </html>
  `

  const text = `
Welcome to STO Manager!

Congratulations, ${name}!

Your STO Manager account has been approved and activated. You can now access all the features of our Stock Take Operations platform.

What you can do now:
- Manage Stock Take Forms: Print, distribute, and track counting forms
- Input Counting Data: Enter physical counting results and manage excess inventory
- Generate Reports: Create comprehensive reports and track progress
- Collaborate with Team: Work with other team members and track assignments

Getting Started:
1. Visit: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/signin
2. Use your email address and the password you created during signup
3. Explore the dashboard to familiarize yourself with the platform
4. Contact your administrator if you need any assistance

Need Help?
If you have any questions or need assistance, please contact your system administrator.

---
This email was sent from STO Manager
  `

  return { subject, html, text }
}
