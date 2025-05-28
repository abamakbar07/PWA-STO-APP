"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ArrowRight, Users, FileText, BarChart3 } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          <p>Loading STO Manager...</p>
        </div>
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Package className="h-16 w-16 mx-auto mb-6 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to STO Manager</h1>
            <p className="text-xl text-gray-600 mb-8">
              Hello, {session.user?.name}! Ready to manage your stock take operations?
            </p>
            <Button size="lg" onClick={() => router.push("/dashboard")} className="text-lg px-8 py-3">
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <FileText className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <CardTitle>Form Management</CardTitle>
                <CardDescription>Print and track counting forms</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <CardTitle>Data Input</CardTitle>
                <CardDescription>Enter and validate counting results</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-6 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">STO Manager</h1>
          <p className="text-xl text-gray-600 mb-8">Progressive Web Application for Stock Take Operations</p>
          <Button size="lg" onClick={() => router.push("/auth/signin")} className="text-lg px-8 py-3">
            Sign In to Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>Super Users and Admin Users with different permissions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Complete Workflow</CardTitle>
              <CardDescription>From SOH upload to final counting results</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <CardTitle>Real-time Tracking</CardTitle>
              <CardDescription>Monitor progress across all forms and stages</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
