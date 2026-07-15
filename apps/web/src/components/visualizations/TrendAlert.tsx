"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, AlertTriangle, Activity } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TrendItem {
  type: string
  recentCount: number
  historicalAvg: number
  spikeRatio: number
  severity: "critical" | "elevated" | "normal"
}

interface TrendAlertProps {
  trends: TrendItem[]
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-accent-rose",
    bg: "bg-accent-rose/10",
    border: "border-accent-rose/30",
    pulse: "bg-accent-rose",
    label: "Spiking",
  },
  elevated: {
    icon: TrendingUp,
    color: "text-accent-amber",
    bg: "bg-accent-amber/10",
    border: "border-accent-amber/30",
    pulse: "bg-accent-amber",
    label: "Elevated",
  },
  normal: {
    icon: Activity,
    color: "text-accent-emerald",
    bg: "bg-accent-emerald/10",
    border: "border-accent-emerald/30",
    pulse: "bg-accent-emerald",
    label: "Stable",
  },
}

export function TrendAlert({ trends }: TrendAlertProps) {
  return (
    <Card className="p-5 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-48 h-48 bg-linear-to-bl from-accent-rose/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Emerging Trend Alerts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crime types spiking above historical averages
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-rose animate-pulse" />
              <span className="text-muted-foreground">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-amber" />
              <span className="text-muted-foreground">Elevated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-emerald" />
              <span className="text-muted-foreground">Stable</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {trends.map((trend, idx) => {
            const cfg = severityConfig[trend.severity]
            const Icon = cfg.icon
            const spikeRatio = trend.spikeRatio ?? 1
            const pctChange = Math.round((spikeRatio - 1) * 100)
            return (
              <motion.div
                key={trend.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={cn(
                  "flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300",
                  cfg.bg,
                  cfg.border,
                  trend.severity === "critical" && "shadow-sm shadow-accent-rose/10"
                )}
              >
                <div className="relative">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      cfg.bg,
                      cfg.color
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {trend.severity === "critical" && (
                    <span className={cn(
                      "absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping opacity-75",
                      cfg.pulse
                    )} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{trend.type}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                        trend.severity === "critical"
                          ? "bg-accent-rose/15 text-accent-rose"
                          : trend.severity === "elevated"
                            ? "bg-accent-amber/15 text-accent-amber"
                            : "bg-accent-emerald/15 text-accent-emerald"
                      )}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>
                      Recent: <strong className="text-foreground">{trend.recentCount}</strong>
                    </span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>
                      Avg: <strong className="text-foreground">{trend.historicalAvg}/mo</strong>
                    </span>
                    <span className="text-muted-foreground/50">|</span>
                    <span className={cn("flex items-center gap-0.5", pctChange > 0 ? "text-accent-rose" : "text-accent-emerald")}>
                      {pctChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {pctChange > 0 ? "+" : ""}{pctChange}%
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 w-16">
                  <div className="relative h-2 rounded-full bg-card-border overflow-hidden">
                    <motion.div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-colors",
                        trend.severity === "critical"
                          ? "bg-linear-to-r from-accent-rose to-accent-amber"
                          : trend.severity === "elevated"
                            ? "bg-linear-to-r from-accent-amber to-accent-emerald"
                            : "bg-linear-to-r from-accent-emerald to-accent-cyan"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(spikeRatio * 50, 100)}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                    />
                  </div>
                  <span className="block text-[10px] text-muted-foreground text-right mt-0.5">
                    x{spikeRatio.toFixed(1)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
