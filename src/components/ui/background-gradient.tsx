'use client'

import { motion } from "framer-motion"

export function BackgroundGradient() {
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
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="fixed left-[10%] top-[20%] h-96 w-96 rounded-full bg-purple-300 opacity-10 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1,
        }}
        className="fixed right-[15%] top-[30%] h-96 w-96 rounded-full bg-purple-400 opacity-10 blur-3xl"
      />
    </>
  )
}

