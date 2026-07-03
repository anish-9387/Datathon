"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface StatusItem {
  status: string
  count: number
  percentage: number
}

interface StatusDashboardProps {
  data: StatusItem[]
}

const statusColors: Record<string, { color: string; bg: string; dot: string }> = {
  "Solved": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  "Under Investigation": { color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", dot: "bg-cyan-400" },
  "Pending": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
}

export function StatusDashboard({ data }: StatusDashboardProps) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Case Status Overview</h3>
      <div className="space-y-4">
        {data.map((item, idx) => {
          const colors = statusColors[item.status] || { color: "text-muted-foreground", bg: "bg-white/5 border-white/10", dot: "bg-muted" }
          return (
            <motion.div
              key={item.status}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className={cn("rounded-xl p-4 border", colors.bg)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
                    <span className={cn("text-sm font-medium", colors.color)}>{item.status}</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{item.count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full")}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1, delay: idx * 0.2 }}
                    style={{ background: `var(--${item.status === "Solved" ? "color-accent-emerald" : item.status === "Under Investigation" ? "color-accent-cyan" : "color-accent-amber"})` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{item.percentage}% of total cases</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
