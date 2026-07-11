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
  "Under Investigation": { color: "text-[#C65D2E]", bg: "bg-[#C65D2E]/8 border-[#C65D2E]/15", dot: "bg-[#C65D2E]", bar: "#C65D2E" },
  "Chargesheet Filed": { color: "text-[#7B241C]", bg: "bg-[#7B241C]/8 border-[#7B241C]/15", dot: "bg-[#7B241C]", bar: "#7B241C" },
  "Final Report Submitted": { color: "text-[#8B5E3C]", bg: "bg-[#8B5E3C]/8 border-[#8B5E3C]/15", dot: "bg-[#8B5E3C]", bar: "#8B5E3C" },
  "Pending Court": { color: "text-[#E8A33A]", bg: "bg-[#E8A33A]/8 border-[#E8A33A]/15", dot: "bg-[#E8A33A]", bar: "#E8A33A" },
  "Convicted": { color: "text-[#2D8B55]", bg: "bg-[#2D8B55]/8 border-[#2D8B55]/15", dot: "bg-[#2D8B55]", bar: "#2D8B55" },
  "Acquitted": { color: "text-[#C0392B]", bg: "bg-[#C0392B]/8 border-[#C0392B]/15", dot: "bg-[#C0392B]", bar: "#C0392B" },
  "Closed": { color: "text-[#6B6258]", bg: "bg-[#6B6258]/8 border-[#6B6258]/15", dot: "bg-[#6B6258]", bar: "#6B6258" },
}

const fallbackColors = { color: "text-muted-foreground", bg: "bg-[#E7DDD1]/30 border-[#E7DDD1]/50", dot: "bg-muted", bar: "#6B6258" }

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
                <div className="h-2 rounded-full bg-[#E7DDD1]/40 overflow-hidden">
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
