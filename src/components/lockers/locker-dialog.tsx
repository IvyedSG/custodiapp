"use client"

import { cn } from "@/lib/utils"
import { reserveTicketForPreview, releaseReservedTickets, assignTicket, syncTicketsWithServer } from "@/lib/utils"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Package, Lock, Unlock, Ticket, Clock, User, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useUser } from "@/hooks/use-user"
import { useCheckIn } from "@/hooks/use-check-in"
import type { Locker } from "@/types/locker"
import { getLockerStatus } from "@/lib/utils"

interface LockerDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  locker: Locker | null
  onAddItem: (dni: string, ticket: string) => void
  viewOnly?: boolean
}

export function LockerDialog({ isOpen, setIsOpen, locker, onAddItem, viewOnly = false }: LockerDialogProps) {
  const [dni, setDni] = useState("")
  const [nextTicket, setNextTicket] = useState<string | null>(null)
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const { user, isLoading: isUserLoading, error: userError, searchUserByDNI, resetUser } = useUser()
  const { isLoading: isCheckInLoading, error: checkInError, performCheckIn } = useCheckIn()
  const isMobile = useMediaQuery("(max-width: 639px)")
  const [searchedDni, setSearchedDni] = useState("");
  const [reservedTicket, setReservedTicket] = useState<string | null>(null)

  const fetchNextAvailableTicket = useCallback(async () => {
    setIsLoadingTickets(true)
    try {
      // First try to synchronize with the server
      await syncTicketsWithServer()
      
      // Then reserve a ticket using the updated local state
      const localTicket = reserveTicketForPreview()
      if (localTicket) {
        setNextTicket(localTicket)
        setReservedTicket(localTicket)
        return
      }
      
      // If no tickets locally, make a direct API call as fallback
      const sessionId = localStorage.getItem("sessionId")
      const jwt = localStorage.getItem("jwt")

      if (!sessionId || !jwt) {
        console.error("No sessionId or jwt found")
        return
      }

      const response = await fetch("https://cdv-custody-api.onrender.com/cdv-custody/api/v1/tickets/active", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Session-id": sessionId,
          Authorization: `Bearer ${jwt}`,
        },
      })

      if (!response.ok) throw new Error("Error fetching tickets")

      const data = await response.json()
      
      // Ordenar los tickets por número para obtener el más bajo
      const availableTickets = data
        .filter((ticket: { status: string }) => ticket.status === "AVAILABLE")
        .sort((a: { code: string }, b: { code: string }) => {
          const numA = parseInt(a.code.split('-')[1])
          const numB = parseInt(b.code.split('-')[1])
          return numA - numB
        })
      
      const lowestTicket = availableTickets.length > 0 ? availableTickets[0].code : null
      setNextTicket(lowestTicket)
      setReservedTicket(lowestTicket)
    } catch (err) {
      console.error("Error fetching next ticket:", err)
      setNextTicket(null)
      setReservedTicket(null)
    } finally {
      setIsLoadingTickets(false)
    }
  }, [])

  // Buscar siguiente ticket disponible cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && !viewOnly) {
      fetchNextAvailableTicket()
    }
  }, [isOpen, viewOnly, fetchNextAvailableTicket])

  // Buscar usuario cuando se ingresan 8 dígitos
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (dni.length === 8 && dni !== searchedDni && !isUserLoading) {
        searchUserByDNI(dni)
        setSearchedDni(dni)
      } else if (dni.length < 8) {
        resetUser()
        setSearchedDni("")
      }
    }, 300); // Small debounce to prevent multiple rapid searches

    return () => clearTimeout(searchTimeout);
  }, [dni, searchUserByDNI, resetUser, isUserLoading, searchedDni])

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setDni("")
      setNextTicket(null)
      resetUser()
      
      // Liberar los tickets reservados si se cierra sin confirmar
      if (reservedTicket) {
        releaseReservedTickets()
        setReservedTicket(null)
      }
    }
  }, [isOpen, resetUser, reservedTicket])

  const handleAddItem = async () => {
    if (!user || !nextTicket || !locker) return

    // Synchronize with server before assigning ticket
    await syncTicketsWithServer()
    
    // Asignar el ticket utilizando el sistema de gestión local
    const finalTicket = assignTicket(reservedTicket || undefined) || nextTicket

    const checkInItem = {
      documentNumber: Number.parseInt(user.documentNumber),
      teamCode: user.suggestedTeam,
      ticketCode: finalTicket,
    }

    const success = await performCheckIn(locker.id, [checkInItem])

    if (success) {
      onAddItem(user.documentNumber, finalTicket)
      // Cerrar el diálogo después de un breve retraso para evitar parpadeos
      setTimeout(() => {
        setIsOpen(false)
      }, 300)
    }
  }

  if (!locker) return null

  const status = getLockerStatus(locker.lockerDetails.length)
  const isAddingDisabled = locker.lockerDetails.length >= 3 || !user || !nextTicket || isCheckInLoading

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={cn("p-0 gap-0 bg-white", isMobile ? "max-w-[95vw]" : "sm:max-w-[95vw] md:max-w-[800px]")}
      >
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-purple-800">
              {status === "empty" ? (
                <Unlock className="h-5 w-5 text-purple-600" />
              ) : (
                <Lock className="h-5 w-5 text-purple-600" />
              )}
              Locker {locker.id}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">Gestionar items del locker {locker.id}</DialogDescription>
        </DialogHeader>

        <div className={cn("grid gap-6 p-6", isMobile ? "grid-cols-1" : "sm:grid-cols-2")}>
          {/* Sección de agregar item */}
          {!viewOnly && locker.lockerDetails.length < 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-medium text-purple-900">Agregar nuevo item</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dni" className="text-sm text-gray-600">
                    DNI
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="dni"
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      className="pl-9 font-mono"
                      placeholder="Ingrese el DNI"
                      maxLength={8}
                      disabled={isCheckInLoading}
                      autoFocus
                    />
                    {isUserLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence initial={false} mode="wait">
                  {userError && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
                    >
                      {userError}
                    </motion.div>
                  )}

                  {user && (
                    <motion.div
                      key="user-info"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg bg-purple-50 p-3 space-y-1">
                        <span className="block text-sm font-medium text-purple-900">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="block text-xs text-purple-700">Equipo: {user.suggestedTeam}</span>
                        <span className="block text-xs text-purple-700">Tel: {user.phoneNumber}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Ticket a asignar:</span>
                          {isLoadingTickets ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                              <span className="text-sm text-purple-500">Cargando...</span>
                            </div>
                          ) : nextTicket ? (
                            <div className="flex items-center gap-2">
                              <Ticket className="h-4 w-4 text-purple-500" />
                              <span className="font-mono text-sm font-medium text-purple-700">{nextTicket}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-red-600">No hay tickets disponibles</span>
                          )}
                        </div>
                      </div>

                      {checkInError && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{checkInError}</div>
                      )}

                      <Button
                        onClick={handleAddItem}
                        disabled={isAddingDisabled}
                        className="w-full bg-purple-600 text-white hover:bg-purple-700"
                      >
                        {isCheckInLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          "Confirmar Check-in"
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Sección de items actuales */}
          <div className={viewOnly || isMobile ? "" : "relative"}>
            {!viewOnly && !isMobile && <Separator orientation="vertical" className="absolute -left-3 h-full" />}

            <div className="space-y-4">
              <h3 className="text-base font-medium text-purple-900">Items actuales</h3>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {locker.lockerDetails.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-sm text-gray-500">Este casillero está vacío</p>
                  </div>
                ) : (
                  locker.lockerDetails.map((item) => (
                    <motion.div
                      key={item.ticketCode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-purple-500" />
                          <span className="font-mono text-sm font-medium text-purple-700">{item.ticketCode}</span>
                        </div>
                        <span className="text-xs text-gray-500">DNI: {item.user.documentNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
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

              <div className="flex items-center gap-2 text-sm text-purple-700">
                <Package className="h-4 w-4" />
                <span>Items: {locker.lockerDetails.length}/3</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}