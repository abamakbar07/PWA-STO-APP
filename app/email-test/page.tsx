"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Send, CheckCircle, XCircle, Loader2, RefreshCw, Settings } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useToast } from "@/hooks/use-toast"

interface EmailHealth {
  healthy: boolean
  config?: {
    host: string
    port: number
    secure: boolean
    from: string
  }
  error?: string
}

export default function EmailTestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [emailHealth, setEmailHealth] = useState<EmailHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [testForm, setTestForm] = useState({
    to: "",
    type: "test",
    name: "Test User",
    otpCode: "123456",
    purpose: "Test Verification",
  })

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
      checkEmailHealth()
    }
  }, [status, userRole])

  const checkEmailHealth = async () => {
    try {
      const response = await fetch("/api/email/test")
      const data = await response.json()

      if (response.ok) {
        setEmailHealth({
          healthy: true,
          config: data.data.config,
        })
      } else {
        setEmailHealth({
          healthy: false,
          error: data.error,
        })
      }
    } catch (error) {
      setEmailHealth({
        healthy: false,
        error: "Failed to check email service health",
      })
    }
  }

  const sendTestEmail = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testForm),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Email sent successfully",
          description: `Test email sent to ${testForm.to || "default recipient"}`,
        })
      } else {
        toast({
          title: "Failed to send email",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p>Loading email test page...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Service Testing
          </h1>
          <p className="text-gray-600 mt-2">Test and monitor email functionality for STO Manager</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email Health Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Service Health
              </CardTitle>
              <CardDescription>Current email service status and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailHealth ? (
                <>
                  <div className="flex items-center gap-2">
                    {emailHealth.healthy ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge variant={emailHealth.healthy ? "default" : "destructive"}>
                      {emailHealth.healthy ? "Healthy" : "Unhealthy"}
                    </Badge>
                  </div>

                  {emailHealth.healthy && emailHealth.config && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Host:</span>
                        <span className="font-mono">{emailHealth.config.host}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Port:</span>
                        <span className="font-mono">{emailHealth.config.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Secure:</span>
                        <span className="font-mono">{emailHealth.config.secure ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">From:</span>
                        <span className="font-mono text-xs">{emailHealth.config.from}</span>
                      </div>
                    </div>
                  )}

                  {!emailHealth.healthy && emailHealth.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{emailHealth.error}</AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking email service...</span>
                </div>
              )}

              <Button variant="outline" onClick={checkEmailHealth} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </CardContent>
          </Card>

          {/* Email Testing */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Test Email
              </CardTitle>
              <CardDescription>Test different types of emails sent by the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Test</TabsTrigger>
                  <TabsTrigger value="otp">OTP Email</TabsTrigger>
                  <TabsTrigger value="welcome">Welcome</TabsTrigger>
                  <TabsTrigger value="approval">Approval</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="to-basic">Recipient Email</Label>
                    <Input
                      id="to-basic"
                      type="email"
                      placeholder="Enter recipient email (optional)"
                      value={testForm.to}
                      onChange={(e) => setTestForm({ ...testForm, to: e.target.value, type: "test" })}
                    />
                    <p className="text-xs text-gray-500">Leave empty to use default recipient from configuration</p>
                  </div>

                  <Button onClick={sendTestEmail} disabled={loading || !emailHealth?.healthy} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Basic Test Email
                  </Button>
                </TabsContent>

                <TabsContent value="otp" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="to-otp">Recipient Email</Label>
                      <Input
                        id="to-otp"
                        type="email"
                        placeholder="Enter recipient email"
                        value={testForm.to}
                        onChange={(e) => setTestForm({ ...testForm, to: e.target.value, type: "otp" })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Recipient Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter recipient name"
                        value={testForm.name}
                        onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otp">OTP Code</Label>
                      <Input
                        id="otp"
                        placeholder="Enter OTP code"
                        value={testForm.otpCode}
                        onChange={(e) => setTestForm({ ...testForm, otpCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Purpose</Label>
                      <Input
                        id="purpose"
                        placeholder="Enter verification purpose"
                        value={testForm.purpose}
                        onChange={(e) => setTestForm({ ...testForm, purpose: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={sendTestEmail} disabled={loading || !emailHealth?.healthy} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send OTP Email
                  </Button>
                </TabsContent>

                <TabsContent value="welcome" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="to-welcome">Recipient Email</Label>
                      <Input
                        id="to-welcome"
                        type="email"
                        placeholder="Enter recipient email"
                        value={testForm.to}
                        onChange={(e) => setTestForm({ ...testForm, to: e.target.value, type: "welcome" })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userName">User Name</Label>
                      <Input
                        id="userName"
                        placeholder="Enter user name"
                        value={testForm.name}
                        onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={sendTestEmail} disabled={loading || !emailHealth?.healthy} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Welcome Email
                  </Button>
                </TabsContent>

                <TabsContent value="approval" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Admin Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="Enter admin email"
                        value={testForm.to}
                        onChange={(e) => setTestForm({ ...testForm, to: e.target.value, type: "approval" })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-name-approval">User Name</Label>
                      <Input
                        id="user-name-approval"
                        placeholder="Enter user name"
                        value={testForm.name}
                        onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={sendTestEmail} disabled={loading || !emailHealth?.healthy} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Approval Request
                  </Button>
                </TabsContent>
              </Tabs>

              {!emailHealth?.healthy && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Email service is not healthy. Please check your email configuration before sending test emails.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Environment Variables Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Email Configuration Guide</CardTitle>
            <CardDescription>Required environment variables for email functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Required Environment Variables:</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>EMAIL_HOST=smtp.gmail.com</div>
                  <div>EMAIL_PORT=587</div>
                  <div>EMAIL_USER=your-email@gmail.com</div>
                  <div>EMAIL_PASS=your-app-password</div>
                  <div>TO_EMAIL=default-recipient@example.com</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Gmail Configuration Notes:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use App Passwords instead of your regular Gmail password</li>
                  <li>• Enable 2-Factor Authentication on your Gmail account</li>
                  <li>• Generate an App Password in Google Account settings</li>
                  <li>• Use port 587 for TLS or port 465 for SSL</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Other SMTP Providers:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <strong>Outlook/Hotmail:</strong>
                    <div className="font-mono text-xs mt-1">
                      <div>HOST: smtp-mail.outlook.com</div>
                      <div>PORT: 587</div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <strong>Yahoo Mail:</strong>
                    <div className="font-mono text-xs mt-1">
                      <div>HOST: smtp.mail.yahoo.com</div>
                      <div>PORT: 587</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
