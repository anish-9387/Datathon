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

const statusColors: Record<string, { color: string; bg: string; dot: string; bar: string }> = {
  "Under Investigation": { color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", dot: "bg-cyan-400", bar: "#06b6d4" },
  "Chargesheet Filed": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", dot: "bg-blue-400", bar: "#3b82f6" },
  "Final Report Submitted": { color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", dot: "bg-violet-400", bar: "#8b5cf6" },
  "Pending Court": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400", bar: "#f59e0b" },
  "Convicted": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", bar: "#10b981" },
  "Acquitted": { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", dot: "bg-rose-400", bar: "#f43f5e" },
  "Closed": { color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", dot: "bg-slate-400", bar: "#64748b" },
}

const fallbackColors = { color: "text-muted-foreground", bg: "bg-white/5 border-white/10", dot: "bg-muted", bar: "#64748b" }

export function StatusDashboard({ data }: StatusDashboardProps) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Case Status Overview</h3>
      <div className="space-y-3">
        {data.map((item, idx) => {
          const colors = statusColors[item.status] || fallbackColors
          return (
            <motion.div
              key={item.status}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <div className={cn("rounded-xl p-3.5 border", colors.bg)}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
                    <span className={cn("text-sm font-medium", colors.color)}>{item.status}</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{item.count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1, delay: idx * 0.12 }}
                    style={{ background: colors.bar }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{item.percentage}% of total cases</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
