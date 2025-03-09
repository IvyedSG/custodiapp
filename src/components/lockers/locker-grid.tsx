"use client"

import { motion, AnimatePresence } from "framer-motion"
import { LockerButton } from "./locker-button"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { Locker } from "@/types/locker"

interface LockerGridProps {
  lockers: Locker[]
  onLockerClick: (index: number) => void
  isLoading?: boolean
}

export function LockerGrid({ lockers, onLockerClick, isLoading = false }: LockerGridProps) {
  // Filtrar los lockers para excluir el locker 25
  const filteredLockers = lockers.filter((locker) => locker.id !== 25)
  const isMobile = useMediaQuery("(max-width: 639px)")
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)")

  return (
    <div className="grid h-full auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
      <AnimatePresence>
        {filteredLockers.map((locker, index) => (
          <motion.div
            key={locker.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.2,
              delay: Math.min(index * 0.01, 0.2), // Limitar el retraso máximo a 0.2s
              ease: "easeOut",
            }}
            className="h-full"
          >
            <LockerButton
              locker={locker}
              onClick={() => onLockerClick(index)}
              isLoading={isLoading}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

