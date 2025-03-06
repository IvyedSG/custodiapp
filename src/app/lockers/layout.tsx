"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useState, useEffect, Suspense } from "react"
import { Box, Activity, LineChart } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { TicketSearch } from "@/components/tickets/ticket-search"
import { EmergencyRegistrationDialog } from "@/components/emergency-registration-dialog"
import type { Locker } from "@/types/locker"

function LockersLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [serviceName, setServiceName] = useState<string | null>(null)
  const [staff, setStaff] = useState<string | null>(null)
  const [lockers, setLockers] = useState<Locker[]>([])
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false)

  useEffect(() => {
    const loadLockers = () => {
      const savedLockers = localStorage.getItem("lockers")
      if (savedLockers) {
        const parsedLockers = JSON.parse(savedLockers, (key, value) => {
          if (key === "timestamp" && value) {
            return new Date(value)
          }
          return value
        })
        setLockers(parsedLockers)
      }
    }

    loadLockers() 

    window.addEventListener("storage", loadLockers)

    window.addEventListener("lockersUpdated", loadLockers)

    return () => {
      window.removeEventListener("storage", loadLockers)
      window.removeEventListener("lockersUpdated", loadLockers)
    }
  }, [])

  useEffect(() => {
   
    const savedServiceName = localStorage.getItem("selectedServiceName")
    const savedStaff = localStorage.getItem("selectedStaff")

    if (savedServiceName) setServiceName(savedServiceName)
    if (savedStaff) setStaff(savedStaff)

    const handleStorageChange = () => {
      const updatedServiceName = localStorage.getItem("selectedServiceName")
      const updatedStaff = localStorage.getItem("selectedStaff")

      if (updatedServiceName) setServiceName(updatedServiceName)
      if (updatedStaff) setStaff(updatedStaff)
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const handleEndService = async () => {
    const sessionId = localStorage.getItem("sessionId")
    const serviceId = localStorage.getItem("selectedService")

    if (!sessionId || !serviceId) {
      console.error("No sessionId or serviceId found")
      return
    }

    try {
      const response = await fetch(
        `https://cdv-custody-api.onrender.com/cdv-custody/api/v1/schedules/${serviceId}/transactions/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Session-id": sessionId,
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response text:", errorText)
        throw new Error("Error al terminar el servicio")
      }


      localStorage.removeItem("sessionId")
      localStorage.removeItem("selectedService") 
      localStorage.removeItem("selectedServiceName") 
      localStorage.removeItem("selectedStaff") 

      router.push("/")
    } catch (err) {
      console.error("Error ending service:", err)
    }
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#F3E5F5]">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-6">
          <h1 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-purple-600">
            Custodia
            <span className="text-yellow-400">✨</span>
          </h1>
          <TicketSearch lockers={lockers} onEmergencyRegistration={() => setIsEmergencyDialogOpen(true)} />
        </div>
        {(serviceName || staff) && (
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-600 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white">
              {serviceName && `${serviceName} servicio`}
              {serviceName && staff && " - "}
              {staff && `Encargado: ${staff}`}
            </div>
            <Button
              onClick={handleEndService}
              className="rounded-lg bg-red-600 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white hover:bg-red-700"
            >
              Terminar Servicio
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-auto p-2 md:p-4 lg:p-6">
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="grid w-full grid-cols-3 border-b">
            <Link
              href="/lockers"
              className={`flex items-center justify-center gap-2 border-b-2 px-2 py-2 md:px-6 md:py-3 text-xs md:text-sm font-medium transition-colors ${
                pathname === "/lockers"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Box className="h-3 w-3 md:h-4 md:w-4" />
              Lockers
            </Link>
            <Link
              href="/lockers/status"
              className={`flex items-center justify-center gap-2 border-b-2 px-2 py-2 md:px-6 md:py-3 text-xs md:text-sm font-medium transition-colors ${
                pathname === "/lockers/status"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <LineChart className="h-3 w-3 md:h-4 md:w-4" />
              Status
            </Link>
            <Link
              href="/lockers/activity"
              className={`flex items-center justify-center gap-2 border-b-2 px-2 py-2 md:px-6 md:py-3 text-xs md:text-sm font-medium transition-colors ${
                pathname === "/lockers/activity"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Activity className="h-3 w-3 md:h-4 md:w-4" />
              Activity
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-3 md:p-4 lg:p-6">{children}</div>
        </div>
      </main>
      <EmergencyRegistrationDialog isOpen={isEmergencyDialogOpen} setIsOpen={setIsEmergencyDialogOpen} />
    </div>
  )
}

export default function LockersLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LockersLayoutContent>{children}</LockersLayoutContent>
    </Suspense>
  )
}