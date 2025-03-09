import type React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl"
  as?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span"
  responsive?: boolean
}

/**
 * Componente de texto que adapta su tamaño según el tamaño de pantalla
 */
export function ResponsiveText({
  children,
  size = "base",
  as: Component = "p",
  responsive = true,
  className,
  ...props
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: responsive ? "text-2xs sm:text-xs" : "text-xs",
    sm: responsive ? "text-xs sm:text-sm" : "text-sm",
    base: responsive ? "text-sm sm:text-base" : "text-base",
    lg: responsive ? "text-base sm:text-lg" : "text-lg",
    xl: responsive ? "text-lg sm:text-xl" : "text-xl",
    "2xl": responsive ? "text-xl sm:text-2xl" : "text-2xl",
    "3xl": responsive ? "text-2xl sm:text-3xl" : "text-3xl",
    "4xl": responsive ? "text-3xl sm:text-4xl" : "text-4xl",
  }

  return (
    <Component className={cn(sizeClasses[size], "text-pretty", className)} {...props}>
      {children}
    </Component>
  )
}

