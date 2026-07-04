"use client"

import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "bordered" | "gradient"
  hover?: boolean
  padding?: "none" | "sm" | "md" | "lg"
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", hover = true, padding = "md", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-300",
          paddingMap[padding],
          variant === "glass" && "glass-card",
          variant === "solid" && "bg-[#0b1626] border border-[#1e3a5f]/35",
          variant === "bordered" && "bg-transparent border border-white/[0.04]",
          variant === "gradient" && "bg-gradient-to-br from-[#0b1626] via-[#0f1f3a] to-[#0b1626] border border-[#1e3a5f]/30",
          hover && "hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.03] cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-5 pb-3", className)} {...props} />
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-3", className)} {...props} />
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-3 border-t border-white/[0.04]", className)} {...props} />
}

export { Card, CardHeader, CardContent, CardFooter }
