"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  variant?: "text" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
}

function Skeleton({ className, variant = "rectangular", width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 rounded-md",
        className
      )}
      style={{ width, height }}
    />
  )
}

function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="text" className="w-3/4 h-8" />
      <Skeleton variant="text" className="w-1/3" />
    </div>
  )
}

function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex gap-4 pb-3 border-b border-white/[0.04]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="flex-1 h-3" />
          ))}
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="glass-card p-5">
      <Skeleton className="w-full rounded-xl" height={height} />
    </div>
  )
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="text" className="w-2/3 h-8" />
          <Skeleton variant="text" className="w-1/3" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton, CardSkeleton, TableSkeleton, ChartSkeleton, KPISkeleton }
