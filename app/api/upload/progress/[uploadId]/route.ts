import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/database"
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response"

export async function GET(request: NextRequest, { params }: { params: { uploadId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED")
    }

    if (!sql) {
      return createErrorResponse("Database not available", 503, "DATABASE_UNAVAILABLE")
    }

    const uploadId = params.uploadId

    const [uploadLog] = await sql`
      SELECT 
        id,
        file_name,
        file_size,
        total_records,
        successful_records,
        failed_records,
        status,
        created_at,
        completed_at
      FROM upload_logs 
      WHERE id = ${uploadId} AND uploaded_by = ${(session.user as any).id}::uuid
    `

    if (!uploadLog) {
      return createErrorResponse("Upload not found", 404, "UPLOAD_NOT_FOUND")
    }

    const progress = {
      uploadId: uploadLog.id,
      fileName: uploadLog.file_name,
      fileSize: uploadLog.file_size,
      totalRecords: uploadLog.total_records,
      successfulRecords: uploadLog.successful_records || 0,
      failedRecords: uploadLog.failed_records || 0,
      status: uploadLog.status,
      createdAt: uploadLog.created_at,
      completedAt: uploadLog.completed_at,
      progressPercentage:
        uploadLog.total_records > 0
          ? Math.round(
              (((uploadLog.successful_records || 0) + (uploadLog.failed_records || 0)) / uploadLog.total_records) * 100,
            )
          : 0,
    }

    return createSuccessResponse(progress)
  } catch (error) {
    console.error("Error fetching upload progress:", error)
    return createErrorResponse("Failed to fetch upload progress", 500, "INTERNAL_ERROR")
  }
}
