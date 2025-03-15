"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, Lock, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const username = formData.get("username")
    const password = formData.get("password")

    try {
      const response = await fetch(
        `https://cdv-custody-api.onrender.com/cdv-custody/auth/login?username=${username}&password=${password}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response text:", errorText)
        throw new Error("Login failed")
      }

      const data = await response.json()
      localStorage.setItem("jwt", data.jwt) // Guardar el JWT en localStorage

      router.push("/services")
    } catch (error) {
      console.error("Login error:", error)
      setError("Usuario o contraseña inválidos")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-none bg-white/90 shadow-lg backdrop-blur-sm dark:bg-black/50">
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-1 px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-3"
            >
              <div className="grid gap-1.5">
                <Label htmlFor="username" className="text-sm sm:text-base">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Ingresa tu usuario"
                    name="username"
                    type="text"
                    autoCapitalize="none"
                    autoComplete="username"
                    autoCorrect="off"
                    className="pl-9 h-10 sm:h-11 text-sm sm:text-base"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-sm sm:text-base">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    placeholder="Ingresa tu contraseña"
                    name="password"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="current-password"
                    autoCorrect="off"
                    className="pl-9 h-10 sm:h-11 text-sm sm:text-base"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </motion.div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500"
              >
                {error}
              </motion.p>
            )}
          </CardContent>
          <CardFooter className="px-4 pb-4 sm:px-6 sm:pb-6">
            <Button
              className="w-full bg-purple-600 text-white transition-all hover:bg-purple-700 h-10 sm:h-11 text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </motion.div>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}