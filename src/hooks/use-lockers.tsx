"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import type { Locker } from "@/types/locker"

// Función para generar lockers de placeholder mientras se cargan los reales
const generatePlaceholderLockers = (count: number): Locker[] => {
  return Array(count)
    .fill(null)
    .map((_, index) => ({
      id: index + 1,
      code: `LS-${index + 1}`,
      type: "LOCKER",
      capacity: 3,
      currentItems: 0,
      description: null,
      position: index + 1,
      status: "AVAILABLE",
      campus: "SURCO",
      isActive: true,
      lockerDetails: [],
    }))
}

// Función para cargar lockers desde localStorage si existen
const getLocalLockers = (): Locker[] | null => {
  if (typeof window === "undefined") return null

  const cached = localStorage.getItem("lockers")
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (e) {
      console.error("Error parsing cached lockers:", e)
    }
  }
  return null
}

// Fetcher para SWR
const fetchLockers = async (): Promise<Locker[]> => {
  const sessionId = localStorage.getItem("sessionId")
  const jwt = localStorage.getItem("jwt")

  if (!sessionId || !jwt) {
    throw new Error("No sessionId or jwt found")
  }

  const response = await fetch(
    "https://cdv-custody-api.onrender.com/cdv-custody/api/v1/lockers/active/with-details?campus=SURCO",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Session-id": sessionId,
        Authorization: `Bearer ${jwt}`,
      },
      // Añadir cache: 'no-store' para evitar el caché del navegador
      cache: "no-store",
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Error response text:", errorText)
    throw new Error("Error fetching lockers")
  }

  const data = await response.json()

  // Guardar en localStorage para acceso rápido en futuras cargas
  localStorage.setItem("lockers", JSON.stringify(data))

  return data
}

export function useLockers() {
  // Usar datos locales como fallback inicial
  const [initialData] = useState(() => getLocalLockers() || generatePlaceholderLockers(24))

  const { data, error, isLoading, isValidating, mutate } = useSWR<Locker[]>("lockers", fetchLockers, {
    fallbackData: initialData,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // 5 segundos
    focusThrottleInterval: 10000, // 10 segundos
  })

  // Escuchar eventos de actualización
  useEffect(() => {
    const handleLockersUpdated = () => {
      mutate()
    }

    window.addEventListener("lockersUpdated", handleLockersUpdated)

    return () => {
      window.removeEventListener("lockersUpdated", handleLockersUpdated)
    }
  }, [mutate])

  return {
    lockers: data,
    isLoading: isLoading && !data,
    isRefreshing: isValidating,
    error,
    mutate,
  }
}