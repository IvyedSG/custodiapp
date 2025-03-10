'use client'

import { useState, useEffect } from 'react'
import { TicketIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Locker } from "@/types/locker"

type Ticket = {
  id: number
  code: string
  status: 'AVAILABLE' | 'IN_USE'
  isActive: boolean
}

interface TicketStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lockers: Locker[]
}

export function TicketStatusDialog({ open, onOpenChange, lockers = [] }: TicketStatusDialogProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchTickets() {
      if (!open) return

      const sessionId = localStorage.getItem("sessionId")
      const jwt = localStorage.getItem("jwt")

      if (!sessionId || !jwt) {
        console.error("No sessionId or jwt found")
        return
      }

      setLoading(true)
      try {
        const response = await fetch(
          "https://cdv-custody-api.onrender.com/cdv-custody/api/v1/tickets/active",
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
          throw new Error("Error fetching tickets")
        }

        const data = await response.json()
        
        
        setTickets(data)
      } catch (err) {
        console.error("Error fetching tickets:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [open])

  const isTicketAvailable = (ticketNumber: number) => {
    // Create the ticket code in the format the backend uses: TS-1, TS-2, etc.
    const ticketCode = `TS-${ticketNumber}`
    
    // Find the ticket in our data
    const ticket = tickets.find(t => t.code === ticketCode)
    
    // If we found a ticket, check its status
    if (ticket) {
      
      return ticket.status === 'AVAILABLE'
    }
    
    // If no ticket found, assume it's available
    
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gradient-to-br from-purple-50/50 to-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-purple-700">
            <TicketIcon className="h-6 w-6" />
            Estado de Tickets
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-sm text-purple-600">Cargando tickets...</span>
          </div>
        ) : (
          <div className="grid grid-cols-10 gap-3 p-6">
            {Array.from({ length: 50 }, (_, i) => {
              const ticketNumber = i + 1 // Just use the number itself (1, 2, 3, etc.)
              const paddedNumber = String(ticketNumber).padStart(3, '0') // For display only: 001, 002, etc.
              const available = isTicketAvailable(ticketNumber)
              
              return (
                <div
                  key={`TS-${ticketNumber}`}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-mono shadow-sm transition-colors",
                    available 
                      ? "border-emerald-200 bg-emerald-50" 
                      : "border-red-200 bg-red-50"
                  )}
                >
                  <span className={cn(
                    "font-bold",
                    available ? "text-emerald-700" : "text-red-700"
                  )}>
                    {paddedNumber} {/* Display padded number (001) for UI only */}
                  </span>
                  <div className="absolute right-1 top-1">
                    {available ? (
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px]",
                    available ? "text-emerald-600" : "text-red-500"
                  )}>
                    {available ? 'Libre' : 'Ocupado'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

