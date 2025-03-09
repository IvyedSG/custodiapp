"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function BackgroundGradient() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Verificar tamaño inicial
    checkScreenSize()

    // Agregar listener para cambios de tamaño
    window.addEventListener("resize", checkScreenSize)

    // Limpiar listener
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 bg-gradient-to-br from-purple-50 via-white to-purple-100"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
        className={`fixed left-[5%] sm:left-[10%] top-[15%] sm:top-[20%] h-64 w-64 md:h-96 md:w-96 rounded-full bg-purple-300 opacity-10 blur-3xl`}
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          delay: 1,
        }}
        className={`fixed right-[5%] sm:right-[15%] top-[25%] sm:top-[30%] h-64 w-64 md:h-96 md:w-96 rounded-full bg-purple-400 opacity-10 blur-3xl`}
      />
    </>
  )
}

