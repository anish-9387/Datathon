"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

interface SHAPValue {
  feature: string
  value: number
  impact: number
}

interface SHAPExplanationProps {
  values: SHAPValue[]
  prediction: number
}

export function SHAPExplanation({ values, prediction }: SHAPExplanationProps) {
  const sorted = [...values].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">SHAP Explanation</h3>
      <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <p className="text-xs text-muted-foreground">Base value</p>
        <p className="text-2xl font-bold text-foreground">{prediction}%</p>
        <p className="text-xs text-muted-foreground mt-1">Predicted probability</p>
      </div>
      <div className="space-y-2">
        {sorted.map((item, idx) => (
          <motion.div
            key={item.feature}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3"
          >
            <span className="w-24 text-xs text-muted-foreground truncate">{item.feature}</span>
            <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden relative">
              <motion.div
                className={`absolute top-0 h-full rounded-lg ${item.impact > 0 ? "bg-accent-rose/30 right-1/2" : "bg-primary/30 left-1/2"}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.abs(item.impact) * 100}%` }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                style={{
                  [item.impact > 0 ? "right" : "left"]: "50%",
                  transform: item.impact > 0 ? "translateX(0)" : "translateX(-100%)",
                  width: `${Math.abs(item.impact) * 50}%`,
                }}
              />
            </div>
            <span className={`w-12 text-right text-xs font-medium ${item.impact > 0 ? "text-accent-rose" : "text-primary"}`}>
              {item.impact > 0 ? "+" : ""}{item.impact.toFixed(2)}
            </span>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
