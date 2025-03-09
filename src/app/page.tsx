"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const jwt = localStorage.getItem("jwt")
    const sessionId = localStorage.getItem("sessionId")

    if (jwt && sessionId) {
      router.push("/lockers")
    }
  }, [router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Bienvenid@ a Custodia
          </h1>
          <p className="text-muted-foreground">Inicia sesión para continuar</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

