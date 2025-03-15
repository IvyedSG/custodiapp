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

      // Ensure items are formatted correctly
      const formattedItems = items.map(item => ({
        documentNumber: item.documentNumber,
        teamCode: item.teamCode,
        ticketCode: item.ticketCode
        // Note: firstName, lastName, and phoneNumber are not included in the API request
      }))

      // Record check-in activities
      const activities = JSON.parse(localStorage.getItem('activities') || '[]');
      
      items.forEach(item => {
        activities.unshift({
          type: 'add',
          lockerId: lockerId,
          item: {
            ticketCode: item.ticketCode,
            teamCode: item.teamCode,
            user: {
              documentNumber: item.documentNumber.toString(),
              firstName: item.firstName || "",
              lastName: item.lastName || "",
              phoneNumber: item.phoneNumber || "",
            }
          },
          timestamp: new Date()
        });
      });
      
      localStorage.setItem('activities', JSON.stringify(activities));

      const response = await fetch(
        `https://cdv-custody-api.onrender.com/cdv-custody/api/v1/lockers/${lockerId}/transactions/check-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Session-id": sessionId,
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify(formattedItems),
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