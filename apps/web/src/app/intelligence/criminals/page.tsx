"use client"

import { motion } from "framer-motion"
import { User, TrendingUp, Repeat, Activity } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CriminalScoreCard } from "@/components/intelligence/CriminalScoreCard"
import { ChartWrapper } from "@/components/ui/chart"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, SortableHeader, useTableSort } from "@/components/ui/table"
import { mockData } from "@/lib/api"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const barColors = ["#f43f5e", "#f59e0b", "#3b82f6", "#06b6d4", "#10b981"]

export default function CriminalsPage() {
  const { sorted, sort, handleSort } = useTableSort(mockData.criminals as any) as any

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Criminal Scoring</h1>
          <p className="text-sm text-muted-foreground">Dangerousness assessment and network centrality analysis</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Tracked Criminals", value: mockData.criminals.length, icon: User, color: "from-primary to-blue-500" },
            { label: "Total Crimes", value: mockData.criminals.reduce((a, c) => a + c.crimes, 0), icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
            { label: "Repeat Offenders", value: mockData.criminals.filter(c => c.repeat).length, icon: Repeat, color: "from-emerald-500 to-emerald-600" },
            { label: "Avg Influence", value: "72.4%", icon: Activity, color: "from-amber-500 to-amber-600" },
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
          <CriminalScoreCard criminals={mockData.criminals} />
          <div className="space-y-6">
            <ChartWrapper title="Influence Distribution" subtitle="Criminal influence scores">
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockData.criminals} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }}
                    />
                    <Bar dataKey="influence" radius={[0, 4, 4, 0]}>
                      {mockData.criminals.map((_, idx) => (
                        <Cell key={idx} fill={barColors[idx]} />
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
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader label="Name" field="name" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Age" field="age" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Crimes" field="crimes" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Influence" field="influence" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Centrality" field="betweenness" currentSort={sort} onSort={handleSort} />
                <TableHead>Status</TableHead>
                <TableHead>Gang</TableHead>
                <TableHead>Last Arrest</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
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
                  <TableCell>{c.betweenness.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "danger" : "default"} size="sm">{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.gang || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.lastArrest}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  )
}
