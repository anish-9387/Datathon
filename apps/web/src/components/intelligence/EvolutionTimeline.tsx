"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

interface EvolutionPhase {
  date: string
  phase: string
  severity: number
  incidents: number
}

interface EvolutionTimelineProps {
  data: EvolutionPhase[]
}

export function EvolutionTimeline({ data }: EvolutionTimelineProps) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-6">Crime Evolution Timeline</h3>
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-linear-to-b from-primary via-accent-cyan to-accent-rose" />
        <div className="space-y-8">
          {data.map((phase, idx) => (
            <motion.div
              key={phase.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 }}
              className="relative pl-12"
            >
              <div
                className="absolute left-3 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: `${phase.severity > 80 ? "rgba(192,57,43,0.15)" : phase.severity > 50 ? "rgba(232,163,58,0.15)" : "rgba(45,139,85,0.15)"}`,
                  borderColor: `${phase.severity > 80 ? "rgba(192,57,43,0.4)" : phase.severity > 50 ? "rgba(232,163,58,0.4)" : "rgba(45,139,85,0.4)"}`,
                  color: phase.severity > 80 ? "#C0392B" : phase.severity > 50 ? "#E8A33A" : "#2D8B55",
                }}
              >
                {idx + 1}
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{phase.phase}</span>
                  <span className="text-[11px] text-muted-foreground">{phase.date}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span>Severity: {phase.severity}%</span>
                  <span>Incidents: {phase.incidents}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#E7DDD1]/40 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${phase.severity}%` }}
                    transition={{ duration: 1, delay: idx * 0.2 }}
                    style={{
                      background: `linear-gradient(90deg, ${phase.severity > 80 ? "#C0392B" : phase.severity > 50 ? "#E8A33A" : "#2D8B55"}, transparent)`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  )
}
