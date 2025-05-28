import { Pool } from "pg"

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = "DatabaseError"
  }
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows
  } catch (error) {
    console.error("Database query error:", error)
    throw new DatabaseError("Database operation failed")
  } finally {
    client.release()
  }
}

export async function transaction<T>(callback: (query: typeof query) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const transactionQuery = async <U = any>(text: string, params?: any[]): Promise<U[]> => {
      const result = await client.query(text, params)
      return result.rows
    }
    const result = await callback(transactionQuery)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// Initialize database tables
export async function initializeDatabase() {
  const createTables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_USER', 'ADMIN_USER')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_login TIMESTAMP WITH TIME ZONE,
      created_by UUID REFERENCES users(id)
    );

    -- User profiles table
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      phone VARCHAR(20),
      department VARCHAR(100),
      location VARCHAR(100),
      avatar_url TEXT,
      preferences JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      expires TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Audit logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      resource VARCHAR(100) NOT NULL,
      resource_id VARCHAR(255),
      details JSONB DEFAULT '{}',
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- SOH data table
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
      uploaded_by UUID NOT NULL REFERENCES users(id)
    );

    -- Form progress table
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
      assigned_to UUID REFERENCES users(id),
      notes TEXT,
      updated_by UUID NOT NULL REFERENCES users(id),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Counting results table
    CREATE TABLE IF NOT EXISTS counting_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      form_no VARCHAR(50) NOT NULL,
      sku VARCHAR(100) NOT NULL,
      loc VARCHAR(50) NOT NULL,
      lot VARCHAR(50) NOT NULL,
      counted_qty DECIMAL(10,2) NOT NULL,
      is_excess BOOLEAN DEFAULT false,
      notes TEXT,
      counted_by UUID NOT NULL REFERENCES users(id),
      counted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      verified_by UUID REFERENCES users(id),
      verified_at TIMESTAMP WITH TIME ZONE
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_soh_data_form_no ON soh_data(form_no);
    CREATE INDEX IF NOT EXISTS idx_soh_data_sku ON soh_data(sku);
    CREATE INDEX IF NOT EXISTS idx_form_progress_status ON form_progress(status);
    CREATE INDEX IF NOT EXISTS idx_counting_results_form_no ON counting_results(form_no);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

    -- Update triggers
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_form_progress_updated_at BEFORE UPDATE ON form_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `

  try {
    await query(createTables)
    console.log("Database tables initialized successfully")
  } catch (error) {
    console.error("Failed to initialize database:", error)
    throw error
  }
}
