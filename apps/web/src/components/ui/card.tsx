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
          "rounded-2xl transition-all duration-200",
          paddingMap[padding],
          variant === "glass" && "glass-card",
          variant === "solid" && "bg-card border border-card-border",
          variant === "bordered" && "bg-transparent border border-card-border",
          variant === "gradient" && "bg-card border border-card-border",
          hover && "hover:border-card-hover hover:shadow-md cursor-pointer",
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
  return <div className={cn("px-5 pb-5 pt-3 border-t border-card-border", className)} {...props} />
}

export { Card, CardHeader, CardContent, CardFooter }
