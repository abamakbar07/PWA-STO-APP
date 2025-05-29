import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/database"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response"
import * as XLSX from "xlsx"

interface SOHRecord {
  formNo: string
  storerkey: string
  sku: string
  loc: string
  lot: string
  itemId: string
  qtyOnHand: number
  qtyAllocated: number
  qtyAvailable: number
  lottable01?: string
  projectScope?: string
  lottable10?: string
  projectId?: string
  wbsElement?: string
  skuDescription?: string
  skugrp?: string
  receivedDate?: string
  huid?: string
  ownerId?: string
  stdcube?: number
}

interface UploadResult {
  fileName: string
  totalRecords: number
  successfulRecords: number
  failedRecords: number
  errors: string[]
  uploadId: string
}

// Validate required columns
const REQUIRED_COLUMNS = [
  "FormNo",
  "Storerkey",
  "SKU",
  "Loc",
  "Lot",
  "ID",
  "Qty_OnHand",
  "Qty_Allocated",
  "Qty_Available",
]

function validateColumns(headers: string[]): string[] {
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !headers.some((header) => header.toLowerCase() === col.toLowerCase()),
  )
  return missingColumns
}

function normalizeColumnName(name: string): string {
  const columnMap: Record<string, string> = {
    formno: "FormNo",
    form_no: "FormNo",
    "form no": "FormNo",
    storerkey: "Storerkey",
    storer_key: "Storerkey",
    sku: "SKU",
    loc: "Loc",
    location: "Loc",
    lot: "Lot",
    id: "ID",
    item_id: "ID",
    itemid: "ID",
    qty_onhand: "Qty_OnHand",
    qtyonhand: "Qty_OnHand",
    "qty onhand": "Qty_OnHand",
    qty_allocated: "Qty_Allocated",
    qtyallocated: "Qty_Allocated",
    "qty allocated": "Qty_Allocated",
    qty_available: "Qty_Available",
    qtyavailable: "Qty_Available",
    "qty available": "Qty_Available",
    lottable01: "Lottable01",
    lottable_01: "Lottable01",
    project_scope: "Project_Scope",
    projectscope: "Project_Scope",
    lottable10: "Lottable10",
    lottable_10: "Lottable10",
    project_id: "Project_ID",
    projectid: "Project_ID",
    wbs_element: "WBS_Element",
    wbselement: "WBS_Element",
    sku_description: "SKU_Description",
    skudescription: "SKU_Description",
    skugrp: "SKUGRP",
    sku_grp: "SKUGRP",
    received_date: "Received_Date",
    receiveddate: "Received_Date",
    huid: "HUID",
    owner_id: "Owner_Id",
    ownerid: "Owner_Id",
    stdcube: "stdcube",
  }

  const normalized = name.toLowerCase().trim()
  return columnMap[normalized] || name
}

function parseCSV(content: string): any[] {
  const lines = content.split("\n").filter((line) => line.trim())
  if (lines.length < 2) throw new Error("CSV file must contain at least a header and one data row")

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const normalizedHeaders = headers.map(normalizeColumnName)

  const missingColumns = validateColumns(normalizedHeaders)
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`)
  }

  const records = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    if (values.length !== headers.length) continue

    const record: any = {}
    headers.forEach((header, index) => {
      const normalizedHeader = normalizeColumnName(header)
      record[normalizedHeader] = values[index]
    })
    records.push(record)
  }

  return records
}

function parseExcel(buffer: ArrayBuffer): any[] {
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error("Excel file contains no sheets")

  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

  if (jsonData.length < 2) throw new Error("Excel file must contain at least a header and one data row")

  const headers = jsonData[0].map((h: any) => String(h).trim())
  const normalizedHeaders = headers.map(normalizeColumnName)

  const missingColumns = validateColumns(normalizedHeaders)
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`)
  }

  const records = []
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row || row.length === 0) continue

    const record: any = {}
    headers.forEach((header, index) => {
      const normalizedHeader = normalizeColumnName(header)
      record[normalizedHeader] = row[index] || ""
    })
    records.push(record)
  }

  return records
}

function validateRecord(record: any, rowIndex: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!record.FormNo) errors.push(`Row ${rowIndex}: FormNo is required`)
  if (!record.Storerkey) errors.push(`Row ${rowIndex}: Storerkey is required`)
  if (!record.SKU) errors.push(`Row ${rowIndex}: SKU is required`)
  if (!record.Loc) errors.push(`Row ${rowIndex}: Loc is required`)
  if (!record.Lot) errors.push(`Row ${rowIndex}: Lot is required`)
  if (!record.ID) errors.push(`Row ${rowIndex}: ID is required`)

  // Validate numeric fields
  const numericFields = ["Qty_OnHand", "Qty_Allocated", "Qty_Available", "stdcube"]
  numericFields.forEach((field) => {
    if (record[field] !== undefined && record[field] !== "" && isNaN(Number(record[field]))) {
      errors.push(`Row ${rowIndex}: ${field} must be a valid number`)
    }
  })

  // Validate date field
  if (record.Received_Date && record.Received_Date !== "") {
    const date = new Date(record.Received_Date)
    if (isNaN(date.getTime())) {
      errors.push(`Row ${rowIndex}: Received_Date must be a valid date`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

async function insertSOHRecord(record: any, uploadedBy: string): Promise<void> {
  if (!sql) {
    throw new Error("Database not available")
  }

  // Ensure uploadedBy is a valid UUID
  if (!uploadedBy || uploadedBy.length < 36) {
    throw new Error("Invalid user ID format")
  }

  await sql`
    INSERT INTO soh_data (
      form_no, storerkey, sku, loc, lot, item_id,
      qty_on_hand, qty_allocated, qty_available,
      lottable01, project_scope, lottable10, project_id, wbs_element,
      sku_description, skugrp, received_date, huid, owner_id, stdcube,
      uploaded_by
    ) VALUES (
      ${record.FormNo}, ${record.Storerkey}, ${record.SKU}, ${record.Loc}, 
      ${record.Lot}, ${record.ID},
      ${Number(record.Qty_OnHand) || 0}, ${Number(record.Qty_Allocated) || 0}, 
      ${Number(record.Qty_Available) || 0},
      ${record.Lottable01 || null}, ${record.Project_Scope || null}, 
      ${record.Lottable10 || null}, ${record.Project_ID || null}, 
      ${record.WBS_Element || null},
      ${record.SKU_Description || null}, ${record.SKUGRP || null}, 
      ${record.Received_Date ? new Date(record.Received_Date) : null}, 
      ${record.HUID || null}, ${record.Owner_Id || null}, 
      ${Number(record.stdcube) || null},
      ${uploadedBy}::uuid
    )
  `
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "SUPER_USER") {
      return createErrorResponse("Unauthorized - Super User access required", 401, "UNAUTHORIZED")
    }

    if (!sql) {
      return createErrorResponse("Database not available", 503, "DATABASE_UNAVAILABLE")
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return createErrorResponse("No file provided", 400, "NO_FILE")
    }

    // Validate file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse("Invalid file type. Only CSV and Excel files are allowed", 400, "INVALID_FILE_TYPE")
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return createErrorResponse("File too large. Maximum size is 10MB", 400, "FILE_TOO_LARGE")
    }

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const userId = (session.user as any).id

    // Validate user ID format
    if (!userId || typeof userId !== "string") {
      return createErrorResponse("Invalid user session", 401, "INVALID_SESSION")
    }

    console.log("User ID for upload:", userId) // Debug log

    let records: any[] = []

    try {
      if (file.type === "text/csv") {
        const content = await file.text()
        records = parseCSV(content)
      } else {
        const buffer = await file.arrayBuffer()
        records = parseExcel(buffer)
      }
    } catch (parseError) {
      return createErrorResponse(
        `Failed to parse file: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        400,
        "PARSE_ERROR",
      )
    }

    if (records.length === 0) {
      return createErrorResponse("No valid records found in file", 400, "NO_RECORDS")
    }

    // Validate and insert records
    const result: UploadResult = {
      fileName: file.name,
      totalRecords: records.length,
      successfulRecords: 0,
      failedRecords: 0,
      errors: [],
      uploadId,
    }

    // Create upload log entry
    try {
      await sql`
        INSERT INTO upload_logs (
          id, file_name, file_size, total_records, uploaded_by, status
        ) VALUES (
          ${uploadId}, ${file.name}, ${file.size}, ${records.length}, ${userId}::uuid, 'processing'
        )
      `
    } catch (logError) {
      console.error("Failed to create upload log:", logError)
      return createErrorResponse("Failed to initialize upload tracking", 500, "LOG_CREATION_FAILED")
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const validation = validateRecord(record, i + 2) // +2 because row 1 is header, array is 0-indexed

      if (!validation.isValid) {
        result.errors.push(...validation.errors)
        result.failedRecords++
        continue
      }

      try {
        await insertSOHRecord(record, userId)
        result.successfulRecords++
      } catch (insertError) {
        const errorMessage = `Row ${i + 2}: ${insertError instanceof Error ? insertError.message : "Database insertion failed"}`
        result.errors.push(errorMessage)
        result.failedRecords++
      }
    }

    // Update upload log
    await sql`
      UPDATE upload_logs 
      SET 
        successful_records = ${result.successfulRecords},
        failed_records = ${result.failedRecords},
        status = ${result.failedRecords === 0 ? "completed" : "completed_with_errors"},
        completed_at = NOW()
      WHERE id = ${uploadId}
    `

    // Create form progress entries for unique form numbers
    const uniqueFormNos = [
      ...new Set(
        records
          .filter((_, i) => !result.errors.some((error) => error.includes(`Row ${i + 2}:`)))
          .map((record) => record.FormNo),
      ),
    ]

    for (const formNo of uniqueFormNos) {
      try {
        await sql`
          INSERT INTO form_progress (form_no, status, updated_by)
          VALUES (${formNo}, 'PRINTED', ${userId}::uuid)
          ON CONFLICT (form_no) DO NOTHING
        `
      } catch (error) {
        console.warn(`Failed to create form progress for ${formNo}:`, error)
      }
    }

    return createSuccessResponse(result, "File uploaded and processed successfully")
  } catch (error) {
    return handleApiError(error, "POST /api/upload")
  }
}
