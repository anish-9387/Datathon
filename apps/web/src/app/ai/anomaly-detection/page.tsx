"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Activity, TrendingUp, Search, RefreshCw } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnomalyAlert } from "@/components/ai/AnomalyAlert"
import { ChartWrapper } from "@/components/ui/chart"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { KPISkeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Anomaly {
  id: string
  firNumber: string
  score: number
  explanation: string
  type: string | null
  district: string | null
  policeStation: string | null
  date: string | null
  description: string | null
  status: string | null
}

interface EmergingPattern {
  pattern?: string
  support?: number
  support_ratio?: number
  [key: string]: unknown
}

interface AnomaliesResponse {
  anomalies: Anomaly[]
  emerging: EmergingPattern[]
  totalFlagged: number
  corpusSize?: number
}

interface District {
  id: number
  name: string
}

const TOP_ALERTS = 8

export default function AnomalyDetectionPage() {
  const [district, setDistrict] = useState("")
  const { data: districts } = useApi<District[]>("/api/districts")

  const params = new URLSearchParams({ contamination: "0.08" })
  if (district) params.set("district", district)
  const { data, error, loading, refresh } = useApi<AnomaliesResponse>(`/api/ai/anomalies?${params.toString()}`)

  const anomalies = useMemo(() => data?.anomalies ?? [], [data])
  const topAnomalies = anomalies.slice(0, TOP_ALERTS)
  const highPriority = anomalies.filter((a) => a.score >= 85).length
  const avgScore = anomalies.length > 0 ? anomalies.reduce((a, an) => a + an.score, 0) / anomalies.length : 0

  const timeline = useMemo(() => {
    const byMonth = new Map<string, number>()
    for (const a of anomalies) {
      if (!a.date) continue
      const month = a.date.slice(0, 7)
      byMonth.set(month, (byMonth.get(month) ?? 0) + 1)
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([month, count]) => ({
        date: new Date(`${month}-01`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        count,
      }))
  }, [anomalies])

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Anomaly Detection</h1>
            <p className="text-sm text-muted-foreground">Isolation Forest detection of unusual crime patterns and emerging threats</p>
          </div>
          <Select
            options={(districts ?? []).map((d) => ({ value: d.name, label: d.name }))}
            placeholder="All districts"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-44"
          />
        </motion.div>

        {error ? (
          <Card>
            <EmptyState
              icon={<AlertTriangle className="w-8 h-8 text-accent-rose" />}
              title="Failed to load anomalies"
              description={error}
              action={{ label: "Retry", onClick: refresh }}
            />
          </Card>
        ) : loading ? (
          <>
            <KPISkeleton />
            <Card className="p-5">
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground py-24">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                Running anomaly detection over the FIR corpus — this can take up to 30 seconds...
              </div>
            </Card>
          </>
        ) : anomalies.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Search className="w-8 h-8 text-primary" />}
              title="No anomalies flagged"
              description={district ? `No anomalies detected for ${district}. Try another district.` : "No anomalies were flagged in the current corpus."}
            />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Flagged Anomalies", value: (data?.totalFlagged ?? anomalies.length).toString(), icon: AlertTriangle, color: "from-rose-500 to-rose-600" },
                { label: "High Priority (85+)", value: highPriority.toString(), icon: Activity, color: "from-amber-500 to-amber-600" },
                { label: "Corpus Size", value: (data?.corpusSize ?? 0).toString(), icon: TrendingUp, color: "from-emerald-500 to-emerald-600" },
                { label: "Avg Anomaly Score", value: avgScore.toFixed(0), icon: Search, color: "from-primary to-blue-500" },
              ].map((kpi, idx) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                      <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center", kpi.color)}>
                        <kpi.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Highest-scoring anomalies</h2>
                  <Badge variant="info" size="sm">
                    Top {topAnomalies.length} of {data?.totalFlagged ?? anomalies.length}
                  </Badge>
                </div>
                {topAnomalies.map((anomaly, idx) => (
                  <AnomalyAlert key={anomaly.id} anomaly={anomaly} index={idx} />
                ))}
              </div>
              <div className="space-y-6">
                <ChartWrapper title="Flagged Anomalies Timeline" subtitle="Cases flagged per month" height={250}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }} />
                      <Area type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2} fill="url(#anomalyGrad)" name="Flagged Cases" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartWrapper>

                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Emerging Patterns</h3>
                  {(data?.emerging ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No emerging patterns detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {(data?.emerging ?? []).slice(0, 6).map((p, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.02]"
                        >
                          <span className="text-xs text-foreground truncate" title={String(p.pattern ?? "")}>
                            {String(p.pattern ?? "Unknown pattern")}
                          </span>
                          <Badge variant="warning" size="sm">x{String(p.support ?? "?")}</Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Alert Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total flagged</span>
                      <span className="text-foreground font-medium">{data?.totalFlagged ?? anomalies.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">High priority (score 85+)</span>
                      <span className="text-accent-rose font-medium">{highPriority}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Corpus analysed</span>
                      <span className="text-foreground font-medium">{data?.corpusSize ?? "—"} FIRs</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
