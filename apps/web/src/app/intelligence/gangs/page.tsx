"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Users, TrendingUp, Shield, Network } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { KPISkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton"
import { GangNetwork, type Gang } from "@/components/intelligence/GangNetwork"
import { ErrorCard } from "@/components/intelligence/ErrorCard"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { useApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"

interface GangsResponse {
  gangs: Gang[]
  totalGangs: number
  modularity: number
  corpusSize: number
}

interface District {
  id: number
  name: string
  cases: number
  solved: number
  stations: number
}

export default function GangsPage() {
  const [district, setDistrict] = useState("")
  const { data: districts } = useApi<District[]>("/api/districts")

  const params = new URLSearchParams()
  if (district) params.set("district", district)
  const qs = params.toString()
  const { data, error, loading, refresh } = useApi<GangsResponse>(
    `/api/intelligence/gangs${qs ? `?${qs}` : ""}`
  )

  const gangs = data?.gangs || []

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gang Detection</h1>
            <p className="text-sm text-muted-foreground">Louvain community detection over the criminal co-offending network</p>
          </div>
          <Select
            options={[
              { value: "", label: "All Districts" },
              ...(districts || []).map((d) => ({ value: d.name, label: d.name })),
            ]}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-44"
          />
        </motion.div>

        {error ? (
          <ErrorCard title="Gang detection failed" message={error} onRetry={refresh} />
        ) : loading || !data ? (
          <>
            <KPISkeleton />
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Running community detection on the FIR network... this can take up to 30 seconds
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton />
              <TableSkeleton rows={8} cols={5} />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Detected Networks", value: data.totalGangs, icon: Users, color: "from-primary to-blue-500" },
                { label: "Total Members", value: gangs.reduce((a, g) => a + g.members, 0), icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
                { label: "Modularity", value: data.modularity.toFixed(3), icon: Shield, color: "from-emerald-500 to-emerald-600" },
                { label: "Active Networks", value: gangs.filter((g) => g.status === "active").length, icon: Network, color: "from-amber-500 to-amber-600" },
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
              <GangNetwork gangs={gangs} />
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Gang Intelligence</h3>
                  <span className="text-[11px] text-muted-foreground">{gangs.length} networks · corpus {data.corpusSize}</span>
                </div>
                <div className="max-h-[440px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Cases</TableHead>
                        <TableHead>Influence</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Formed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gangs.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.name}</TableCell>
                          <TableCell>{g.members}</TableCell>
                          <TableCell>{g.cases}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent-cyan" style={{ width: `${g.influence}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{g.influence}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={g.status === "active" ? "danger" : "warning"} size="sm">{g.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{g.formed}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
