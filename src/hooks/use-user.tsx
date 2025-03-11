"use client"

import { useState } from "react"

export interface User {
  id: number
  firstName: string
  lastName: string
  phoneNumber: string
  documentNumber: string
  birthday: string
  email: string
  suggestedTeam: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchUserByDNI = async (dni: string) => {
    if (dni.length !== 8) {
      setUser(null)
      setError("El DNI debe tener 8 dígitos")
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const sessionId = localStorage.getItem("sessionId")
      const jwt = localStorage.getItem("jwt")

      if (!sessionId || !jwt) {
        throw new Error("No sessionId or jwt found")
      }

      const response = await fetch(
        `https://cdv-custody-api.onrender.com/cdv-custody/api/v1/users/search?searchValue=${dni}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Session-id": sessionId,
            Authorization: `Bearer ${jwt}`,
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response text:", errorText)
        throw new Error("Error buscando usuario")
      }

      const data = await response.json()
      setUser(data)
      return data
    } catch (err) {
      console.error("Error searching user:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const resetUser = () => {
    setUser(null)
    setError(null)
  }

  return {
    user,
    isLoading,
    error,
    searchUserByDNI,
    resetUser,
  }
}