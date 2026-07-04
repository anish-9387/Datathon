"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ErrorCardProps {
  title?: string
  message: string
  onRetry: () => void
}

// Shared error state for intelligence pages — the ML service can be slow or
// unavailable (503), so every page needs a message + Retry affordance.
export function ErrorCard({ title = "Analysis failed", message, onRetry }: ErrorCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-5">{message}</p>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
