"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package, ArrowLeft, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SignupForm {
  email: string
  name: string
  password: string
  confirmPassword: string
  adminEmail: string
}

export default function SignUp() {
  const [form, setForm] = useState<SignupForm>({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    adminEmail: "",
  })
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"form" | "otp" | "success">("form")
  const [otp, setOtp] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!form.email) newErrors.push("Email is required")
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.push("Email is invalid")

    if (!form.name) newErrors.push("Name is required")
    if (!form.password) newErrors.push("Password is required")
    else if (form.password.length < 8) newErrors.push("Password must be at least 8 characters")

    if (form.password !== form.confirmPassword) newErrors.push("Passwords do not match")

    if (!form.adminEmail) newErrors.push("Admin email is required for approval")
    else if (!/\S+@\S+\.\S+/.test(form.adminEmail)) newErrors.push("Admin email is invalid")

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formErrors = validateForm()

    if (formErrors.length > 0) {
      setErrors(formErrors)
      return
    }

    setErrors([])
    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          password: form.password,
          adminEmail: form.adminEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors([data.error || "An error occurred during signup"])
        setLoading(false)
        return
      }

      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code",
      })

      setStep("otp")
    } catch (error) {
      setErrors(["An error occurred during signup"])
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp) {
      setErrors(["Verification code is required"])
      return
    }

    setErrors([])
    setLoading(true)

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          otp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors([data.error || "Invalid verification code"])
        setLoading(false)
        return
      }

      toast({
        title: "Email verified",
        description: "Your account is pending admin approval",
      })

      setStep("success")
    } catch (error) {
      setErrors(["An error occurred during verification"])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">STO Manager</CardTitle>
          <CardDescription>
            {step === "form" && "Create a new account"}
            {step === "otp" && "Verify your email"}
            {step === "success" && "Registration successful"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Administrator Email</Label>
                <Input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  placeholder="Enter administrator email for approval"
                  value={form.adminEmail}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500">Your account will need approval from this administrator</p>
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>

              <div className="text-center text-sm">
                <p>
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="text-blue-600 hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  name="otp"
                  placeholder="Enter the 6-digit code sent to your email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">A verification code has been sent to {form.email}</p>
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>

              <div className="text-center text-sm">
                <p>
                  Didn&apos;t receive the code?{" "}
                  <button type="button" className="text-blue-600 hover:underline">
                    Resend
                  </button>
                </p>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-medium">Registration Successful!</h3>
                <p className="text-gray-600 mt-2">
                  Your account has been created and is pending approval from the administrator.
                </p>
                <p className="text-gray-600 mt-2">
                  You will receive an email notification once your account is approved.
                </p>
              </div>

              <Button onClick={() => router.push("/auth/signin")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
