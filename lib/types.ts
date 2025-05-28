export interface User {
  id: string
  email: string
  name: string
  role: "SUPER_USER" | "ADMIN_USER"
  createdAt: Date
  updatedAt: Date
}

export interface SOHRecord {
  id: string
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
  receivedDate?: Date
  huid?: string
  ownerId?: string
  stdcube?: number
  uploadedAt: Date
  uploadedBy: string
}

export interface FormProgress {
  id: string
  formNo: string
  status: "PRINTED" | "DISTRIBUTED" | "VERIFIED" | "INPUT" | "COMPLETED" | "ARCHIVED"
  printedAt?: Date
  distributedAt?: Date
  verifiedAt?: Date
  inputAt?: Date
  completedAt?: Date
  archivedAt?: Date
  assignedTo?: string
  notes?: string
  updatedBy: string
  updatedAt: Date
}

export interface CountingResult {
  id: string
  formNo: string
  sku: string
  loc: string
  lot: string
  countedQty: number
  isExcess: boolean
  notes?: string
  countedBy: string
  countedAt: Date
}

export type FormStatus = FormProgress["status"]
