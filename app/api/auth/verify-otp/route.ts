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
    const verified = await PendingUserService.verifyOTP(email, otp)

    if (!verified) {
      return createErrorResponse("Invalid or expired verification code", 400, "INVALID_OTP")
    }

    // Get pending user
    const pendingUser = await PendingUserService.getPendingUserByEmail(email)

    if (!pendingUser) {
      return createErrorResponse("User not found", 404, "USER_NOT_FOUND")
    }

    return createSuccessResponse(
      {
        email: pendingUser.email,
        name: pendingUser.name,
        admin_email: pendingUser.admin_email,
        otp_verified: pendingUser.otp_verified,
        admin_approved: pendingUser.admin_approved,
      },
      "Email verified successfully. Your account is pending admin approval.",
    )
  } catch (error) {
    return handleApiError(error, "POST /api/auth/verify-otp")
  }
}
