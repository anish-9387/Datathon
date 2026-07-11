"use client"

import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:pointer-events-none select-none",
          variant === "primary" && "bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md active:scale-[0.97]",
          variant === "secondary" && "bg-card border border-card-border text-foreground hover:bg-card-hover active:scale-[0.97]",
          variant === "ghost" && "text-muted-foreground hover:text-foreground hover:bg-card-hover active:scale-[0.97]",
          variant === "danger" && "bg-accent-rose/8 text-accent-rose border border-accent-rose/15 hover:bg-accent-rose/12 active:scale-[0.97]",
          variant === "outline" && "border border-card-border text-foreground hover:bg-card-hover active:scale-[0.97]",
          size === "sm" && "h-8 px-3 text-xs gap-1.5 rounded-lg",
          size === "md" && "h-10 px-4 text-sm gap-2",
          size === "lg" && "h-12 px-6 text-base gap-2.5",
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
export type { ButtonProps }
