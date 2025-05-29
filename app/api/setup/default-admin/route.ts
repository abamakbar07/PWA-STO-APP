import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/database"
import { hashPassword } from "@/lib/auth/password"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    // Only allow this during initial setup or by super users
    if (session && (session.user as any)?.role !== "SUPER_USER") {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED")
    }

    if (!sql) {
      return createErrorResponse("Database not available", 503, "DATABASE_UNAVAILABLE")
    }

    const defaultAdminEmail = "muhamad.afriansyah@dsv.com"
    const defaultAdminPassword = "admin123" // Change this in production

    // Check if default admin already exists
    const [existingAdmin] = await sql`
      SELECT id, email, name FROM users WHERE email = ${defaultAdminEmail}
    `

    if (existingAdmin) {
      return createSuccessResponse(
        {
          email: existingAdmin.email,
          name: existingAdmin.name,
          exists: true,
        },
        "Default admin user already exists",
      )
    }

    // Create default admin user
    const passwordHash = await hashPassword(defaultAdminPassword)

    const [newAdmin] = await sql`
      INSERT INTO users (email, name, password_hash, role, is_active)
      VALUES (${defaultAdminEmail}, 'Muhamad Afriansyah', ${passwordHash}, 'SUPER_USER', true)
      RETURNING id, email, name, role, created_at
    `

    return createSuccessResponse(
      {
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        exists: false,
        created: true,
      },
      "Default admin user created successfully",
    )
  } catch (error) {
    return handleApiError(error, "POST /api/setup/default-admin")
  }
}

export async function GET() {
  try {
    if (!sql) {
      return createErrorResponse("Database not available", 503, "DATABASE_UNAVAILABLE")
    }

    const defaultAdminEmail = "muhamad.afriansyah@dsv.com"

    // Check if default admin exists
    const [existingAdmin] = await sql`
      SELECT id, email, name, role, is_active, created_at FROM users WHERE email = ${defaultAdminEmail}
    `

    if (existingAdmin) {
      return createSuccessResponse(
        {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role,
          isActive: existingAdmin.is_active,
          createdAt: existingAdmin.created_at,
          exists: true,
        },
        "Default admin user found",
      )
    } else {
      return createSuccessResponse(
        {
          email: defaultAdminEmail,
          exists: false,
        },
        "Default admin user not found",
      )
    }
  } catch (error) {
    return handleApiError(error, "GET /api/setup/default-admin")
  }
}
