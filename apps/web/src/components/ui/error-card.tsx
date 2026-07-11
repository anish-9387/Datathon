"use client"

import { AlertTriangle, RotateCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorCardProps {
  message: string
  onRetry: () => void
  className?: string
  title?: string
}

export function ErrorCard({ message, onRetry, className, title = "Failed to load data" }: ErrorCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent-rose/10 border border-accent-rose/15 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-accent-rose" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </div>
    </Card>
  )
}
