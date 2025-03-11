"use client"

import { Button } from "@/components/ui/button"
import { Lock, Unlock, Package } from "lucide-react"
import type { Locker } from "@/types/locker"
import { getLockerStatus, getStatusColor } from "@/lib/utils"
import { useState, useEffect } from "react"

interface LockerButtonProps {
  locker: Locker
  onClick: () => void
  isLoading?: boolean
  isMobile?: boolean
  isTablet?: boolean
}

export function LockerButton({
  locker,
  onClick,
  isLoading = false,
  isMobile = false,
  isTablet = false,
}: LockerButtonProps) {
  const status = getLockerStatus(locker.lockerDetails.length)
  const statusColor = getStatusColor(status)
  const [isHighlighted, setIsHighlighted] = useState(false)

  // Listen for highlight events
  useEffect(() => {
    const handleHighlight = (event: CustomEvent) => {
      if (event.detail.lockerId === locker.id) {
        setIsHighlighted(true)
        
        // Reset the highlight after the duration
        const timeout = setTimeout(() => {
          setIsHighlighted(false)
        }, event.detail.duration || 1000)
        
        return () => clearTimeout(timeout)
      }
    }

    // Add event listener with type assertion
    window.addEventListener("highlightLocker", handleHighlight as EventListener)
    
    // Cleanup
    return () => {
      window.removeEventListener("highlightLocker", handleHighlight as EventListener)
    }
  }, [locker.id])

  // Si está cargando, mostrar un estado visual ligeramente diferente
  const buttonClass = isLoading
    ? `${statusColor} opacity-90 cursor-default`
    : isHighlighted
    ? `${statusColor} hover:shadow-xl transition-all duration-200 animate-pulse shadow-lg ring-4 ring-yellow-400`
    : `${statusColor} hover:shadow-xl transition-all duration-200`

  // Ajustar tamaños según el dispositivo
  const iconSize = isMobile ? 18 : isTablet ? 20 : 24
  const packageIconSize = isMobile ? 12 : 14
  const textClass = isMobile ? "text-base" : isTablet ? "text-lg" : "text-lg"
  const smallTextClass = isMobile ? "text-xs" : "text-sm"

  return (
    <Button
      className={`h-full w-full text-white font-bold rounded-lg shadow-lg ${buttonClass}`}
      onClick={isLoading ? undefined : onClick}
      disabled={isLoading}
    >
      <div className="flex flex-col items-center justify-center gap-1 sm:gap-2">
        <div className={textClass}>{status === "empty" ? <Unlock size={iconSize} /> : <Lock size={iconSize} />}</div>
        <div className={textClass}>Locker {locker.id}</div>
        {status !== "empty" && (
          <div className={`${smallTextClass} flex items-center`}>
            <Package size={packageIconSize} className="mr-1" />
            {locker.lockerDetails.length} item{locker.lockerDetails.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </Button>
  )
}

