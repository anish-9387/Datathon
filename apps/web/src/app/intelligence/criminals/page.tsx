"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, TrendingUp, Repeat, Activity } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { KPISkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton"
import { CriminalScoreCard, type Criminal } from "@/components/intelligence/CriminalScoreCard"
import { ErrorCard } from "@/components/intelligence/ErrorCard"
import { ChartWrapper } from "@/components/ui/chart"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, SortableHeader, useTableSort } from "@/components/ui/table"
import { useApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const barColors = ["#f43f5e", "#f59e0b", "#3b82f6", "#06b6d4", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6"]

interface CriminalsResponse {
  criminals: Criminal[]
  corpusSize: number
}

interface District {
  id: number
  name: string
  cases: number
  solved: number
  stations: number
}

export default function CriminalsPage() {
  const [district, setDistrict] = useState("")
  const [top, setTop] = useState("50")
  const { data: districts } = useApi<District[]>("/api/districts")

  const params = new URLSearchParams({ top })
  if (district) params.set("district", district)
  const { data, error, loading, refresh } = useApi<CriminalsResponse>(
    `/api/intelligence/criminals?${params.toString()}`
  )

  const criminals = data?.criminals || []
  const { sorted, sort, handleSort } = useTableSort(criminals as unknown as Record<string, unknown>[])
  const avgInfluence = criminals.length
    ? (criminals.reduce((a, c) => a + c.influence, 0) / criminals.length).toFixed(1)
    : "0"

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Criminal Scoring</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">PageRank influence and betweenness centrality on the co-offending network</p>
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
                { value: "25", label: "Top 25" },
                { value: "50", label: "Top 50" },
                { value: "100", label: "Top 100" },
              ]}
              value={top}
              onChange={(e) => setTop(e.target.value)}
              className="w-28"
            />
          </div>
        </motion.div>

        {error ? (
          <ErrorCard title="Criminal scoring failed" message={error} onRetry={refresh} />
        ) : loading || !data ? (
          <>
            <KPISkeleton />
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Computing PageRank and centrality scores... this can take up to 30 seconds
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TableSkeleton rows={6} cols={3} />
              <ChartSkeleton />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Tracked Criminals", value: criminals.length, icon: User, color: "from-primary to-blue-500" },
                { label: "Linked Cases", value: criminals.reduce((a, c) => a + c.crimes, 0), icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
                { label: "Repeat Offenders", value: criminals.filter((c) => c.repeat).length, icon: Repeat, color: "from-emerald-500 to-emerald-600" },
                { label: "Avg Influence", value: `${avgInfluence}%`, icon: Activity, color: "from-amber-500 to-amber-600" },
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CriminalScoreCard criminals={criminals.slice(0, 6)} />
              <div className="space-y-6">
                <ChartWrapper title="Influence Distribution" subtitle={`Top network influence scores · corpus ${data.corpusSize}`}>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={criminals.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                        <Tooltip
                          contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }}
                        />
                        <Bar dataKey="influence" radius={[0, 4, 4, 0]}>
                          {criminals.slice(0, 8).map((_, idx) => (
                            <Cell key={idx} fill={barColors[idx % barColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartWrapper>
              </div>
            </div>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Criminal Database</h3>
              <div className="max-h-[520px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader label="Name" field="name" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Age" field="age" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Cases" field="crimes" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Influence" field="influence" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Betweenness" field="betweenness" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="PageRank" field="pagerank" currentSort={sort} onSort={handleSort} />
                      <TableHead>Status</TableHead>
                      <TableHead>Last Incident</TableHead>
                      <TableHead>Last Arrest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sorted as unknown as Criminal[]).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {c.name}
                            {c.repeat && <Badge variant="warning" size="sm">Repeat</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{c.age}</TableCell>
                        <TableCell>{c.crimes}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent-cyan" style={{ width: `${c.influence}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{c.influence}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{c.betweenness.toFixed(4)}</TableCell>
                        <TableCell>{c.pagerank.toFixed(6)}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "active" ? "danger" : "default"} size="sm">{c.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{c.lastIncident}</TableCell>
                        <TableCell className="text-muted-foreground">{c.lastArrest}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
