"use client"

import { useState } from "react"

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  showSkeleton?: boolean
}

export function OptimizedImage({ src, alt, className = "", showSkeleton = true }: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && showSkeleton && <div className="absolute inset-0 bg-muted animate-pulse" />}
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true)
          setIsLoading(false)
        }}
        loading="lazy"
        decoding="async"
      />
      {error && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Image unavailable</span>
        </div>
      )}
    </div>
  )
}
