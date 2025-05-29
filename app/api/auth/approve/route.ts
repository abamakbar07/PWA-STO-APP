import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PendingUserService } from "@/lib/services/pending-user.service"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return createErrorResponse("Missing token", 400, "MISSING_TOKEN")
    }

    // Get pending user
    const pendingUser = await PendingUserService.getPendingUserById(token)

    if (!pendingUser) {
      return createErrorResponse("Invalid or expired token", 400, "INVALID_TOKEN")
    }

    if (!pendingUser.otp_verified) {
      return createErrorResponse("Email not verified", 400, "EMAIL_NOT_VERIFIED")
    }

    if (pendingUser.admin_approved) {
      return createErrorResponse("User already approved", 400, "ALREADY_APPROVED")
    }

    // Approve user
    const approved = await PendingUserService.approvePendingUser(token)

    if (!approved) {
      return createErrorResponse("Failed to approve user", 500, "APPROVAL_FAILED")
    }

    return createSuccessResponse(
      {
        email: pendingUser.email,
        name: pendingUser.name,
      },
      "User approved successfully",
    )
  } catch (error) {
    return handleApiError(error, "GET /api/auth/approve")
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only super users can approve users
    if (!session || (session.user as any)?.role !== "SUPER_USER") {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED")
    }

    const body = await request.json()
    const { pendingUserId } = body

    if (!pendingUserId) {
      return createErrorResponse("Missing pending user ID", 400, "MISSING_ID")
    }

    // Get pending user
    const pendingUser = await PendingUserService.getPendingUserById(pendingUserId)

    if (!pendingUser) {
      return createErrorResponse("Pending user not found", 404, "USER_NOT_FOUND")
    }

    if (!pendingUser.otp_verified) {
      return createErrorResponse("Email not verified", 400, "EMAIL_NOT_VERIFIED")
    }

    if (pendingUser.admin_approved) {
      return createErrorResponse("User already approved", 400, "ALREADY_APPROVED")
    }

    // Approve user
    const approved = await PendingUserService.approvePendingUser(pendingUserId)

    if (!approved) {
      return createErrorResponse("Failed to approve user", 500, "APPROVAL_FAILED")
    }

    return createSuccessResponse(
      {
        email: pendingUser.email,
        name: pendingUser.name,
      },
      "User approved successfully",
    )
  } catch (error) {
    return handleApiError(error, "POST /api/auth/approve")
  }
}
