"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FIRSummaryData {
  summary: string
  entities: { label: string; value: string; type: string }[]
  timeline: { date: string; event: string }[]
  risk: { level: string; score: number; factors: string[] }
}

interface FIRSummaryProps {
  data: FIRSummaryData
}

export function FIRSummary({ data }: FIRSummaryProps) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Summary</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
        <div className="mt-4 flex items-center gap-3">
          <Badge variant={data.risk.level === "high" ? "danger" : data.risk.level === "medium" ? "warning" : "success"} size="md">
            Risk: {data.risk.level.toUpperCase()} ({data.risk.score})
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Extracted Entities</h3>
          <div className="space-y-2">
            {data.entities.map((entity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]"
              >
                <Badge
                  variant={
                    entity.type === "person" ? "danger" :
                    entity.type === "location" ? "info" :
                    entity.type === "evidence" ? "warning" : "default"
                  }
                  size="sm"
                >
                  {entity.type}
                </Badge>
                <span className="text-sm text-foreground">{entity.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{entity.value}</span>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Timeline Extraction</h3>
          <div className="space-y-3">
            {data.timeline.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary/50" />
                  {idx < data.timeline.length - 1 && <div className="w-0.5 flex-1 bg-white/5" />}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{t.date}</span>
                  <p className="text-sm text-foreground">{t.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Risk Factors</h3>
        <div className="flex flex-wrap gap-2">
          {data.risk.factors.map((factor, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="px-3 py-1.5 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-xs text-accent-rose"
            >
              {factor}
            </motion.span>
          ))}
        </div>
      </Card>
    </div>
  )
}
