"use client"

import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "glass-input w-full px-4 py-2.5 text-sm placeholder:text-muted-foreground",
            "file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary/10 file:text-primary file:font-medium",
            error && "border-accent-rose focus:border-accent-rose focus:ring-accent-rose/10",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-accent-rose">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
