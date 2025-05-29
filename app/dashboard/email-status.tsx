"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw, Send } from "lucide-react"
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

export function EmailStatusCard() {
  const [emailHealth, setEmailHealth] = useState<EmailHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkEmailHealth()
  }, [])

  const checkEmailHealth = async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    setTestLoading(true)
    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "test" }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Test email sent",
          description: "Check your email inbox for the test message",
        })
      } else {
        toast({
          title: "Failed to send test email",
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
      setTestLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Service Status
        </CardTitle>
        <CardDescription>Monitor email functionality and configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking email service...</span>
          </div>
        ) : emailHealth ? (
          <>
            <div className="flex items-center justify-between">
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
              <Button variant="outline" size="sm" onClick={checkEmailHealth}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            {emailHealth.healthy && emailHealth.config && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Host:</span>
                    <span className="font-mono">{emailHealth.config.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Port:</span>
                    <span className="font-mono">{emailHealth.config.port}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">From:</span>
                  <span className="font-mono text-xs truncate">{emailHealth.config.from}</span>
                </div>
              </div>
            )}

            {!emailHealth.healthy && emailHealth.error && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">{emailHealth.error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={sendTestEmail}
                disabled={testLoading || !emailHealth.healthy}
                className="flex-1"
              >
                {testLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                Test
              </Button>
            </div>
          </>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>Unable to check email service status</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
