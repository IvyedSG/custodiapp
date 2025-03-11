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
import { Package, Lock, Unlock, Ticket, Clock, User, Loader2, Phone } from "lucide-react"
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
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailedLocker, setDetailedLocker] = useState<Locker | null>(null)
  const { user, isLoading: isUserLoading, error: userError, searchUserByDNI, resetUser } = useUser()
  const { isLoading: isCheckInLoading, error: checkInError, performCheckIn } = useCheckIn()
  const isMobile = useMediaQuery("(max-width: 639px)")
  const [searchedDni, setSearchedDni] = useState("");
  const [reservedTicket, setReservedTicket] = useState<string | null>(null)

  // Fetch detailed locker data when dialog opens in view mode
  useEffect(() => {
    const fetchLockerDetails = async () => {
      if (!isOpen || !locker || !viewOnly) return;
      
      setIsLoadingDetails(true);
      try {
        const sessionId = localStorage.getItem("sessionId");
        const jwt = localStorage.getItem("jwt");
        
        if (!sessionId || !jwt) {
          console.error("No sessionId or jwt found");
          return;
        }
        
        const response = await fetch(
          `https://cdv-custody-api.onrender.com/cdv-custody/api/v1/lockers/${locker.id}/transactions`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Session-id": sessionId,
              Authorization: `Bearer ${jwt}`,
            },
            cache: "no-store",
          }
        );
        
        if (!response.ok) {
          throw new Error(`Error fetching locker details: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDetailedLocker(data);
      } catch (error) {
        console.error("Error fetching locker details:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    
    fetchLockerDetails();
  }, [isOpen, locker, viewOnly]);

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
      setDetailedLocker(null)
      
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
      // Add these fields for optimistic updates
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || ""
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

  // Use detailed locker data if available (in view mode), otherwise use the passed locker
  const displayLocker = detailedLocker || locker;
  const status = getLockerStatus(displayLocker.lockerDetails.length)
  
  // Usar currentItems del locker si está disponible, si no, usar el length de lockerDetails
  const currentItems = typeof displayLocker.currentItems === 'number' 
    ? displayLocker.currentItems 
    : displayLocker.lockerDetails.length;
  
  // Determinar si el locker está lleno basado en la capacidad real
  const isLockerFull = currentItems >= (displayLocker.capacity || 3);
  const isAddingDisabled = isLockerFull || !user || !nextTicket || isCheckInLoading;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={cn(
          "p-0 gap-0 bg-white", 
          isMobile 
            ? "max-w-[95vw]" 
            : viewOnly 
              ? "sm:max-w-[95vw] md:max-w-[900px] lg:max-w-[1000px]" 
              : "sm:max-w-[95vw] md:max-w-[800px]"
        )}
      >
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-purple-800">
              {status === "empty" ? (
                <Unlock className="h-5 w-5 text-purple-600" />
              ) : (
                <Lock className="h-5 w-5 text-purple-600" />
              )}
              Locker {displayLocker.id}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">Gestionar items del locker {displayLocker.id}</DialogDescription>
        </DialogHeader>

        {/* Modificamos esta línea para usar grid-cols-1 cuando estamos en viewOnly */}
        <div className={cn("grid gap-6 p-6", 
          viewOnly 
            ? "grid-cols-1" 
            : isMobile 
              ? "grid-cols-1" 
              : "sm:grid-cols-2"
        )}>
          {/* Sección de agregar item */}
          {!viewOnly && !isLockerFull && (
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

          {/* 
            Sección de items actuales - mantenemos el ancho completo en viewOnly
            y también cuando el locker está lleno en el modo normal
          */}
          <div className={cn(
            viewOnly || isLockerFull ? "w-full col-span-full" : isMobile ? "" : "relative"
          )}>
            {!viewOnly && !isMobile && !isLockerFull && <Separator orientation="vertical" className="absolute -left-3 h-full" />}

            <div className="space-y-4">
              <h3 className="text-base font-medium text-purple-900">Items actuales</h3>

              {isLoadingDetails && viewOnly ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className={cn(
                  viewOnly || isLockerFull
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" 
                    : "space-y-3 max-h-[400px] overflow-y-auto pr-2"
                )}>
                  {displayLocker.lockerDetails.length === 0 ? (
                    <div className={cn(
                      "rounded-lg border border-dashed p-4 text-center",
                      (viewOnly || isLockerFull) && "col-span-full"
                    )}>
                      <p className="text-sm text-gray-500">Este casillero está vacío</p>
                    </div>
                  ) : (
                    displayLocker.lockerDetails.map((item) => (
                      <motion.div
                        key={item.ticketCode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg border p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-purple-500" />
                            <span className="font-mono text-sm font-medium text-purple-700">{item.ticketCode}</span>
                          </div>
                          <div className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                            {item.teamName}
                          </div>
                        </div>
                        
                        <div className="rounded-md bg-gray-50 p-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-xs text-gray-700 font-medium">
                              {item.user.firstName} {item.user.lastName}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">DNI:</span>
                              <span className="font-mono font-medium">{item.user.documentNumber}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <span className="font-mono">{item.user.phoneNumber}</span>
                            </div>
                          </div>
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
              )}

              <div className="flex items-center gap-2 text-sm text-purple-700">
                <Package className="h-4 w-4" />
                <span>Items: {displayLocker.lockerDetails.length}/{displayLocker.capacity || 3}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}