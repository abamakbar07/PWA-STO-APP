import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/database"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return createErrorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    if ((session.user as any)?.role !== "SUPER_USER") {
      return createErrorResponse("Insufficient permissions", 403, "FORBIDDEN")
    }

    if (!sql) {
      return createErrorResponse("Database not available", 503, "DATABASE_UNAVAILABLE")
    }

    // Get pending users
    const pendingUsers = await sql`
      SELECT * FROM pending_users
      WHERE otp_verified = true
      AND admin_approved = false
      AND expires_at > NOW()
      ORDER BY created_at DESC
    `

    return createSuccessResponse({ pendingUsers })
  } catch (error) {
    return handleApiError(error, "GET /api/users/pending")
  }
}
