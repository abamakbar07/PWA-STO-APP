import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  email: string
  name: string
  role: "SUPER_USER" | "ADMIN_USER"
  is_active: boolean
  created_at: Date
  updated_at: Date
  last_login?: Date
}

export class UserService {
  static async createUser(userData: {
    email: string
    name: string
    password: string
    role: "SUPER_USER" | "ADMIN_USER"
  }): Promise<User> {
    const { email, name, password, role } = userData

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    try {
      const [user] = await sql`
        INSERT INTO users (email, name, password_hash, role)
        VALUES (${email}, ${name}, ${passwordHash}, ${role})
        RETURNING id, email, name, role, is_active, created_at, updated_at, last_login
      `

      return user as User
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate key")) {
        throw new Error("User with this email already exists")
      }
      throw new Error("Failed to create user")
    }
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      const users = await sql`
        SELECT id, email, name, role, is_active, created_at, updated_at, last_login
        FROM users 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `

      return users as User[]
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const [user] = await sql`
        SELECT id, email, name, role, is_active, created_at, updated_at, last_login
        FROM users 
        WHERE id = ${id} AND is_active = true
      `

      return (user as User) || null
    } catch (error) {
      console.error("Error fetching user:", error)
      return null
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      await sql`
        UPDATE users 
        SET is_active = false, updated_at = NOW() 
        WHERE id = ${id}
      `
    } catch (error) {
      throw new Error("Failed to delete user")
    }
  }
}
