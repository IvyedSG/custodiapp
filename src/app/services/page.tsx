"use client"

import { ServiceSelector } from "@/components/service-selector"
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision"

export default function ServicesPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-background">
      <BackgroundBeamsWithCollision className="h-full min-h-[100dvh]">
        <ServiceSelector />
      </BackgroundBeamsWithCollision>
    </div>
  )
}
