"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Package, Lock, Unlock, Ticket, Clock, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { Locker, LockerDetail } from "@/types/locker"
import { getLockerStatus, assignTicket, releaseTicket } from "@/lib/utils"

interface LockerDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  locker: Locker | null
  onAddItem: (dni: string, ticket: string) => void
  viewOnly?: boolean
}

export function LockerDialog({ isOpen, setIsOpen, locker, onAddItem, viewOnly = false }: LockerDialogProps) {
  const [dni, setDni] = useState("")
  const [assignedTicket, setAssignedTicket] = useState<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 639px)")
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)")

  useEffect(() => {
    if (!isOpen) {
      setDni("")
      if (assignedTicket) {
        releaseTicket(assignedTicket)
        setAssignedTicket(null)
      }
    }
  }, [isOpen, assignedTicket])

  const handleAssignTicket = () => {
    if (dni && locker && locker.lockerDetails.length < 3 && !assignedTicket) {
      const ticket = assignTicket()
      if (ticket) {
        setAssignedTicket(ticket)
      }
    }
  }

  const handleAddItem = () => {
    if (dni && assignedTicket && locker && locker.lockerDetails.length < 3) {
      const newItem: LockerDetail = {
        id: Date.now(), // Generar un ID temporal
        teamName: "",
        itemDescription: null,
        inTime: new Date().toISOString(),
        outTime: null,
        ticketCode: assignedTicket,
        user: {
          id: Date.now(), // Generar un ID temporal
          firstName: "",
          lastName: "",
          phoneNumber: "",
          documentNumber: dni,
        },
      }

      const activities = JSON.parse(localStorage.getItem("activities") || "[]")
      activities.unshift({
        type: "add",
        lockerId: locker.id,
        item: newItem,
        timestamp: new Date(),
      })
      localStorage.setItem("activities", JSON.stringify(activities))

      onAddItem(dni, assignedTicket)
      setDni("")
      setAssignedTicket(null)
    }
  }

  const handleClose = () => {
    if (assignedTicket) {
      releaseTicket(assignedTicket)
      setAssignedTicket(null)
    }
    setIsOpen(false)
  }

  if (!locker) return null

  const status = getLockerStatus(locker.lockerDetails.length)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`${isMobile ? "max-w-[95vw] p-3" : "sm:max-w-[95vw] md:max-w-[800px] p-4 sm:p-6"} bg-gradient-to-br from-purple-50 to-indigo-50`}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-purple-800 flex items-center">
            {status === "empty" ? <Unlock className="mr-2 h-5 w-5" /> : <Lock className="mr-2 h-5 w-5" />}
            Locker {locker.id}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "sm:grid-cols-2 gap-4 sm:gap-6"}`}>
          {!viewOnly && locker.lockerDetails.length < 3 ? (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-indigo-700">Agregar nuevo item:</h3>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dni" className="text-sm font-medium text-indigo-700">
                    DNI
                  </Label>
                  <Input
                    id="dni"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="font-mono h-9 sm:h-10"
                    placeholder="Ingrese el DNI"
                    maxLength={8}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {dni.length === 8 && !assignedTicket && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <div className="rounded-lg bg-purple-50 p-2 sm:p-3 space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-2 text-purple-600 text-sm">
                          <Ticket className="h-4 w-4 flex-shrink-0" />
                          <span className="font-mono">Ticket por asignar</span>
                        </div>
                        <div className="text-xs text-purple-500">Se asignará al generar el ticket</div>
                      </div>

                      <Button
                        onClick={handleAssignTicket}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white h-9 sm:h-10"
                      >
                        Asignar Ticket
                      </Button>
                    </motion.div>
                  )}

                  {assignedTicket && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <div className="rounded-lg bg-purple-50 p-2 sm:p-3 space-y-1 sm:space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <div className="flex items-center gap-2 text-purple-600 text-sm">
                            <Ticket className="h-4 w-4 flex-shrink-0" />
                            <span className="font-mono font-medium">{assignedTicket}</span>
                          </div>
                          <span className="text-xs sm:text-sm text-purple-600">DNI: {dni}</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleAddItem}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white h-9 sm:h-10"
                      >
                        Confirmar Item
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}

          <div className={viewOnly || isMobile ? "" : "relative"}>
            {!viewOnly && !isMobile && (
              <Separator orientation="vertical" className="absolute -left-3 h-full hidden sm:block" />
            )}
            {!viewOnly && isMobile && <Separator className="my-2" />}

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-indigo-700">Items actuales:</h3>
              <div className="space-y-2 sm:space-y-3 max-h-[250px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
                {locker.lockerDetails.length === 0 ? (
                  <p className="text-indigo-700 text-sm sm:text-base">Este casillero está vacío.</p>
                ) : (
                  locker.lockerDetails.map((item, index) => (
                    <motion.div
                      key={item.ticketCode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-2 sm:p-3 rounded-lg shadow-sm space-y-1 sm:space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <div className="flex items-center gap-2 text-purple-600 text-sm">
                          <Ticket className="h-4 w-4 flex-shrink-0" />
                          <span className="font-mono font-medium">{item.ticketCode}</span>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500">DNI: {item.user.documentNumber}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {format(new Date(item.inTime), "d 'de' MMMM 'a las' HH:mm", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-700">
                <Package className="h-4 w-4 flex-shrink-0" />
                <span>Items: {locker.lockerDetails.length}/3</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}