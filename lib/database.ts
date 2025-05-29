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

    // Create pending users table
    await sql`
      CREATE TABLE IF NOT EXISTS pending_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_USER', 'ADMIN_USER')),
        admin_email VARCHAR(255),
        otp_verified BOOLEAN DEFAULT false,
        admin_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
      )
    `

    // Create OTP codes table
    await sql`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('SIGNUP', 'PASSWORD_RESET', 'EMAIL_VERIFICATION')),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create upload logs table
    await sql`
      CREATE TABLE IF NOT EXISTS upload_logs (
        id VARCHAR(255) PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        total_records INTEGER NOT NULL,
        successful_records INTEGER DEFAULT 0,
        failed_records INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'processing',
        uploaded_by UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      )
    `

    // Create SOH data table
    await sql`
      CREATE TABLE IF NOT EXISTS soh_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_no VARCHAR(50) NOT NULL,
        storerkey VARCHAR(50) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        loc VARCHAR(50) NOT NULL,
        lot VARCHAR(50) NOT NULL,
        item_id VARCHAR(100) NOT NULL,
        qty_on_hand DECIMAL(10,2) NOT NULL,
        qty_allocated DECIMAL(10,2) NOT NULL,
        qty_available DECIMAL(10,2) NOT NULL,
        lottable01 VARCHAR(100),
        project_scope VARCHAR(100),
        lottable10 VARCHAR(100),
        project_id VARCHAR(100),
        wbs_element VARCHAR(100),
        sku_description TEXT,
        skugrp VARCHAR(50),
        received_date DATE,
        huid VARCHAR(100),
        owner_id VARCHAR(50),
        stdcube DECIMAL(10,4),
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        uploaded_by UUID NOT NULL
      )
    `

    // Create form progress table
    await sql`
      CREATE TABLE IF NOT EXISTS form_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_no VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('PRINTED', 'DISTRIBUTED', 'VERIFIED', 'INPUT', 'COMPLETED', 'ARCHIVED')),
        printed_at TIMESTAMP WITH TIME ZONE,
        distributed_at TIMESTAMP WITH TIME ZONE,
        verified_at TIMESTAMP WITH TIME ZONE,
        input_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        archived_at TIMESTAMP WITH TIME ZONE,
        assigned_to UUID,
        notes TEXT,
        updated_by UUID NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)`
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_users_email ON pending_users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_users_expires ON pending_users(expires_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_soh_data_form_no ON soh_data(form_no)`
    await sql`CREATE INDEX IF NOT EXISTS idx_form_progress_status ON form_progress(status)`

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
