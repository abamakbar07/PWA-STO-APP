import type { NextRequest } from "next/server"
import { PendingUserService } from "@/lib/services/pending-user.service"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    // Validate required fields
    if (!email || !otp) {
      return createErrorResponse("Missing required fields", 400, "VALIDATION_ERROR")
    }

    // Verify OTP
    const result = await PendingUserService.verifyOTP(email, otp)

    if (!result.verified) {
      return createErrorResponse("Invalid or expired verification code", 400, "INVALID_OTP")
    }

    return createSuccessResponse(
      result.user,
      result.user?.status === "approved"
        ? "Email verified and account activated successfully!"
        : "Email verified successfully. Your account is pending admin approval.",
    )
  } catch (error) {
    return handleApiError(error, "POST /api/auth/verify-otp")
  }
}
