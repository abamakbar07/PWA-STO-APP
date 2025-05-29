"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, HelpCircle, CheckCircle, Clock, RefreshCw } from "lucide-react"

interface EmailVerificationHelpProps {
  email: string
  onResend: () => Promise<void>
  resendLoading: boolean
  canResend: boolean
}

export function EmailVerificationHelp({ email, onResend, resendLoading, canResend }: EmailVerificationHelpProps) {
  const [showHelp, setShowHelp] = useState(false)

  const emailProvider = email.split("@")[1]?.toLowerCase()

  const getEmailProviderInfo = () => {
    if (emailProvider?.includes("gmail")) {
      return {
        name: "Gmail",
        checkUrl: "https://mail.google.com",
        tips: [
          "Check your Spam/Junk folder",
          "Look for emails from 'STO Manager'",
          "Add our email to your contacts to avoid spam filtering",
        ],
      }
    } else if (
      emailProvider?.includes("outlook") ||
      emailProvider?.includes("hotmail") ||
      emailProvider?.includes("live")
    ) {
      return {
        name: "Outlook",
        checkUrl: "https://outlook.live.com",
        tips: [
          "Check your Junk Email folder",
          "Look in the 'Other' tab if using Focused Inbox",
          "Add our sender to your Safe Senders list",
        ],
      }
    } else if (emailProvider?.includes("yahoo")) {
      return {
        name: "Yahoo Mail",
        checkUrl: "https://mail.yahoo.com",
        tips: ["Check your Spam folder", "Look for emails from 'STO Manager'", "Add our email to your contacts"],
      }
    } else {
      return {
        name: "Email Provider",
        checkUrl: `https://${emailProvider}`,
        tips: [
          "Check your spam/junk folder",
          "Look for emails from 'STO Manager'",
          "Contact your email administrator if needed",
        ],
      }
    }
  }

  const providerInfo = getEmailProviderInfo()

  return (
    <div className="space-y-4">
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Verification code sent to {email}</span>
            <Button variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)} className="h-auto p-1">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {showHelp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Verification Help
            </CardTitle>
            <CardDescription>Having trouble receiving the verification code? Here are some tips:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Wait a few minutes</h4>
                  <p className="text-sm text-gray-600">Email delivery can take 1-5 minutes. Please be patient.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Check {providerInfo.name}</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    {providerInfo.tips.map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open(providerInfo.checkUrl, "_blank")}
                  >
                    Open {providerInfo.name}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Resend Code</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    If you still don't see the email, you can request a new code.
                  </p>
                  <Button variant="outline" size="sm" onClick={onResend} disabled={resendLoading || !canResend}>
                    {resendLoading ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Resend Code
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Still having issues?</strong> Contact your system administrator for assistance. Make sure to
                provide your email address: {email}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
