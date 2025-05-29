import { neon } from "@neondatabase/serverless"

// Validate environment variable
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not found - database features will be disabled")
}

let sql: ReturnType<typeof neon> | null = null

try {
  if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL)
  }
} catch (error) {
  console.error("Failed to initialize database connection:", error)
}

export { sql }

// Safe query function with error handling
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  if (!sql) {
    throw new Error("Database not available - DATABASE_URL not configured")
  }

  try {
    const result = await sql(text, params)
    return result as T[]
  } catch (error) {
    console.error("Database query error:", error)
    throw new Error(`Database operation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Safe database initialization
export async function initializeDatabase(): Promise<void> {
  if (!sql) {
    throw new Error("Database not available - DATABASE_URL not configured")
  }

  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_USER', 'ADMIN_USER')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)`

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization error:", error)
    throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Check if database is available
export function isDatabaseAvailable(): boolean {
  return sql !== null
}
