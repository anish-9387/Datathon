"use client"

import { cn } from "@/lib/utils"

export function LoadingSpinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-6 w-6", md: "h-10 w-10", lg: "h-16 w-16" }
  return (
    <div className="flex items-center justify-center">
      <svg className={cn("animate-spin text-primary", sizeMap[size], className)} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}

export function FullPageLoading({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0e1a] z-50">
      <div className="relative">
        <div className="hexagon w-16 h-16 bg-primary/20 animate-pulse-soft" />
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
      {message && <p className="mt-6 text-sm text-muted-foreground animate-pulse">{message}</p>}
    </div>
  )
}
