import type { NextRequest } from "next/server"
import { PendingUserService } from "@/lib/services/pending-user.service"
import { sql } from "@/lib/database"
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

    if (!sql) {
      return createErrorResponse("Database not available", 503, "DATABASE_UNAVAILABLE")
    }

    // Check if user already exists in users table
    const [existingUser] = await sql`
      SELECT id, email, name FROM users WHERE email = ${email}
    `

    if (existingUser) {
      return createErrorResponse("An account with this email already exists", 409, "USER_EXISTS")
    }

    // Check if there's already a pending registration
    const [existingPendingUser] = await sql`
      SELECT id, email, name, otp_verified, admin_approved, expires_at 
      FROM pending_users 
      WHERE email = ${email}
      AND expires_at > NOW()
    `

    if (existingPendingUser) {
      if (!existingPendingUser.otp_verified) {
        // Pending user exists but OTP not verified - redirect to OTP verification
        return createSuccessResponse(
          {
            email: existingPendingUser.email,
            name: existingPendingUser.name,
            status: "pending_otp_verification",
            redirect_to_otp: true,
          },
          "A registration with this email is already in progress. Please verify your email.",
          200,
        )
      } else if (!existingPendingUser.admin_approved) {
        // OTP verified but waiting for admin approval
        return createSuccessResponse(
          {
            email: existingPendingUser.email,
            name: existingPendingUser.name,
            status: "pending_admin_approval",
          },
          "Your email is verified and your account is pending admin approval.",
          200,
        )
      }
    }

    // Create new pending user
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
        status: "otp_sent",
        created_at: pendingUser.created_at,
      },
      "Signup successful. Please verify your email.",
      201,
    )
  } catch (error) {
    return handleApiError(error, "POST /api/auth/signup")
  }
}
