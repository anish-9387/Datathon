"use client"

import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EvolutionTimeline } from "@/components/intelligence/EvolutionTimeline"
import { ChartWrapper } from "@/components/ui/chart"
import { mockData } from "@/lib/api"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export default function CrimeEvolutionPage() {
  const timelineData = mockData.evolutionTimeline.map((p) => ({
    ...p,
    severityLabel: `${p.severity}%`,
  }))

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Crime Evolution Timeline</h1>
          <p className="text-sm text-muted-foreground">Track the progression of criminal activity patterns</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EvolutionTimeline data={mockData.evolutionTimeline} />
          </div>
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Severity Metrics</h3>
              {mockData.evolutionTimeline.map((phase) => (
                <div key={phase.date} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{phase.phase}</span>
                    <span className="font-medium text-foreground">{phase.severity}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${phase.severity}%` }}
                      transition={{ duration: 1 }}
                      style={{
                        background: phase.severity > 80
                          ? "linear-gradient(90deg, #f43f5e, #fb7185)"
                          : phase.severity > 50
                          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                          : "linear-gradient(90deg, #10b981, #34d399)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Escalation Path</h3>
              <div className="space-y-2">
                {mockData.evolutionTimeline.map((p, i) => (
                  <div key={p.date} className="flex items-center gap-2 text-xs">
                    <Badge variant={p.severity > 80 ? "danger" : p.severity > 50 ? "warning" : "success"} size="sm">
                      {i + 1}
                    </Badge>
                    <span className="text-foreground">{p.phase}</span>
                    {i < mockData.evolutionTimeline.length - 1 && (
                      <span className="text-muted-foreground">→</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <ChartWrapper title="Severity Trend" subtitle="Escalation severity over time">
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="phase" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Area type="monotone" dataKey="severity" stroke="#f43f5e" strokeWidth={2} fill="url(#severityGrad)" name="Severity %" />
                <Area type="monotone" dataKey="incidents" stroke="#f59e0b" strokeWidth={2} fill="none" name="Incidents" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>
      </div>
    </AppShell>
  )
}
