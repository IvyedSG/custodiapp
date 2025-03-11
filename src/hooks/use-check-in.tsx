"use client"

import { useState } from "react"

interface CheckInItem {
  documentNumber: number
  teamCode: string
  ticketCode: string
}

export function useCheckIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const performCheckIn = async (lockerId: number, items: CheckInItem[]) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const sessionId = localStorage.getItem("sessionId")
      const jwt = localStorage.getItem("jwt")

      if (!sessionId || !jwt) {
        throw new Error("No sessionId or jwt found")
      }

      const response = await fetch(
        `https://cdv-custody-api.onrender.com/cdv-custody/api/v1/lockers/${lockerId}/transactions/check-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Session-id": sessionId,
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify(items),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response text:", errorText)
        throw new Error("Error realizando check-in")
      }

      setSuccess(true)
      return true
    } catch (err) {
      console.error("Error performing check-in:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    success,
    performCheckIn,
  }
}