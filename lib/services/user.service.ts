import { query, transaction } from "@/lib/database/connection"
import { hashPassword, verifyPassword, generateSessionToken } from "@/lib/auth/password"
import type { User, UserProfile, Session } from "@/lib/database/schema"
import { auditLog } from "./audit.service"

export class UserService {
  static async createUser(userData: {
    email: string
    name: string
    password: string
    role: "SUPER_USER" | "ADMIN_USER"
    createdBy: string
  }): Promise<User> {
    const { email, name, password, role, createdBy } = userData

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    const passwordHash = await hashPassword(password)

    return transaction(async (txQuery) => {
      // Create user
      const [user] = await txQuery<User>(
        `INSERT INTO users (email, name, password_hash, role, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [email, name, passwordHash, role, createdBy],
      )

      // Create user profile
      await txQuery(
        `INSERT INTO user_profiles (user_id)
         VALUES ($1)`,
        [user.id],
      )

      // Log the action
      await auditLog({
        userId: createdBy,
        action: "CREATE_USER",
        resource: "USER",
        resourceId: user.id,
        details: { email, name, role },
      })

      return user
    })
  }

  static async authenticateUser(email: string, password: string): Promise<{ user: User; sessionToken: string } | null> {
    const user = await this.getUserByEmail(email)
    if (!user || !user.is_active) {
      return null
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return null
    }

    // Update last login
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await query(
      `INSERT INTO sessions (user_id, session_token, expires)
       VALUES ($1, $2, $3)`,
      [user.id, sessionToken, expiresAt],
    )

    // Log the action
    await auditLog({
      userId: user.id,
      action: "LOGIN",
      resource: "SESSION",
      details: { email },
    })

    return { user, sessionToken }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await query<User>("SELECT * FROM users WHERE email = $1", [email])
    return user || null
  }

  static async getUserById(id: string): Promise<User | null> {
    const [user] = await query<User>("SELECT * FROM users WHERE id = $1", [id])
    return user || null
  }

  static async getUserWithProfile(id: string): Promise<(User & { profile: UserProfile }) | null> {
    const [result] = await query<User & { profile: UserProfile }>(
      `SELECT u.*, 
              json_build_object(
                'id', p.id,
                'user_id', p.user_id,
                'phone', p.phone,
                'department', p.department,
                'location', p.location,
                'avatar_url', p.avatar_url,
                'preferences', p.preferences,
                'created_at', p.created_at,
                'updated_at', p.updated_at
              ) as profile
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [id],
    )
    return result || null
  }

  static async updateUser(id: string, updates: Partial<User>, updatedBy: string): Promise<User> {
    const allowedFields = ["name", "email", "role", "is_active"]
    const updateFields = Object.keys(updates).filter((key) => allowedFields.includes(key))

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update")
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(", ")
    const values = updateFields.map((field) => updates[field as keyof User])
    values.push(id)

    const [user] = await query<User>(
      `UPDATE users SET ${setClause}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    )

    // Log the action
    await auditLog({
      userId: updatedBy,
      action: "UPDATE_USER",
      resource: "USER",
      resourceId: id,
      details: updates,
    })

    return user
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const allowedFields = ["phone", "department", "location", "avatar_url", "preferences"]
    const updateFields = Object.keys(updates).filter((key) => allowedFields.includes(key))

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update")
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(", ")
    const values = updateFields.map((field) => updates[field as keyof UserProfile])
    values.push(userId)

    const [profile] = await query<UserProfile>(
      `UPDATE user_profiles SET ${setClause}, updated_at = NOW()
       WHERE user_id = $${values.length}
       RETURNING *`,
      values,
    )

    return profile
  }

  static async deleteUser(id: string, deletedBy: string): Promise<void> {
    const user = await this.getUserById(id)
    if (!user) {
      throw new Error("User not found")
    }

    await transaction(async (txQuery) => {
      // Soft delete - deactivate user
      await txQuery("UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1", [id])

      // Invalidate all sessions
      await txQuery("DELETE FROM sessions WHERE user_id = $1", [id])

      // Log the action
      await auditLog({
        userId: deletedBy,
        action: "DELETE_USER",
        resource: "USER",
        resourceId: id,
        details: { email: user.email, name: user.name },
      })
    })
  }

  static async getAllUsers(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit

    const [{ count }] = await query<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE is_active = true")

    const users = await query<User>(
      `SELECT * FROM users 
       WHERE is_active = true 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    )

    return {
      users,
      total: Number.parseInt(count.toString()),
    }
  }

  static async validateSession(sessionToken: string): Promise<User | null> {
    const [session] = await query<Session & { user: User }>(
      `SELECT s.*, 
              json_build_object(
                'id', u.id,
                'email', u.email,
                'name', u.name,
                'role', u.role,
                'is_active', u.is_active,
                'created_at', u.created_at,
                'updated_at', u.updated_at,
                'last_login', u.last_login
              ) as user
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires > NOW() AND u.is_active = true`,
      [sessionToken],
    )

    return session?.user || null
  }

  static async invalidateSession(sessionToken: string): Promise<void> {
    await query("DELETE FROM sessions WHERE session_token = $1", [sessionToken])
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error("User not found")
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password_hash)
    if (!isValidPassword) {
      throw new Error("Current password is incorrect")
    }

    const newPasswordHash = await hashPassword(newPassword)

    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [newPasswordHash, userId])

    // Invalidate all other sessions
    await query("DELETE FROM sessions WHERE user_id = $1", [userId])

    // Log the action
    await auditLog({
      userId,
      action: "CHANGE_PASSWORD",
      resource: "USER",
      resourceId: userId,
      details: {},
    })
  }
}
