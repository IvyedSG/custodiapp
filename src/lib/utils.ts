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
      const { available, assigned } = JSON.parse(savedState)
      return { availableTickets: available, assignedTickets: assigned }
    }
  }

  return {
    availableTickets: Array.from({ length: TOTAL_TICKETS }, (_, i) => `LS-${String(i + 1).padStart(3, "0")}`),
    assignedTickets: [],
  }
}

let { availableTickets, assignedTickets } = initializeTickets()

function saveTicketState() {
  localStorage.setItem(
    "ticketState",
    JSON.stringify({
      available: availableTickets,
      assigned: assignedTickets,
    }),
  )
}

export function assignTicket(): string | null {
  if (availableTickets.length === 0) return null
  const ticket = availableTickets.shift()!
  assignedTickets.push(ticket)
  saveTicketState()
  console.log("Ticket assigned:", ticket)
  return ticket
}

export function releaseTicket(ticket: string): void {
  const index = assignedTickets.indexOf(ticket)
  if (index !== -1) {
    assignedTickets.splice(index, 1)
    availableTickets.unshift(ticket)
    saveTicketState()
    console.log("Ticket released:", ticket)
  }
}

export function syncTicketsWithLockers(lockers: Locker[]) {
  console.log("Syncing tickets with lockers...")
  // Reset tickets
  availableTickets = Array.from({ length: TOTAL_TICKETS }, (_, i) => `TS-${String(i + 1).padStart(3, "0")}`)
  assignedTickets = []

  // Mark tickets as assigned based on locker data
  lockers.forEach((locker) => {
    locker.lockerDetails.forEach((item) => {
      const ticketIndex = availableTickets.indexOf(item.ticketCode)
      if (ticketIndex !== -1) {
        const ticket = availableTickets.splice(ticketIndex, 1)[0]
        assignedTickets.push(ticket)
      }
    })
  })

  saveTicketState()
  console.log("Sync complete. Available tickets:", availableTickets.length, "Assigned tickets:", assignedTickets.length)
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

