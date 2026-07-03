"use client"

import { motion } from "framer-motion"
import { BarChart3 } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClusterScatter } from "@/components/intelligence/ClusterScatter"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { mockData } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export default function MOClusteringPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">MO Clustering</h1>
          <p className="text-sm text-muted-foreground">Modus operandi cluster analysis and pattern detection</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ClusterScatter clusters={mockData.clusters} />
          </div>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Cluster Details</h3>
            <div className="space-y-3">
              {mockData.clusters.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <Badge variant={c.trend === "rapid" ? "danger" : c.trend === "increasing" ? "warning" : "success"} size="sm">
                      {c.trend}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.size} incidents · {c.avgSimilarity}% similarity</p>
                  <p className="text-[11px] text-muted mt-1">{c.pattern.slice(0, 80)}...</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Cluster Comparison</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData.clusters} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar yAxisId="left" dataKey="size" radius={[4, 4, 0, 0]} name="Incidents">
                  {mockData.clusters.map((c) => (
                    <Cell key={c.id} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
