"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ChartWrapperProps {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  action?: ReactNode
  height?: number
}

export function ChartWrapper({ title, subtitle, children, className, action, height }: ChartWrapperProps) {
  return (
    <div className={cn("rounded-2xl bg-[#0b1626] border border-[#1e3a5f]/30 p-5", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground/60 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div style={height ? { height } : undefined}>{children}</div>
    </div>
  )
}
