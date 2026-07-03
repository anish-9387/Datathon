"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RepeatMO {
  id: string
  pattern: string
  frequency: number
  similarity: number
  locations: string[]
  lastIncident: string
  risk: string
}

interface MOSimilarityMatrixProps {
  data: RepeatMO[]
}

export function MOSimilarityMatrix({ data }: MOSimilarityMatrixProps) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Repeat MO Patterns</h3>
      <div className="space-y-3">
        {data.map((mo, idx) => (
          <motion.div
            key={mo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{mo.pattern}</span>
                  <Badge
                    variant={mo.risk === "critical" ? "danger" : mo.risk === "high" ? "warning" : "info"}
                    size="sm"
                  >
                    {mo.risk}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">ID: {mo.id} · Last: {mo.lastIncident}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{mo.frequency}</p>
                  <p className="text-[10px] text-muted-foreground">occurrences</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center relative">
                  <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90 absolute">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                    <motion.circle
                      cx="18" cy="18" r="16" fill="none"
                      stroke={mo.similarity > 90 ? "#f43f5e" : mo.similarity > 85 ? "#f59e0b" : "#06b6d4"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - mo.similarity / 100)}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - mo.similarity / 100) }}
                      transition={{ duration: 1, delay: idx * 0.15 }}
                    />
                  </svg>
                  <span className="text-[10px] font-bold text-foreground">{mo.similarity}%</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mo.locations.map((loc) => (
                <span key={loc} className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-muted-foreground border border-white/5">
                  {loc}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
