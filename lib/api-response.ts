import { NextResponse } from "next/server"

export interface ApiError {
  error: string
  code?: string
  details?: any
}

export interface ApiSuccess<T = any> {
  data?: T
  message?: string
}

export function createErrorResponse(error: string, status = 500, code?: string, details?: any): NextResponse {
  const errorResponse: ApiError = {
    error,
    ...(code && { code }),
    ...(details && { details }),
  }

  return NextResponse.json(errorResponse, {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export function createSuccessResponse<T>(data?: T, message?: string, status = 200): NextResponse {
  const successResponse: ApiSuccess<T> = {
    ...(data && { data }),
    ...(message && { message }),
  }

  return NextResponse.json(successResponse, {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`API Error in ${context}:`, error)

  if (error instanceof Error) {
    // Handle known error types
    if (error.message.includes("duplicate key")) {
      return createErrorResponse("Resource already exists", 409, "DUPLICATE_RESOURCE")
    }

    if (error.message.includes("not found")) {
      return createErrorResponse("Resource not found", 404, "NOT_FOUND")
    }

    if (error.message.includes("unauthorized") || error.message.includes("permission")) {
      return createErrorResponse("Unauthorized access", 401, "UNAUTHORIZED")
    }

    // Generic error with message
    return createErrorResponse(error.message, 500, "INTERNAL_ERROR")
  }

  // Unknown error type
  return createErrorResponse("An unexpected error occurred", 500, "UNKNOWN_ERROR")
}
