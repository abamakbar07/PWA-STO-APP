import type { NextRequest } from "next/server"
import { PendingUserService } from "@/lib/services/pending-user.service"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, adminEmail } = body

    // Validate required fields
    if (!email || !name || !password) {
      return createErrorResponse("Missing required fields", 400, "VALIDATION_ERROR")
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return createErrorResponse("Invalid email format", 400, "VALIDATION_ERROR")
    }

    // Validate password length
    if (password.length < 8) {
      return createErrorResponse("Password must be at least 8 characters", 400, "VALIDATION_ERROR")
    }

    // Create pending user
    const { pendingUser } = await PendingUserService.createPendingUser({
      email,
      name,
      password,
      role: "ADMIN_USER", // Default role for new signups
      adminEmail: adminEmail || "muhamad.afriansyah@dsv.com", // Default admin email if not provided
    })

    return createSuccessResponse(
      {
        email: pendingUser.email,
        name: pendingUser.name,
        created_at: pendingUser.created_at,
      },
      "Signup successful. Please verify your email.",
      201,
    )
  } catch (error) {
    return handleApiError(error, "POST /api/auth/signup")
  }
}
