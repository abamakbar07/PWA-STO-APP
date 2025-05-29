import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { sql } from "@/lib/database"
import { verifyPassword } from "@/lib/auth/password"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check if database is available
          if (!sql) {
            console.error("Database not available")

            // Fallback to demo users if database is not available
            const demoUsers = [
              {
                id: "550e8400-e29b-41d4-a716-446655440001",
                email: "super@sto.com",
                name: "Super User",
                role: "SUPER_USER",
                password: "super123",
              },
              {
                id: "550e8400-e29b-41d4-a716-446655440002",
                email: "admin@sto.com",
                name: "Admin User",
                role: "ADMIN_USER",
                password: "admin123",
              },
            ]

            const demoUser = demoUsers.find((u) => u.email === credentials.email && u.password === credentials.password)

            if (demoUser) {
              return {
                id: demoUser.id,
                email: demoUser.email,
                name: demoUser.name,
                role: demoUser.role,
              }
            }

            return null
          }

          // Check for the default admin user first
          if (credentials.email === "muhamad.afriansyah@dsv.com") {
            const [user] = await sql`
              SELECT * FROM users WHERE email = ${credentials.email} AND is_active = true
            `

            if (user) {
              const isValidPassword = await verifyPassword(credentials.password, user.password_hash)

              if (isValidPassword) {
                // Update last login
                await sql`
                  UPDATE users SET last_login = NOW() WHERE id = ${user.id}
                `

                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                }
              }
            }
          }

          // Check regular users
          const [user] = await sql`
            SELECT * FROM users WHERE email = ${credentials.email} AND is_active = true
          `

          if (!user) {
            return null
          }

          const isValidPassword = await verifyPassword(credentials.password, user.password_hash)

          if (!isValidPassword) {
            return null
          }

          // Update last login
          await sql`
            UPDATE users SET last_login = NOW() WHERE id = ${user.id}
          `

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
