"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { ChartSkeleton, CardSkeleton } from "@/components/ui/skeleton"
import { EvolutionTimeline } from "@/components/intelligence/EvolutionTimeline"
import { ErrorCard } from "@/components/intelligence/ErrorCard"
import { ChartWrapper } from "@/components/ui/chart"
import { useApi } from "@/hooks/useApi"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface EvolutionPoint {
  date: string
  incidents: number
  severity: number
  phase: string
}

interface District {
  id: number
  name: string
  cases: number
  solved: number
  stations: number
}

export default function CrimeEvolutionPage() {
  const [district, setDistrict] = useState("")
  const [months, setMonths] = useState("24")
  const { data: districts } = useApi<District[]>("/api/districts")

  const params = new URLSearchParams({ months })
  if (district) params.set("district", district)
  const { data, error, loading, refresh } = useApi<EvolutionPoint[]>(
    `/api/intelligence/evolution?${params.toString()}`
  )

  const timeline = data || []
  // Vertical timeline stays readable at ~8 entries; charts show the full range.
  const recentPhases = timeline.slice(-8)
  const recentMetrics = timeline.slice(-6)

  // Escalation path = months where the dominant crime group shifted
  const transitions = timeline.filter((p, i) => i === 0 || p.phase !== timeline[i - 1].phase).slice(-6)

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Crime Evolution Timeline</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Monthly dominant crime patterns and heinous-offence severity</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: "", label: "All Districts" },
                ...(districts || []).map((d) => ({ value: d.name, label: d.name })),
              ]}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-44"
            />
            <Select
              options={[
                { value: "6", label: "6 months" },
                { value: "12", label: "12 months" },
                { value: "24", label: "24 months" },
                { value: "36", label: "36 months" },
              ]}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="w-32"
            />
          </div>
        </motion.div>

        {error ? (
          <ErrorCard title="Evolution analysis failed" message={error} onRetry={refresh} />
        ) : loading || !data ? (
          <>
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Analyzing crime evolution over the last {months} months... this can take up to 30 seconds
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChartSkeleton />
              </div>
              <div className="space-y-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
            <ChartSkeleton />
          </>
        ) : timeline.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-sm text-muted-foreground">No incident data for the selected period.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EvolutionTimeline data={recentPhases} />
              </div>
              <div className="space-y-4">
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Severity Metrics (recent)</h3>
                  {recentMetrics.map((phase) => (
                    <div key={phase.date} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{phase.date} · {phase.phase}</span>
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
                  <h3 className="text-sm font-semibold text-foreground mb-3">Pattern Shifts</h3>
                  <div className="space-y-2">
                    {transitions.map((p, i) => (
                      <div key={p.date} className="flex items-center gap-2 text-xs flex-wrap">
                        <Badge variant={p.severity > 80 ? "danger" : p.severity > 50 ? "warning" : "success"} size="sm">
                          {p.date}
                        </Badge>
                        <span className="text-foreground">{p.phase}</span>
                        {i < transitions.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            <ChartWrapper title="Severity Trend" subtitle="% heinous offences vs incident volume per month">
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }}
                      labelFormatter={(label) => {
                        const point = timeline.find((p) => p.date === label)
                        return point ? `${label} · ${point.phase}` : label
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Area type="monotone" dataKey="severity" stroke="#f43f5e" strokeWidth={2} fill="url(#severityGrad)" name="Severity %" />
                    <Area type="monotone" dataKey="incidents" stroke="#f59e0b" strokeWidth={2} fill="none" name="Incidents" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartWrapper>
          </>
        )}
      </div>
    </AppShell>
  )
}
