"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useToast } from "@/hooks/use-toast"

interface PendingUser {
  id: string
  email: string
  name: string
  role: "SUPER_USER" | "ADMIN_USER"
  admin_email: string | null
  otp_verified: boolean
  admin_approved: boolean
  created_at: string
  expires_at: string
}

export default function PendingUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (userRole !== "SUPER_USER") {
      router.push("/dashboard")
      return
    }
  }, [status, userRole, router])

  useEffect(() => {
    if (status === "authenticated" && userRole === "SUPER_USER") {
      fetchPendingUsers()
    }
  }, [status, userRole])

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch("/api/users/pending")
      if (response.ok) {
        const data = await response.json()
        setPendingUsers(data.pendingUsers || [])
      } else {
        console.error("Failed to fetch pending users")
        setPendingUsers([])
      }
    } catch (error) {
      console.error("Error fetching pending users:", error)
      setPendingUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (pendingUserId: string) => {
    setApproving(pendingUserId)

    try {
      const response = await fetch("/api/auth/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pendingUserId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User approved successfully",
        })
        fetchPendingUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to approve user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      })
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (pendingUserId: string) => {
    // Implement rejection logic
    toast({
      title: "Not implemented",
      description: "Rejection functionality is not yet implemented",
      variant: "destructive",
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p>Loading pending users...</p>
        </div>
      </div>
    )
  }

  if (userRole !== "SUPER_USER") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8" />
              Pending User Requests
            </h1>
            <p className="text-gray-600 mt-2">Approve or reject new user registration requests</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approval Requests</CardTitle>
            <CardDescription>New users who have signed up and verified their email addresses</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <Alert>
                <AlertDescription>No pending user requests found.</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.admin_email && (
                            <div className="text-xs text-gray-400">Requested by: {user.admin_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "SUPER_USER" ? "default" : "secondary"}>
                          {user.role === "SUPER_USER" ? "Super User" : "Admin User"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.otp_verified ? (
                          <Badge variant="success" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Email Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Verification
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(user.expires_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(user.id)}
                            disabled={approving === user.id || !user.otp_verified}
                          >
                            {approving === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(user.id)}
                            disabled={approving === user.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
