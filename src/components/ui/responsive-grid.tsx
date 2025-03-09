import type React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    "2xl"?: number
  }
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
}

/**
 * Grid responsivo que adapta el número de columnas según el tamaño de pantalla
 */
export function ResponsiveGrid({
  children,
  cols = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    "2xl": 6,
  },
  gap = "md",
  className,
  ...props
}: ResponsiveGridProps) {
  const colClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols["2xl"] && `2xl:grid-cols-${cols["2xl"]}`,
  ].filter(Boolean)

  const gapClasses = {
    none: "gap-0",
    xs: "gap-1 sm:gap-2",
    sm: "gap-2 sm:gap-3",
    md: "gap-3 sm:gap-4 md:gap-5",
    lg: "gap-4 sm:gap-6 md:gap-8",
    xl: "gap-6 sm:gap-8 md:gap-10",
  }

  return (
    <div className={cn("grid w-full", colClasses, gapClasses[gap], className)} {...props}>
      {children}
    </div>
  )
}