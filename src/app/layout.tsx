import type React from "react"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import "./globals.css"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Custodia",
  description: "Sistema de gestión de lockers",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans overflow-x-hidden`}>
        <div className="relative min-h-[100dvh]">
          <BackgroundGradient />
          <main className="relative">{children}</main>
        </div>
      </body>
    </html>
  )
}

