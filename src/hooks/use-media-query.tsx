"use client"

import { useState, useEffect } from "react"

type MediaQueryOptions = {
  defaultValue?: boolean
}

/**
 * Hook para detectar media queries en componentes React
 * @param query Media query a detectar (ej: '(max-width: 768px)')
 * @param options Opciones adicionales
 * @returns boolean que indica si la media query coincide
 */
export function useMediaQuery(query: string, options: MediaQueryOptions = {}) {
  const { defaultValue = false } = options

  // Estado inicial basado en SSR o navegador
  const [matches, setMatches] = useState(() => {
    // En SSR, usar el valor por defecto
    if (typeof window === "undefined") return defaultValue

    // En el navegador, comprobar inmediatamente
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return

    // Crear media query
    const mediaQuery = window.matchMedia(query)

    // Función para actualizar el estado
    const updateMatches = () => setMatches(mediaQuery.matches)

    // Escuchar cambios
    mediaQuery.addEventListener("change", updateMatches)

    // Actualizar estado inicial
    updateMatches()

    // Limpiar listener
    return () => {
      mediaQuery.removeEventListener("change", updateMatches)
    }
  }, [query])

  return matches
}

/**
 * Hooks predefinidos para tamaños de pantalla comunes
 */
export function useIsMobile() {
  return useMediaQuery("(max-width: 639px)")
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 640px) and (max-width: 1023px)")
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)")
}

export function useIsTouchDevice() {
  return useMediaQuery("(pointer: coarse)")
}

export function usePrefersDarkMode() {
  return useMediaQuery("(prefers-color-scheme: dark)")
}

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)")
}

