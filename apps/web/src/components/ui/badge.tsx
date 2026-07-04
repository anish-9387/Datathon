"use client"

import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "neutral"
  size?: "sm" | "md"
  dot?: boolean
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "sm", dot, children, ...props }, ref) => {
    const dotColors = {
      default: "bg-muted-foreground",
      success: "bg-emerald-400",
      warning: "bg-amber-400",
      danger: "bg-rose-400",
      info: "bg-cyan-400",
      purple: "bg-violet-400",
      neutral: "bg-zinc-500",
    }
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          size === "sm" ? "px-2.5 py-0.5 text-[11px] leading-4" : "px-3 py-1 text-xs",
          variant === "default" && "bg-white/[0.04] text-muted-foreground border border-white/[0.06]",
          variant === "success" && "bg-emerald-500/8 text-emerald-400 border border-emerald-500/15",
          variant === "warning" && "bg-amber-500/8 text-amber-400 border border-amber-500/15",
          variant === "danger" && "bg-rose-500/8 text-rose-400 border border-rose-500/15",
          variant === "info" && "bg-cyan-500/8 text-cyan-400 border border-cyan-500/15",
          variant === "purple" && "bg-violet-500/8 text-violet-400 border border-violet-500/15",
          variant === "neutral" && "bg-zinc-500/8 text-zinc-400 border border-zinc-500/15",
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", dotColors[variant])} />
        )}
        {children}
      </span>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
