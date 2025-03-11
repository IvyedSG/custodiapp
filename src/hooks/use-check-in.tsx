"use client"

import { useState } from "react"
import { useLockers } from "./use-lockers"

interface CheckInItem {
  documentNumber: number
  teamCode: string
  ticketCode: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
}

export function useCheckIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { optimisticCheckIn } = useLockers()

  const performCheckIn = async (lockerId: number, items: CheckInItem[]) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    // Apply optimistic update immediately
    items.forEach(item => optimisticCheckIn(lockerId, item))

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
      
      // Trigger a background refresh to ensure data consistency
      setTimeout(() => {
        window.dispatchEvent(new Event('lockersUpdated'))
      }, 1000)
      
      return true
    } catch (err) {
      console.error("Error performing check-in:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      
      // In case of error, revert optimistic update by refreshing data
      window.dispatchEvent(new Event('lockersUpdated'))
      
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