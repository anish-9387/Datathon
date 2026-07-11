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
      success: "bg-accent-emerald",
      warning: "bg-accent-amber",
      danger: "bg-accent-rose",
      info: "bg-accent-cyan",
      purple: "bg-accent-violet",
      neutral: "bg-muted",
    }
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          size === "sm" ? "px-2.5 py-0.5 text-[11px] leading-4" : "px-3 py-1 text-xs",
          variant === "default" && "bg-card-hover text-muted-foreground border border-card-border",
          variant === "success" && "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/15",
          variant === "warning" && "bg-accent-amber/10 text-accent-amber border border-accent-amber/15",
          variant === "danger" && "bg-accent-rose/10 text-accent-rose border border-accent-rose/15",
          variant === "info" && "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/15",
          variant === "purple" && "bg-accent-violet/10 text-accent-violet border border-accent-violet/15",
          variant === "neutral" && "bg-muted/10 text-muted border border-muted/15",
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
