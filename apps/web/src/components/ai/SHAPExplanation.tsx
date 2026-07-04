"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

interface SHAPValue {
  feature: string
  value: number | string
  impact: number
}

interface SHAPExplanationProps {
  values: SHAPValue[]
  prediction: number
  subtitle?: string
}

function prettyFeature(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function SHAPExplanation({ values, prediction, subtitle }: SHAPExplanationProps) {
  const sorted = [...values].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
  const maxAbs = Math.max(...sorted.map((v) => Math.abs(v.impact)), 1e-6)

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">SHAP Explanation</h3>
      <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <p className="text-xs text-muted-foreground">Predicted probability</p>
        <p className="text-2xl font-bold text-foreground">{prediction}%</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle ?? "Model output for the selected scenario"}</p>
      </div>
      <div className="space-y-2">
        {sorted.map((item, idx) => {
          const width = (Math.abs(item.impact) / maxAbs) * 50
          return (
            <motion.div
              key={item.feature}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="w-28 text-xs text-muted-foreground truncate" title={`${prettyFeature(item.feature)}: ${item.value}`}>
                {prettyFeature(item.feature)}
              </span>
              <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden relative">
                <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
                <motion.div
                  className={`absolute top-0 h-full rounded-lg ${item.impact >= 0 ? "bg-accent-rose/30" : "bg-primary/30"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  style={item.impact >= 0 ? { left: "50%" } : { right: "50%" }}
                />
              </div>
              <span className={`w-14 text-right text-xs font-medium ${item.impact >= 0 ? "text-accent-rose" : "text-primary"}`}>
                {item.impact >= 0 ? "+" : ""}{item.impact.toFixed(3)}
              </span>
            </motion.div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-accent-rose/30" />
          <span>Increases risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary/30" />
          <span>Decreases risk</span>
        </div>
      </div>
    </Card>
  )
}
