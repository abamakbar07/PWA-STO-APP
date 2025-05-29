import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EmailService } from "@/lib/services/email.service"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only super users can test email functionality
    if (!session || (session.user as any)?.role !== "SUPER_USER") {
      return createErrorResponse("Unauthorized - Super User access required", 401, "UNAUTHORIZED")
    }

    const body = await request.json()
    const { to, type = "test" } = body

    let result

    switch (type) {
      case "test":
        result = await EmailService.sendTestEmail(to)
        break

      case "otp":
        const { name = "Test User", otpCode = "123456", purpose = "Test Verification" } = body
        result = await EmailService.sendOTP(to || "test@example.com", name, otpCode, purpose)
        break

      case "welcome":
        const { userName = "Test User" } = body
        result = await EmailService.sendWelcomeEmail(to || "test@example.com", userName)
        break

      case "approval":
        const {
          adminEmail = to || "admin@example.com",
          userEmail = "user@example.com",
          userNameForApproval = "Test User",
          approvalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/approve?token=test-token`,
        } = body
        result = await EmailService.sendAdminApprovalRequest(adminEmail, userEmail, userNameForApproval, approvalLink)
        break

      default:
        return createErrorResponse("Invalid email type", 400, "INVALID_TYPE")
    }

    if (result.success) {
      return createSuccessResponse(
        {
          messageId: result.messageId,
          type,
          to: to || "default recipient",
        },
        "Email sent successfully",
      )
    } else {
      return createErrorResponse(`Failed to send email: ${result.error}`, 500, "EMAIL_SEND_FAILED")
    }
  } catch (error) {
    return handleApiError(error, "POST /api/email/test")
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Only super users can check email health
    if (!session || (session.user as any)?.role !== "SUPER_USER") {
      return createErrorResponse("Unauthorized - Super User access required", 401, "UNAUTHORIZED")
    }

    const health = await EmailService.checkEmailHealth()

    if (health.healthy) {
      return createSuccessResponse(
        {
          status: "healthy",
          config: health.config,
          timestamp: new Date().toISOString(),
        },
        "Email service is healthy",
      )
    } else {
      return createErrorResponse(`Email service is unhealthy: ${health.error}`, 503, "EMAIL_SERVICE_UNHEALTHY")
    }
  } catch (error) {
    return handleApiError(error, "GET /api/email/test")
  }
}
