// Database schema definitions for PostgreSQL
export interface User {
  id: string
  email: string
  name: string
  password_hash: string
  role: "SUPER_USER" | "ADMIN_USER"
  is_active: boolean
  created_at: Date
  updated_at: Date
  last_login?: Date
  created_by?: string
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  user_id: string
  phone?: string
  department?: string
  location?: string
  avatar_url?: string
  preferences: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: string
  user_id: string
  session_token: string
  expires: Date
  created_at: Date
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: Date
}

export interface SOHData {
  id: string
  form_no: string
  storerkey: string
  sku: string
  loc: string
  lot: string
  item_id: string
  qty_on_hand: number
  qty_allocated: number
  qty_available: number
  lottable01?: string
  project_scope?: string
  lottable10?: string
  project_id?: string
  wbs_element?: string
  sku_description?: string
  skugrp?: string
  received_date?: Date
  huid?: string
  owner_id?: string
  stdcube?: number
  uploaded_at: Date
  uploaded_by: string
}

export interface FormProgress {
  id: string
  form_no: string
  status: "PRINTED" | "DISTRIBUTED" | "VERIFIED" | "INPUT" | "COMPLETED" | "ARCHIVED"
  printed_at?: Date
  distributed_at?: Date
  verified_at?: Date
  input_at?: Date
  completed_at?: Date
  archived_at?: Date
  assigned_to?: string
  notes?: string
  updated_by: string
  updated_at: Date
}

export interface CountingResult {
  id: string
  form_no: string
  sku: string
  loc: string
  lot: string
  counted_qty: number
  is_excess: boolean
  notes?: string
  counted_by: string
  counted_at: Date
  verified_by?: string
  verified_at?: Date
}
