import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserService } from "@/lib/services/user-service"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return createErrorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    if ((session.user as any)?.role !== "SUPER_USER") {
      return createErrorResponse("Insufficient permissions", 403, "FORBIDDEN")
    }

    const users = await UserService.getAllUsers()
    return createSuccessResponse({ users })
  } catch (error) {
    return handleApiError(error, "GET /api/users")
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return createErrorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    if ((session.user as any)?.role !== "SUPER_USER") {
      return createErrorResponse("Insufficient permissions", 403, "FORBIDDEN")
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return createErrorResponse("Invalid JSON in request body", 400, "INVALID_JSON")
    }

    const { email, name, password, role } = body

    // Validate required fields
    if (!email || !name || !password || !role) {
      return createErrorResponse("Missing required fields", 400, "VALIDATION_ERROR", {
        required: ["email", "name", "password", "role"],
      })
    }

    // Validate role
    if (!["SUPER_USER", "ADMIN_USER"].includes(role)) {
      return createErrorResponse("Invalid role", 400, "VALIDATION_ERROR", { validRoles: ["SUPER_USER", "ADMIN_USER"] })
    }

    const user = await UserService.createUser({ email, name, password, role })
    return createSuccessResponse(user, "User created successfully", 201)
  } catch (error) {
    return handleApiError(error, "POST /api/users")
  }
}
