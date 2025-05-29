import type { NextRequest } from "next/server"
import { PendingUserService } from "@/lib/services/pending-user.service"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return createErrorResponse("Email is required", 400, "VALIDATION_ERROR")
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return createErrorResponse("Invalid email format", 400, "VALIDATION_ERROR")
    }

    // Resend OTP
    await PendingUserService.resendOTP(email)

    return createSuccessResponse({ email }, "Verification code has been resent to your email.")
  } catch (error) {
    return handleApiError(error, "POST /api/auth/resend-otp")
  }
}
