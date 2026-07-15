"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MapPin } from "lucide-react"

interface Anomaly {
  id: string
  firNumber: string
  score: number
  explanation: string
  type: string | null
  district: string | null
  policeStation: string | null
  date: string | null
  description: string | null
  status: string | null
}

interface AnomalyAlertProps {
  anomaly: Anomaly
  index: number
}

const gradients = [
  "from-rose-500 to-pink-500",
  "from-amber-500 to-yellow-500",
  "from-violet-500 to-purple-500",
  "from-cyan-500 to-teal-500",
  "from-emerald-500 to-green-500",
]

function gradientFor(label: string): string {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0
  return gradients[Math.abs(hash) % gradients.length]
}

function statusVariant(status: string | null): "danger" | "warning" | "info" | "success" | "default" {
  if (!status) return "default"
  const s = status.toLowerCase()
  if (s.includes("investigation")) return "warning"
  if (s.includes("pending")) return "info"
  if (s.includes("convicted") || s.includes("chargesheet")) return "success"
  if (s.includes("acquitted")) return "danger"
  return "default"
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
          <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${gradientFor(anomaly.type ?? "unknown")} flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-medium text-foreground">{anomaly.type ?? "Unknown"} Anomaly</span>
              <span className="text-xs text-muted-foreground font-mono">{anomaly.firNumber}</span>
              {anomaly.status && (
                <Badge variant={statusVariant(anomaly.status)} size="sm">
                  {anomaly.status}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{anomaly.explanation}</p>
            {anomaly.description && (
              <p className="text-xs text-muted mt-1 line-clamp-2">{anomaly.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted flex-wrap">
              {anomaly.date && <span>{anomaly.date}</span>}
              {(anomaly.district || anomaly.policeStation) && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[anomaly.policeStation, anomaly.district].filter(Boolean).join(", ")}
                  </span>
                </>
              )}
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
