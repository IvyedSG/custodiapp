'use client'

import { useState } from "react"
import { Search, Grid2X2, AlertCircle } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { TicketStatusDialog } from "./ticket-status-dialog"
import type { Locker } from "@/types/locker"

interface TicketSearchProps {
  lockers: Locker[]
  onEmergencyRegistration: () => void
}

export function TicketSearch({ lockers, onEmergencyRegistration }: TicketSearchProps) {
  const [searchValue, setSearchValue] = useState("")
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [showStatus, setShowStatus] = useState(false)

  const handleSearch = () => {
    if (!searchValue) return

    const ticketNumber = searchValue.padStart(3, '0')
    const ticket = `T-${ticketNumber}`
    
    let found = false
    for (const locker of lockers) {
      const item = locker.items.find(item => item.ticket === ticket)
      if (item) {
        found = true
        setAlertMessage(`Ticket ${ticket} encontrado en Locker ${locker.id} - DNI: ${item.dni}`)
        setShowAlert(true)
        setTimeout(() => setShowAlert(false), 3000)
        break
      }
    }

    if (!found) {
      setAlertMessage(`Ticket ${ticket} no encontrado`)
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }

    setSearchValue("") // Clear the input after searching
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 3) {
      setSearchValue(value)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-purple-400" />
          </div>
          <div className="absolute inset-y-0 left-9 flex items-center">
            <span className="font-medium text-purple-500">T-</span>
          </div>
          <Input
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-[120px] border-2 border-purple-100 pl-16 font-mono shadow-sm transition-colors placeholder:text-purple-300 focus:border-purple-500 focus:ring-purple-500"
            placeholder="001"
          />
        </div>
        <Button 
          onClick={handleSearch}
          disabled={!searchValue}
          className="bg-purple-600 font-medium text-white shadow-sm transition-all hover:bg-purple-700"
        >
          Buscar
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={() => setShowStatus(true)}
        className="border-2 border-purple-200 font-medium text-purple-700 shadow-sm transition-all hover:bg-purple-50"
      >
        <Grid2X2 className="mr-2 h-4 w-4" />
        Estado de Tickets
      </Button>

      <Button
        variant="outline"
        className="gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
        onClick={onEmergencyRegistration}
      >
        <AlertCircle className="h-4 w-4" />
        Registro de Emergencia
      </Button>

      {/* Alert */}
      <Alert
        className={cn(
          "fixed left-1/2 top-4 z-50 w-auto -translate-x-1/2 border-2 border-purple-100 bg-white shadow-lg transition-all duration-300",
          showAlert ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <AlertDescription className="font-medium text-purple-700">
          {alertMessage}
        </AlertDescription>
      </Alert>

      {/* Status Dialog */}
      <TicketStatusDialog 
        open={showStatus} 
        onOpenChange={setShowStatus}
        lockers={lockers}
      />
    </div>
  )
}

