"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const jwt = localStorage.getItem("jwt")
    const sessionId = localStorage.getItem("sessionId")

    if (jwt && sessionId) {
      router.push("/lockers")
    }
  }, [router])

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="container flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Custodia
              <span className="ml-1 text-yellow-400">✨</span>
            </h1>
            <p className="text-muted-foreground">
              Inicia sesión para gestionar los casilleros
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

