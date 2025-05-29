"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download, X, FileX, Clock } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useToast } from "@/hooks/use-toast"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  recordCount: number
  successfulRecords: number
  failedRecords: number
  status: "processing" | "completed" | "completed_with_errors" | "error"
  errors?: string[]
}

interface UploadProgress {
  uploadId: string
  fileName: string
  fileSize: number
  totalRecords: number
  successfulRecords: number
  failedRecords: number
  status: string
  progressPercentage: number
  createdAt: string
  completedAt?: string
}

export default function UploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const userRole = (session?.user as any)?.role

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(
      (file) =>
        file.type === "text/csv" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel",
    )

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Invalid file type",
        description: "Please select only CSV or Excel files",
        variant: "destructive",
      })
    }

    setFiles((prev) => [...prev, ...validFiles])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const pollUploadProgress = async (uploadId: string) => {
    try {
      const response = await fetch(`/api/upload/progress/${uploadId}`)
      if (response.ok) {
        const data = await response.json()
        setUploadProgress(data.data)

        if (
          data.data.status === "completed" ||
          data.data.status === "completed_with_errors" ||
          data.data.status === "error"
        ) {
          // Upload finished, add to uploaded files list
          const newUploadedFile: UploadedFile = {
            id: data.data.uploadId,
            name: data.data.fileName,
            size: data.data.fileSize,
            type: "application/octet-stream",
            uploadedAt: new Date(data.data.createdAt),
            recordCount: data.data.totalRecords,
            successfulRecords: data.data.successfulRecords,
            failedRecords: data.data.failedRecords,
            status: data.data.status,
          }

          setUploadedFiles((prev) => [newUploadedFile, ...prev])
          setUploadProgress(null)

          if (data.data.status === "completed") {
            toast({
              title: "Upload successful",
              description: `${data.data.successfulRecords} records uploaded successfully`,
            })
          } else if (data.data.status === "completed_with_errors") {
            toast({
              title: "Upload completed with errors",
              description: `${data.data.successfulRecords} successful, ${data.data.failedRecords} failed`,
              variant: "destructive",
            })
          }
          return false // Stop polling
        }
        return true // Continue polling
      }
    } catch (error) {
      console.error("Error polling upload progress:", error)
      return false
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          const uploadId = result.data.uploadId

          // Start polling for progress
          const pollInterval = setInterval(async () => {
            const shouldContinue = await pollUploadProgress(uploadId)
            if (!shouldContinue) {
              clearInterval(pollInterval)
            }
          }, 1000)

          // Initial progress fetch
          await pollUploadProgress(uploadId)
        } else {
          const error = await response.json()
          toast({
            title: "Upload failed",
            description: error.error || "An error occurred during file upload",
            variant: "destructive",
          })
        }
      }

      setFiles([])
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An error occurred during file upload",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "completed_with_errors":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <FileX className="h-4 w-4 text-red-600" />
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <FileSpreadsheet className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "completed_with_errors":
        return <Badge variant="destructive">With Errors</Badge>
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      case "processing":
        return <Badge variant="secondary">Processing</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Redirect if not super user
  if (userRole !== "SUPER_USER") {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload SOH Data</h1>
          <p className="text-gray-600 mt-2">Upload Stock On Hand data files (CSV or Excel format)</p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upload">File Upload</TabsTrigger>
            <TabsTrigger value="history">Upload History</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    File Upload
                  </CardTitle>
                  <CardDescription>
                    Select CSV or Excel files containing SOH data with pre-assigned FormNo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Drag and Drop Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to browse</p>
                    <p className="text-sm text-gray-500 mb-4">Supports CSV and Excel files up to 10MB</p>
                    <Input
                      type="file"
                      multiple
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload">
                      <Button variant="outline" disabled={uploading} asChild>
                        <span>Select Files</span>
                      </Button>
                    </Label>
                  </div>

                  {/* Selected Files */}
                  {files.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Selected Files:</h4>
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploadProgress && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Processing: {uploadProgress.fileName}</span>
                        <span className="text-sm text-gray-500">{uploadProgress.progressPercentage}%</span>
                      </div>
                      <Progress value={uploadProgress.progressPercentage} />
                      <div className="text-xs text-gray-600">
                        {uploadProgress.successfulRecords + uploadProgress.failedRecords} of{" "}
                        {uploadProgress.totalRecords} records processed
                      </div>
                    </div>
                  )}

                  <Button onClick={handleUpload} disabled={files.length === 0 || uploading} className="w-full">
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                      </>
                    )}
                  </Button>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Required columns:</strong> FormNo, Storerkey, SKU, Loc, Lot, ID, Qty_OnHand,
                      Qty_Allocated, Qty_Available
                      <br />
                      <strong>Optional columns:</strong> Lottable01, Project_Scope, Lottable10, Project_ID, WBS_Element,
                      SKU_Description, SKUGRP, Received_Date, HUID, Owner_Id, stdcube
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Upload Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Requirements</CardTitle>
                  <CardDescription>File format and data requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Supported File Types</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• CSV files (.csv)</li>
                      <li>• Excel files (.xlsx, .xls)</li>
                      <li>• Maximum file size: 10MB</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Required Columns</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • <strong>FormNo:</strong> Form identifier
                      </li>
                      <li>
                        • <strong>Storerkey:</strong> Store key
                      </li>
                      <li>
                        • <strong>SKU:</strong> Stock keeping unit
                      </li>
                      <li>
                        • <strong>Loc:</strong> Location
                      </li>
                      <li>
                        • <strong>Lot:</strong> Lot number
                      </li>
                      <li>
                        • <strong>ID:</strong> Item identifier
                      </li>
                      <li>
                        • <strong>Qty_OnHand:</strong> Quantity on hand
                      </li>
                      <li>
                        • <strong>Qty_Allocated:</strong> Allocated quantity
                      </li>
                      <li>
                        • <strong>Qty_Available:</strong> Available quantity
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Data Validation</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• All required fields must have values</li>
                      <li>• Quantity fields must be numeric</li>
                      <li>• Dates must be in valid format</li>
                      <li>• Duplicate FormNo entries are allowed</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Upload History</CardTitle>
                <CardDescription>Recently uploaded SOH data files and their processing status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadedFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No files uploaded yet</p>
                    </div>
                  ) : (
                    uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(file.status)}
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {file.recordCount.toLocaleString()} total records • {formatFileSize(file.size)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {file.successfulRecords.toLocaleString()} successful
                              {file.failedRecords > 0 && ` • ${file.failedRecords.toLocaleString()} failed`}
                            </p>
                            <p className="text-xs text-gray-400">{file.uploadedAt.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(file.status)}
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
