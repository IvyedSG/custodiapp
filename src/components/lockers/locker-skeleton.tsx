interface LockerSkeletonProps {
  index: number
  isMobile?: boolean
  isTablet?: boolean
}

export function LockerSkeleton({ index, isMobile = false, isTablet = false }: LockerSkeletonProps) {
  // Ajustar tamaños según el dispositivo
  const circleSize = isMobile ? "h-6 w-6" : isTablet ? "h-7 w-7" : "h-8 w-8"
  const textSize = isMobile ? "h-4 w-16" : isTablet ? "h-5 w-18" : "h-6 w-20"

  return (
    <div
      className="h-full w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"
      style={{
        animationDelay: `${Math.min(index * 50, 500)}ms`,
        animationDuration: "1.5s",
      }}
    >
      <div className="flex h-full flex-col items-center justify-center gap-1 sm:gap-2">
        <div className={`rounded-full bg-gray-300 ${circleSize}`}></div>
        <div className={`rounded bg-gray-300 ${textSize}`}></div>
      </div>
    </div>
  )
}

