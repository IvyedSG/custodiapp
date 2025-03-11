"use client"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useState, useEffect } from "react"
import type { Locker } from "@/types/locker"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ==========================================
// Ticket Management Functions
// ==========================================

const TOTAL_TICKETS = 50

// Initialize tickets from localStorage or create new arrays
function initializeTickets() {
  if (typeof window !== "undefined") {
    // ✅ Verifica que se ejecuta en el cliente
    const savedState = localStorage.getItem("ticketState")
    if (savedState) {
      const { available, assigned, reserved } = JSON.parse(savedState)
      return { 
        availableTickets: available, 
        assignedTickets: assigned,
        tempReservedTickets: reserved || [] 
      }
    }
  }

  return {
    availableTickets: Array.from({ length: TOTAL_TICKETS }, (_, i) => `TS-${i + 1}`),
    assignedTickets: [],
    tempReservedTickets: [],
  }
}

let { availableTickets, assignedTickets, tempReservedTickets } = initializeTickets()

function saveTicketState() {
  localStorage.setItem(
    "ticketState",
    JSON.stringify({
      available: availableTickets,
      assigned: assignedTickets,
      reserved: tempReservedTickets,
    }),
  )
}

/**
 * Reserva temporalmente un ticket para previsualización
 */
export function reserveTicketForPreview(): string | null {
  if (availableTickets.length === 0) return null
  
  // Ordenar tickets disponibles por número para siempre asignar el más bajo
  availableTickets.sort((a: string, b: string) => {
    const numA = parseInt(a.split('-')[1])
    const numB = parseInt(b.split('-')[1])
    return numA - numB
  })
  
  // Tomar el ticket con el número más bajo
  const ticket = availableTickets.shift()!
  
  // Añadirlo a la lista de reservados temporalmente
  tempReservedTickets.push(ticket)
  saveTicketState()
  console.log("Ticket temporarily reserved:", ticket)
  return ticket
}

/**
 * Asigna el ticket previamente reservado o busca uno nuevo si no hay reservado
 */
export function assignTicket(reservedTicket?: string): string | null {
  // Si se proporciona un ticket reservado, eliminarlo de la lista de reservados y asignarlo
  if (reservedTicket && tempReservedTickets.includes(reservedTicket)) {
    const index = tempReservedTickets.indexOf(reservedTicket)
    tempReservedTickets.splice(index, 1)
    assignedTickets.push(reservedTicket)
    saveTicketState()
    console.log("Reserved ticket assigned:", reservedTicket)
    return reservedTicket
  }
  
  // Si no hay ticket reservado, buscar el menor disponible
  if (availableTickets.length === 0) return null
  
  // Ordenar tickets disponibles por número para siempre asignar el más bajo
  availableTickets.sort((a: string, b: string) => {
    const numA = parseInt(a.split('-')[1])
    const numB = parseInt(b.split('-')[1])
    return numA - numB
  })
  
  const ticket = availableTickets.shift()!
  assignedTickets.push(ticket)
  saveTicketState()
  console.log("New ticket assigned:", ticket)
  return ticket
}

/**
 * Libera todos los tickets temporalmente reservados
 */
export function releaseReservedTickets(): void {
  if (tempReservedTickets.length === 0) return
  
  console.log("Releasing all temporarily reserved tickets:", tempReservedTickets)
  
  // Devolver todos los tickets reservados a la lista de disponibles
  for (const ticket of tempReservedTickets) {
    // Insertar en orden
    const ticketNumber = parseInt(ticket.split('-')[1])
    let insertIndex = 0
    
    while (
      insertIndex < availableTickets.length &&
      parseInt(availableTickets[insertIndex].split('-')[1]) < ticketNumber
    ) {
      insertIndex++
    }
    
    availableTickets.splice(insertIndex, 0, ticket)
  }
  
  tempReservedTickets = []
  saveTicketState()
}

/**
 * Libera un ticket y lo vuelve disponible para asignación
 */
export function releaseTicket(ticket: string): void {
  // Primero verificar si está en la lista de reservados temporalmente
  const tempIndex = tempReservedTickets.indexOf(ticket)
  if (tempIndex !== -1) {
    tempReservedTickets.splice(tempIndex, 1)
    
    // Insertar el ticket en la posición correcta en los disponibles
    if (availableTickets.length === 0) {
      availableTickets.push(ticket)
    } else {
      const ticketNumber = parseInt(ticket.split('-')[1])
      
      // Encontrar la posición correcta para insertar el ticket
      let insertIndex = 0
      while (
        insertIndex < availableTickets.length &&
        parseInt(availableTickets[insertIndex].split('-')[1]) < ticketNumber
      ) {
        insertIndex++
      }
      
      // Insertar el ticket en la posición ordenada
      availableTickets.splice(insertIndex, 0, ticket)
    }
    
    saveTicketState()
    console.log("Reserved ticket released:", ticket)
    return
  }
  
  // Si no está en la lista de reservados, buscar en los asignados
  const index = assignedTickets.indexOf(ticket)
  if (index !== -1) {
    assignedTickets.splice(index, 1)
    
    // Insertar el ticket en la posición correcta para mantener el orden
    if (availableTickets.length === 0) {
      availableTickets.push(ticket)
    } else {
      const ticketNumber = parseInt(ticket.split('-')[1])
      
      // Encontrar la posición correcta para insertar el ticket
      let insertIndex = 0
      while (
        insertIndex < availableTickets.length &&
        parseInt(availableTickets[insertIndex].split('-')[1]) < ticketNumber
      ) {
        insertIndex++
      }
      
      // Insertar el ticket en la posición ordenada
      availableTickets.splice(insertIndex, 0, ticket)
    }
    
    saveTicketState()
    console.log("Assigned ticket released:", ticket)
  }
}

/**
 * Sincroniza los tickets con el estado actual de los lockers
 */
export function syncTicketsWithLockers(lockers: Locker[]) {
  console.log("Syncing tickets with lockers...")
  
  // Crear un conjunto de todos los tickets
  const allTickets = new Set(Array.from({ length: TOTAL_TICKETS }, (_, i) => `TS-${i + 1}`))
  
  // Conjunto de tickets asignados actualmente
  const currentlyAssigned = new Set<string>()
  
  // Marcar tickets como asignados basado en los datos de los lockers
  lockers.forEach((locker) => {
    if (locker.lockerDetails && Array.isArray(locker.lockerDetails)) {
      locker.lockerDetails.forEach((item) => {
        if (item.ticketCode && typeof item.ticketCode === 'string' && item.ticketCode.trim() !== '') {
          currentlyAssigned.add(item.ticketCode.trim())
          console.log("Found assigned ticket:", item.ticketCode)
        }
      })
    }
  })
  
  // Los tickets disponibles son los que no están asignados
  const availableTicketList: string[] = []
  allTickets.forEach(ticket => {
    if (!currentlyAssigned.has(ticket)) {
      availableTicketList.push(ticket)
    }
  })
  
  // Ordenar los tickets disponibles para mantener consistencia
  availableTicketList.sort((a, b) => {
    const numA = parseInt(a.split('-')[1])
    const numB = parseInt(b.split('-')[1])
    return numA - numB
  })
  
  // Actualizar las listas globales
  availableTickets = availableTicketList
  assignedTickets = Array.from(currentlyAssigned)
  tempReservedTickets = [] // Reset temporary reservations
  
  saveTicketState()
  console.log("Sync complete. Available tickets:", availableTickets.length, "Assigned tickets:", assignedTickets.length)
  console.log("First 10 available tickets:", availableTickets.slice(0, 10).map((t: string) => parseInt(t.split('-')[1])).join(', '))
}

/**
 * Synchronizes the local ticket state with the server-side state
 * Returns a promise that resolves with the synchronized available tickets
 */
export async function syncTicketsWithServer(): Promise<string[] | null> {
  try {
    const sessionId = localStorage.getItem("sessionId")
    const jwt = localStorage.getItem("jwt")

    if (!sessionId || !jwt) {
      console.error("No sessionId or jwt found")
      return null
    }

    const response = await fetch(
      "https://cdv-custody-api.onrender.com/cdv-custody/api/v1/tickets/active",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Session-id": sessionId,
          Authorization: `Bearer ${jwt}`,
        },
      }
    )

    if (!response.ok) throw new Error("Error fetching tickets")
    
    const data = await response.json()
    
    // Create sets for better performance when checking status
    const allTickets = Array.from({ length: TOTAL_TICKETS }, (_, i) => `TS-${i + 1}`)
    const serverAssignedTickets = new Set(
      data
        .filter((ticket: any) => ticket.status === "IN_USE")
        .map((ticket: any) => ticket.code)
    )
    
    // Update local ticket arrays based on server data
    availableTickets = allTickets.filter(ticket => !serverAssignedTickets.has(ticket))
    assignedTickets = Array.from(serverAssignedTickets)
    tempReservedTickets = [] // Clear any temporary reservations
    
    // Sort available tickets to ensure we always get the lowest number
    availableTickets.sort((a: string, b: string) => {
      const numA = parseInt(a.split('-')[1])
      const numB = parseInt(b.split('-')[1])
      return numA - numB
    })
    
    saveTicketState() // Save the synchronized state
    console.log("Synced with server. Available tickets:", availableTickets.length, 
                "Assigned tickets:", assignedTickets.length)
    
    return [...availableTickets] // Return a copy of the synchronized available tickets
  } catch (err) {
    console.error("Error synchronizing tickets with server:", err)
    return null
  }
}

/**
 * Reserva temporalmente un ticket para previsualización
 * Ahora con sincronización con el servidor
 */
export async function reserveTicketForPreviewAsync(): Promise<string | null> {
  // Synchronize with server first
  await syncTicketsWithServer()
  
  // Now use the updated local state to get the lowest available ticket
  return reserveTicketForPreview()
}

/**
 * Asigna el ticket previamente reservado o busca uno nuevo si no hay reservado
 * Ahora con sincronización con el servidor
 */
export async function assignTicketAsync(reservedTicket?: string): Promise<string | null> {
  // Synchronize with server first
  await syncTicketsWithServer()
  
  // Now use the updated local state
  return assignTicket(reservedTicket)
}

// ==========================================
// Locker Status Functions
// ==========================================

export function getLockerStatus(itemCount: number) {
  if (itemCount === 0) return "empty"
  if (itemCount < 3) return "semi-full"
  return "full"
}

export function getStatusColor(status: string) {
  switch (status) {
    case "empty":
      return "bg-gradient-to-br from-[#2ECC71] to-[#27AE60]"
    case "semi-full":
      return "bg-gradient-to-br from-[#F1C40F] to-[#F39C12]"
    case "full":
      return "bg-gradient-to-br from-[#E74C3C] to-[#C0392B]"
    default:
      return "bg-gradient-to-br from-gray-400 to-gray-600"
  }
}

// ==========================================
// Responsive Utility Functions
// ==========================================

/**
 * Detecta si el dispositivo es móvil o tablet basado en el user agent
 */
export function isMobileOrTablet() {
  if (typeof window === "undefined") return false

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  // Detectar dispositivos móviles y tablets
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

  return mobileRegex.test(userAgent)
}

/**
 * Detecta si la pantalla es pequeña (móvil)
 */
export function isSmallScreen() {
  if (typeof window === "undefined") return false
  return window.innerWidth < 640
}

/**
 * Detecta si la pantalla es mediana (tablet)
 */
export function isMediumScreen() {
  if (typeof window === "undefined") return false
  return window.innerWidth >= 640 && window.innerWidth < 1024
}

/**
 * Obtiene el tamaño de pantalla actual
 * @returns 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 */
export function getScreenSize() {
  if (typeof window === "undefined") return "md"

  const width = window.innerWidth

  if (width < 480) return "xs"
  if (width < 640) return "sm"
  if (width < 768) return "md"
  if (width < 1024) return "lg"
  if (width < 1280) return "xl"
  return "2xl"
}

/**
 * Hook personalizado para manejar el redimensionamiento de la ventana
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)

    // Llamar al handler inmediatamente para establecer el tamaño inicial
    handleResize()

    // Limpiar el evento al desmontar
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return windowSize
}

/**
 * Aplica estilos responsivos basados en el tamaño de pantalla
 */
export function getResponsiveValue<T>(values: {
  base: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  "2xl"?: T
}): T {
  const screenSize = getScreenSize()

  if (screenSize === "xs") return values.base
  if (screenSize === "sm") return values.sm || values.base
  if (screenSize === "md") return values.md || values.sm || values.base
  if (screenSize === "lg") return values.lg || values.md || values.sm || values.base
  if (screenSize === "xl") return values.xl || values.lg || values.md || values.sm || values.base
  return values["2xl"] || values.xl || values.lg || values.md || values.sm || values.base
}

/**
 * Genera clases CSS responsivas para diferentes tamaños de pantalla
 */
export function responsiveClasses(classMap: {
  base: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
  "2xl"?: string
}): string {
  return cn(
    classMap.base,
    classMap.sm && `sm:${classMap.sm}`,
    classMap.md && `md:${classMap.md}`,
    classMap.lg && `lg:${classMap.lg}`,
    classMap.xl && `xl:${classMap.xl}`,
    classMap["2xl"] && `2xl:${classMap["2xl"]}`,
  )
}

/**
 * Formatea un número de teléfono para mostrar
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Eliminar todos los caracteres no numéricos
  const cleaned = phoneNumber.replace(/\D/g, "")

  // Formato para Perú (asumiendo 9 dígitos)
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`
  }

  return phoneNumber
}

/**
 * Trunca un texto a una longitud máxima y añade puntos suspensivos
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

/**
 * Genera un ID único para elementos
 */
export function generateId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

