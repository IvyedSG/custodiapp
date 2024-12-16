"use client"

import { useState, useEffect } from "react"
import { Box, Activity, LineChart } from 'lucide-react'
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { TicketSearch } from "@/components/tickets/ticket-search"
import { EmergencyRegistrationDialog } from "@/components/emergency-registration-dialog"
import type { Locker } from "@/types/locker"

export default function LockersLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [service, setService] = useState<string | null>(null)
  const [staff, setStaff] = useState<string | null>(null)
  const [lockers, setLockers] = useState<Locker[]>([])
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false)

  useEffect(() => {
    const loadLockers = () => {
      const savedLockers = localStorage.getItem('lockers')
      if (savedLockers) {
        // Parse the lockers and convert timestamp strings back to Date objects
        const parsedLockers = JSON.parse(savedLockers, (key, value) => {
          if (key === 'timestamp' && value) {
            return new Date(value);
          }
          return value;
        });
        setLockers(parsedLockers);
      }
    }

    loadLockers(); // Initial load

    // Listen for changes
    window.addEventListener('storage', loadLockers);
    
    // Custom event for local updates
    window.addEventListener('lockersUpdated', loadLockers);

    return () => {
      window.removeEventListener('storage', loadLockers);
      window.removeEventListener('lockersUpdated', loadLockers);
    }
  }, []);

  useEffect(() => {
    const savedService = localStorage.getItem('selectedService')
    const savedStaff = localStorage.getItem('selectedStaff')
    if (savedService) setService(savedService)
    if (savedStaff) setStaff(savedStaff)

    const handleStorageChange = () => {
      const updatedService = localStorage.getItem('selectedService')
      const updatedStaff = localStorage.getItem('selectedStaff')
      if (updatedService) setService(updatedService)
      if (updatedStaff) setStaff(updatedStaff)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F3E5F5]">
      <header className="flex h-16 shrink-0 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-purple-600">
            Custodia
            <span className="text-yellow-400">✨</span>
          </h1>
          <TicketSearch lockers={lockers} onEmergencyRegistration={() => setIsEmergencyDialogOpen(true)} />
        </div>
        {(service || staff) && (
          <div className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white">
            {service && `${service} servicio`}
            {service && staff && " - "}
            {staff && `Encargado: ${staff}`}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden px-6 pb-6">
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="grid w-full grid-cols-3 border-b">
            <Link 
              href="/lockers"
              className={`flex items-center justify-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                pathname === '/lockers' 
                  ? 'border-purple-600 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Box className="h-4 w-4" />
              Lockers
            </Link>
            <Link 
              href="/lockers/status"
              className={`flex items-center justify-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                pathname === '/lockers/status'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <LineChart className="h-4 w-4" />
              Status
            </Link>
            <Link 
              href="/lockers/activity"
              className={`flex items-center justify-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                pathname === '/lockers/activity'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Activity className="h-4 w-4" />
              Activity
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </div>
      </main>
      <EmergencyRegistrationDialog
        isOpen={isEmergencyDialogOpen}
        setIsOpen={setIsEmergencyDialogOpen}
      />
    </div>
  )
}

