"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MapPin, Clock, Network, Globe } from "lucide-react"

interface Anomaly {
  id: string
  type: string
  description: string
  score: number
  date: string
  status: string
}

interface AnomalyAlertProps {
  anomaly: Anomaly
  index: number
}

const typeIcons: Record<string, React.ReactNode> = {
  Spatial: <MapPin className="w-4 h-4" />,
  Temporal: <Clock className="w-4 h-4" />,
  Modus: <AlertTriangle className="w-4 h-4" />,
  Network: <Network className="w-4 h-4" />,
  Geographic: <Globe className="w-4 h-4" />,
}

const typeColors: Record<string, string> = {
  Spatial: "from-rose-500 to-pink-500",
  Temporal: "from-amber-500 to-yellow-500",
  Modus: "from-violet-500 to-purple-500",
  Network: "from-cyan-500 to-teal-500",
  Geographic: "from-emerald-500 to-green-500",
}

export function AnomalyAlert({ anomaly, index }: AnomalyAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="p-4 relative overflow-hidden group hover:border-accent-rose/30">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity bg-accent-rose" />
        <div className="relative z-10 flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColors[anomaly.type] || "from-primary to-blue-500"} flex items-center justify-center flex-shrink-0`}>
            {typeIcons[anomaly.type] || <AlertTriangle className="w-4 h-4 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">{anomaly.type} Anomaly</span>
              <Badge variant={anomaly.status === "confirmed" ? "danger" : anomaly.status === "investigating" ? "warning" : "default"} size="sm">
                {anomaly.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{anomaly.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted">
              <span>{anomaly.date}</span>
              <span>·</span>
              <span>Score: {anomaly.score}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center relative">
              <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90 absolute">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                <motion.circle
                  cx="18" cy="18" r="16" fill="none"
                  stroke={anomaly.score > 85 ? "#f43f5e" : anomaly.score > 75 ? "#f59e0b" : "#06b6d4"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - anomaly.score / 100)}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - anomaly.score / 100) }}
                  transition={{ duration: 1, delay: index * 0.15 }}
                />
              </svg>
              <span className="text-[10px] font-bold text-foreground">{anomaly.score}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
