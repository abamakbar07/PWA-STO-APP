"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, BarChart3, Users, Package, CheckCircle, Clock, TrendingUp, Download } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { EmailStatusCard } from "./email-status"

interface DashboardStats {
  totalForms: number
  completedForms: number
  pendingForms: number
  totalItems: number
  completionRate: number
  recentActivity: Array<{
    id: string
    action: string
    formNo: string
    timestamp: Date
    user: string
  }>
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalForms: 0,
    completedForms: 0,
    pendingForms: 0,
    totalItems: 0,
    completionRate: 0,
    recentActivity: [],
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      // Simulate loading dashboard data
      setStats({
        totalForms: 45,
        completedForms: 32,
        pendingForms: 13,
        totalItems: 1250,
        completionRate: 71,
        recentActivity: [
          {
            id: "1",
            action: "Form Completed",
            formNo: "STO-2024-001",
            timestamp: new Date(),
            user: "John Doe",
          },
          {
            id: "2",
            action: "Form Distributed",
            formNo: "STO-2024-002",
            timestamp: new Date(Date.now() - 3600000),
            user: "Jane Smith",
          },
        ],
      })
    }
  }, [status])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  const userRole = (session?.user as any)?.role

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">STO Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session?.user?.name} ({userRole})
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalForms}</div>
              <p className="text-xs text-muted-foreground">Active stock take forms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedForms}</div>
              <p className="text-xs text-muted-foreground">Forms completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingForms}</div>
              <p className="text-xs text-muted-foreground">Forms in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Items to count</p>
            </CardContent>
          </Card>
        </div>

        {/* System Status for Super Users */}
        {userRole === "SUPER_USER" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EmailStatusCard />
            {/* Add more system status cards here in the future */}
          </div>
        )}

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Progress
            </CardTitle>
            <CardDescription>Stock take operation completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-muted-foreground">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.completedForms} completed</span>
                <span>{stats.pendingForms} remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Tabs defaultValue="actions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userRole === "SUPER_USER" && (
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-blue-600" />
                      Upload SOH Data
                    </CardTitle>
                    <CardDescription>Upload new Stock On Hand data files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => router.push("/upload")}>
                      Upload Files
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Print Forms
                  </CardTitle>
                  <CardDescription>Generate and print counting forms</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" onClick={() => router.push("/forms")}>
                    Manage Forms
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Input Counts
                  </CardTitle>
                  <CardDescription>Enter physical counting results</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" onClick={() => router.push("/counting")}>
                    Input Data
                  </Button>
                </CardContent>
              </Card>

              {userRole === "SUPER_USER" && (
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      Manage Users
                    </CardTitle>
                    <CardDescription>Add and manage admin users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline" onClick={() => router.push("/users")}>
                      User Management
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-indigo-600" />
                    Export Reports
                  </CardTitle>
                  <CardDescription>Download counting reports and summaries</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" onClick={() => router.push("/reports")}>
                    Generate Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions performed in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">
                            Form: {activity.formNo} by {activity.user}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{activity.timestamp.toLocaleTimeString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
