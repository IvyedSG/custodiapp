"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { LockerGrid } from "@/components/lockers/locker-grid"
import { LockerDialog } from "@/components/lockers/locker-dialog"
import { syncTicketsWithLockers } from "@/lib/utils"
import type { LockerDetail } from "@/types/locker"
import { useSearchParams } from "next/navigation"
import { useLockers } from "@/hooks/use-lockers"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ResponsiveContainer } from "@/components/ui/responsive-container"

const TOTAL_LOCKERS = 24

function LockersPage() {
  const { lockers, isLoading, mutate } = useLockers()
  const [selectedLocker, setSelectedLocker] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 639px)")

  const searchParams = useSearchParams()
  const service = searchParams.get("service")
  const staff = searchParams.get("staff")

  useEffect(() => {
    if (service) localStorage.setItem("selectedServiceName", service)
    if (staff) localStorage.setItem("selectedStaff", staff)
  }, [service, staff])

  const handleLockerClick = (index: number) => {
    setSelectedLocker(index)
    setIsDialogOpen(true)
  }

  const handleAddItem = (dni: string, ticket: string) => {
    if (selectedLocker !== null && lockers) {
      const newLockers = [...lockers]
      const locker = newLockers[selectedLocker]

      if (locker.lockerDetails.length < 3) {
        const newItem: LockerDetail = {
          id: Date.now(), // Generar un ID temporal
          teamName: "",
          itemDescription: null,
          inTime: new Date().toISOString(),
          outTime: null,
          ticketCode: ticket,
          user: {
            id: Date.now(), // Generar un ID temporal
            firstName: "",
            lastName: "",
            phoneNumber: "",
            documentNumber: dni,
          },
        }

        locker.lockerDetails.push(newItem)

        // Actualizar optimistamente la UI
        mutate(newLockers, false)

        // Guardar en localStorage para persistencia local
        localStorage.setItem("lockers", JSON.stringify(newLockers))
        syncTicketsWithLockers(newLockers)

        // Notificar a otros componentes
        window.dispatchEvent(new CustomEvent("lockersUpdated"))
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full"
    >
      <ResponsiveContainer maxWidth="full" padding={false} className="h-full">
        <LockerGrid lockers={lockers || []} onLockerClick={handleLockerClick} isLoading={isLoading} />
        <LockerDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          locker={selectedLocker !== null && lockers ? lockers[selectedLocker] : null}
          onAddItem={handleAddItem}
        />
      </ResponsiveContainer>
    </motion.div>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full">
          <LockerGridSkeleton />
        </div>
      }
    >
      <LockersPage />
    </Suspense>
  )
}

function LockerGridSkeleton() {
  // Crear un array de 24 elementos para representar los lockers
  const skeletonLockers = Array(TOTAL_LOCKERS).fill(null)

  // Determinar el número de columnas según el tamaño de pantalla
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 640 : false
  const isTablet = typeof window !== "undefined" ? window.innerWidth >= 640 && window.innerWidth < 1024 : false

  let cols = 6 // desktop default
  if (isMobile) cols = 2
  else if (isTablet) cols = 3

  return (
    <div
      className={`grid h-full auto-rows-fr grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4`}
    >
      {skeletonLockers.map((_, index) => (
        <div
          key={index}
          className="h-full w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"
          style={{
            animationDelay: `${Math.min(index * 30, 300)}ms`,
          }}
        >
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-300"></div>
            <div className="h-4 w-16 sm:h-6 sm:w-20 rounded bg-gray-300"></div>
          </div>
        </div>
      ))}
    </div>
  )
}