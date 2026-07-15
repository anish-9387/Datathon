"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton"
import { ClusterScatter, clusterColor, type MOCluster } from "@/components/intelligence/ClusterScatter"
import { ErrorCard } from "@/components/intelligence/ErrorCard"
import { useApi } from "@/hooks/useApi"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface ClustersResponse {
  clusters: MOCluster[]
  noisePoints: number
  totalCases: number
  algorithm: string
}

interface District {
  id: number
  name: string
  cases: number
  solved: number
  stations: number
}

export default function MOClusteringPage() {
  const [district, setDistrict] = useState("")
  const [algorithm, setAlgorithm] = useState("dbscan")
  const { data: districts } = useApi<District[]>("/api/districts")

  const params = new URLSearchParams({ algorithm })
  if (district) params.set("district", district)
  const { data, error, loading, refresh } = useApi<ClustersResponse>(
    `/api/intelligence/clusters?${params.toString()}`
  )

  const clusters = data?.clusters || []

  return (
    <AppShell>
      <div className="flex flex-col" style={{ gap: "2rem" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">MO Clustering</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Density-based modus operandi cluster analysis on MO embeddings</p>
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
                { value: "dbscan", label: "DBSCAN" },
                { value: "hdbscan", label: "HDBSCAN" },
              ]}
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-32"
            />
          </div>
        </motion.div>

        {error ? (
          <ErrorCard title="Clustering failed" message={error} onRetry={refresh} />
        ) : loading || !data ? (
          <>
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Clustering MO embeddings with {algorithm.toUpperCase()}... this can take up to 30 seconds
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChartSkeleton />
              </div>
              <TableSkeleton rows={5} cols={2} />
            </div>
            <ChartSkeleton />
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Clusters", value: clusters.length },
                { label: "Cases Analyzed", value: data.totalCases },
                { label: "Noise Points", value: data.noisePoints },
                { label: "Algorithm", value: data.algorithm.toUpperCase() },
              ].map((s) => (
                <Card key={s.label} className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                </Card>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ClusterScatter clusters={clusters} />
              </div>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Cluster Details</h3>
                <div className="space-y-3 max-h-[380px] overflow-y-auto">
                  {clusters.map((c, i) => (
                    <div key={c.id} className="p-3 rounded-xl bg-[#E7DDD1]/30 border border-[#E7DDD1]/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: clusterColor(i) }} />
                          <span className="text-sm font-medium text-foreground truncate">{c.pattern}</span>
                        </div>
                        <Badge variant={c.confidence >= 75 ? "success" : c.confidence >= 50 ? "info" : "warning"} size="sm">
                          {c.confidence}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.size} incidents · {c.districts.join(", ")}</p>
                      <p className="text-[11px] text-muted mt-1">
                        {c.firstIncident} → {c.lastIncident} · {c.locations.slice(0, 2).join(", ")}
                        {c.locations.length > 2 ? ` +${c.locations.length - 2} more` : ""}
                      </p>
                    </div>
                  ))}
                  {clusters.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No clusters found</p>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Cluster Comparison</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clusters} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="pattern" tick={{ fill: "#6B6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: "#6B6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#FFFDF9", border: "1px solid #E7DDD1", borderRadius: 8, fontSize: 13, color: "#2C241E" }}
                      labelStyle={{ color: "#6B6258" }}
                    />
                    <Bar yAxisId="left" dataKey="size" radius={[4, 4, 0, 0]} name="Incidents">
                      {clusters.map((c, i) => (
                        <Cell key={c.id} fill={clusterColor(i)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
