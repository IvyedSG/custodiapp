"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useState, useEffect, Suspense } from "react"
import { Box, Activity, LineChart, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { TicketSearch } from "@/components/tickets/ticket-search"
import { EmergencyRegistrationDialog } from "@/components/emergency-registration-dialog"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { Locker } from "@/types/locker"

function LockersLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [serviceName, setServiceName] = useState<string | null>(null)
  const [staff, setStaff] = useState<string | null>(null)
  const [lockers, setLockers] = useState<Locker[]>([])
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isMobile = useMediaQuery("(max-width: 767px)")
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)")

  useEffect(() => {
    const loadLockers = async () => {
      const sessionId = localStorage.getItem("sessionId")
      const jwt = localStorage.getItem("jwt")

      if (!sessionId || !jwt) {
        console.error("No sessionId or jwt found")
        return
      }

      try {
        const response = await fetch(
          "https://cdv-custody-api.onrender.com/cdv-custody/api/v1/lockers/active/with-details?campus=SURCO",
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
          throw new Error("Error fetching lockers")
        }

        const data = await response.json()
        setLockers(data)
      } catch (err) {
        console.error("Error fetching lockers:", err)
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
    const jwt = localStorage.getItem("jwt")

    if (!sessionId || !serviceId || !jwt) {
      console.error("No sessionId, serviceId, or jwt found")
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
            Authorization: `Bearer ${jwt}`,
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

      router.push("/services")
    } catch (err) {
      console.error("Error ending service:", err)
    }
  }

  const navLinks = [
    { href: "/lockers", label: "Lockers", icon: Box },
    { href: "/lockers/status", label: "Status", icon: LineChart },
    { href: "/lockers/activity", label: "Activity", icon: Activity },
  ]

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-[#F3E5F5]">
      <header className="flex h-14 md:h-16 shrink-0 items-center justify-between px-3 sm:px-4 md:px-6 border-b border-purple-100">
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          <h1 className="flex items-center gap-1 md:gap-2 text-lg sm:text-xl md:text-2xl font-bold text-purple-600">
            Custodia
            <span className="text-yellow-400">✨</span>
          </h1>

          {!isMobile && (
            <TicketSearch lockers={lockers} onEmergencyRegistration={() => setIsEmergencyDialogOpen(true)} />
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {(serviceName || staff) && (
            <>
              {/* Versión para móvil y tablet */}
              {(isMobile || isTablet) && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2 border-purple-200">
                      <span className="sr-only">Ver servicio</span>
                      <span className="text-xs text-purple-600">Servicio</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto rounded-t-xl bg-white px-4 py-6">
                    <div className="flex flex-col gap-4">
                      <div className="rounded-lg bg-purple-50 p-4 text-center">
                        {serviceName && (
                          <div className="mb-2 text-base font-medium text-purple-800">{serviceName} servicio</div>
                        )}
                        {staff && <div className="text-sm text-purple-600">Encargado: {staff}</div>}
                      </div>
                      <Button onClick={handleEndService} className="w-full bg-red-600 text-white hover:bg-red-700">
                        Terminar Servicio
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Versión para desktop */}
              {!isMobile && !isTablet && (
                <>
                  <div className="hidden md:flex rounded-lg bg-purple-600 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white">
                    {serviceName && `${serviceName} servicio`}
                    {serviceName && staff && " - "}
                    {staff && `Encargado: ${staff}`}
                  </div>
                  <Button
                    onClick={handleEndService}
                    className="hidden md:flex rounded-lg bg-red-600 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white hover:bg-red-700"
                  >
                    Terminar Servicio
                  </Button>
                </>
              )}
            </>
          )}

          {/* Menú móvil */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px] p-0">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-semibold">Menú</h2>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto py-4">
                    <div className="px-4 mb-6">
                      <TicketSearch
                        lockers={lockers}
                        onEmergencyRegistration={() => {
                          setMobileMenuOpen(false)
                          setIsEmergencyDialogOpen(true)
                        }}
                      />
                    </div>
                    <nav className="space-y-1 px-2">
                      {navLinks.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                              isActive
                                ? "bg-purple-100 text-purple-600"
                                : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon className="h-5 w-5" />
                            {link.label}
                          </Link>
                        )
                      })}
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 lg:p-6">
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
          {/* Navegación de pestañas - oculta en móvil */}
          <div className="hidden md:grid w-full grid-cols-3 border-b">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-center gap-2 border-b-2 px-2 py-2 md:px-6 md:py-3 text-xs md:text-sm font-medium transition-colors ${
                    isActive
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 lg:p-6">{children}</div>
        </div>
      </main>
      <EmergencyRegistrationDialog isOpen={isEmergencyDialogOpen} setIsOpen={setIsEmergencyDialogOpen} />
    </div>
  )
}

export default function LockersLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] w-full items-center justify-center bg-[#F3E5F5]">
          <div className="animate-pulse text-purple-600">Cargando...</div>
        </div>
      }
    >
      <LockersLayoutContent>{children}</LockersLayoutContent>
    </Suspense>
  )
}

