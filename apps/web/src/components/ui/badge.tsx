"use client"

import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple"
  size?: "sm" | "md"
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "sm", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full border",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
          variant === "default" && "bg-white/5 text-muted-foreground border-white/10",
          variant === "success" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          variant === "warning" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
          variant === "danger" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
          variant === "info" && "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          variant === "purple" && "bg-violet-500/10 text-violet-400 border-violet-500/20",
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
