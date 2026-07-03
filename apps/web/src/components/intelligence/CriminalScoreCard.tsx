"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Criminal {
  id: string
  name: string
  age: number
  crimes: number
  influence: number
  betweenness: number
  repeat: boolean
  status: string
  gang: string | null
  lastArrest: string
}

interface CriminalScoreCardProps {
  criminals: Criminal[]
}

export function CriminalScoreCard({ criminals }: CriminalScoreCardProps) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Top Criminal Scores</h3>
      <div className="space-y-3">
        {criminals.map((c, idx) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <Badge variant={c.status === "active" ? "danger" : "default"} size="sm">
                  {c.status}
                </Badge>
                {c.repeat && (
                  <Badge variant="warning" size="sm">Repeat</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Age {c.age} · {c.crimes} crimes · {c.gang || "No gang affiliation"}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span>Influence</span>
                    <span>{c.influence}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent-cyan"
                      initial={{ width: 0 }}
                      animate={{ width: `${c.influence}%` }}
                      transition={{ duration: 1, delay: idx * 0.15 }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-foreground">{c.betweenness.toFixed(2)}</span>
                  <p className="text-[10px] text-muted-foreground">Centrality</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
