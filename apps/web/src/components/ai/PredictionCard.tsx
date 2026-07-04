"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Prediction {
  date: string
  probability: number
  type: string
  confidence: string
  district?: string | null
  station?: string | null
  explanation?: string | null
}

interface PredictionCardProps {
  prediction: Prediction
  index: number
}

export function PredictionCard({ prediction, index }: PredictionCardProps) {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return { badge: "success" as const, color: "#10b981" }
      case "medium": return { badge: "warning" as const, color: "#f59e0b" }
      case "low": return { badge: "danger" as const, color: "#f43f5e" }
      default: return { badge: "default" as const, color: "#64748b" }
    }
  }

  const conf = getConfidenceColor(prediction.confidence)
  const day = new Date(prediction.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity" style={{ background: conf.color }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">{day}</span>
            <Badge variant={conf.badge} size="sm">{prediction.confidence}</Badge>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ color: conf.color }}>
            {prediction.probability}%
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground font-medium">{prediction.type}</span>
            <span className="text-muted-foreground">probability</span>
          </div>
          {(prediction.station || prediction.district) && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {[prediction.station, prediction.district].filter(Boolean).join(", ")}
            </p>
          )}
          <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${prediction.probability}%` }}
              transition={{ duration: 1, delay: index * 0.15 }}
              style={{ background: `linear-gradient(90deg, ${conf.color}, ${conf.color}88)` }}
            />
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            {prediction.probability > 70 ? (
              <><TrendingUp className="w-3 h-3 text-accent-rose" /> Elevated risk level</>
            ) : (
              <><TrendingDown className="w-3 h-3 text-emerald-400" /> Moderate risk level</>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
