"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { LockerGrid } from "@/components/lockers/locker-grid"
import { LockerDialog } from "@/components/lockers/locker-dialog"
import { syncTicketsWithLockers } from "@/lib/utils"
import type { Locker, LockerItem } from "@/types/locker"
import { useSearchParams } from "next/navigation"

const TOTAL_LOCKERS = 24

function LockersPage() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [selectedLocker, setSelectedLocker] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const searchParams = useSearchParams()
  const service = searchParams.get("service")
  const staff = searchParams.get("staff")

  useEffect(() => {
    if (service) localStorage.setItem("selectedService", service)
    if (staff) localStorage.setItem("selectedStaff", staff)
  }, [service, staff])

  useEffect(() => {
    const savedLockers = localStorage.getItem("lockers")
    if (savedLockers) {
      const parsedLockers = JSON.parse(savedLockers, (key, value) => {
        if (key === "timestamp" && value) {
          return new Date(value)
        }
        return value
      })
      setLockers(parsedLockers)
      syncTicketsWithLockers(parsedLockers)
    } else {
      const initialLockers: Locker[] = Array(TOTAL_LOCKERS)
        .fill(null)
        .map((_, index) => ({
          id: index + 1,
          items: [],
        }))
      setLockers(initialLockers)
      localStorage.setItem("lockers", JSON.stringify(initialLockers))
      syncTicketsWithLockers(initialLockers)
    }
  }, [])

  const handleLockerClick = (index: number) => {
    setSelectedLocker(index)
    setIsDialogOpen(true)
  }

  const handleAddItem = (dni: string, ticket: string) => {
    if (selectedLocker !== null) {
      const newLockers = [...lockers]
      const locker = newLockers[selectedLocker]

      if (locker.items.length < 3) {
        const newItem: LockerItem = {
          dni,
          ticket,
          timestamp: new Date(),
        }
        locker.items.push(newItem)
        setLockers(newLockers)
        localStorage.setItem("lockers", JSON.stringify(newLockers))
        syncTicketsWithLockers(newLockers)

        // Dispatch custom event to notify layout of changes
        window.dispatchEvent(new CustomEvent("lockersUpdated"))
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full w-full"
    >
      <LockerGrid lockers={lockers} onLockerClick={handleLockerClick} />
      <LockerDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        locker={selectedLocker !== null ? lockers[selectedLocker] : null}
        onAddItem={handleAddItem}
      />
    </motion.div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LockersPage />
    </Suspense>
  );
}