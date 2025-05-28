import { query } from "@/lib/database/connection"
import type { AuditLog } from "@/lib/database/schema"

interface AuditLogData {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function auditLog(data: AuditLogData): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.userId || null,
        data.action,
        data.resource,
        data.resourceId || null,
        JSON.stringify(data.details || {}),
        data.ipAddress || null,
        data.userAgent || null,
      ],
    )
  } catch (error) {
    console.error("Failed to log audit entry:", error)
    // Don't throw error to avoid breaking the main operation
  }
}

export async function getAuditLogs(
  filters: {
    userId?: string
    action?: string
    resource?: string
    startDate?: Date
    endDate?: Date
  } = {},
  page = 1,
  limit = 50,
): Promise<{ logs: AuditLog[]; total: number }> {
  const offset = (page - 1) * limit
  const conditions: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (filters.userId) {
    conditions.push(`user_id = $${paramIndex++}`)
    values.push(filters.userId)
  }

  if (filters.action) {
    conditions.push(`action = $${paramIndex++}`)
    values.push(filters.action)
  }

  if (filters.resource) {
    conditions.push(`resource = $${paramIndex++}`)
    values.push(filters.resource)
  }

  if (filters.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`)
    values.push(filters.startDate)
  }

  if (filters.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`)
    values.push(filters.endDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  // Get total count
  const [{ count }] = await query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`, values)

  // Get logs with pagination
  const logs = await query<AuditLog>(
    `SELECT * FROM audit_logs ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...values, limit, offset],
  )

  return {
    logs,
    total: Number.parseInt(count.toString()),
  }
}
