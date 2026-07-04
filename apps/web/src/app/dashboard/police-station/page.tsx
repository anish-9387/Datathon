"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Shield, TrendingUp, Users, Star } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, SortableHeader, TableCell, useTableSort } from "@/components/ui/table"
import { KPISkeleton, TableSkeleton } from "@/components/ui/skeleton"
import { ErrorCard } from "@/components/ui/error-card"
import { StationRanking } from "@/components/visualizations/StationRanking"
import { useApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"

interface Station {
  id: number
  name: string
  district: string
  cases: number
  solved: number
  officers: number
  rate: number
}

interface District {
  id: number
  name: string
  cases: number
  solved: number
  stations: number
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
}

export default function PoliceStationPage() {
  const [district, setDistrict] = useState("")

  const districtsApi = useApi<District[]>("/api/districts")
  const stationsUrl = `/api/police-stations?limit=20${district ? `&district=${encodeURIComponent(district)}` : ""}`
  const { data: stations, error, loading, refresh } = useApi<Station[]>(stationsUrl)

  const { sorted, sort, handleSort } = useTableSort(
    (stations ?? []) as unknown as Record<string, unknown>[]
  )

  const summary = useMemo(() => {
    if (!stations || stations.length === 0) return null
    const totalCases = stations.reduce((a, s) => a + s.cases, 0)
    const totalSolved = stations.reduce((a, s) => a + s.solved, 0)
    const top = [...stations].sort((a, b) => b.rate - a.rate || b.cases - a.cases)[0]
    return { totalCases, solveRate: totalCases > 0 ? ((totalSolved / totalCases) * 100).toFixed(1) : "0.0", topPerformer: top.name.replace(/ Police Station$/i, "") }
  }, [stations])

  const districtOptions = useMemo(
    () => (districtsApi.data ?? []).map((d) => ({ value: d.name, label: d.name })),
    [districtsApi.data]
  )

  return (
    <AppShell>
      <motion.div className="space-y-6 p-6" initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Police Station Drill-down</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Performance and case metrics by station</p>
          </div>
          <div className="w-full sm:w-64">
            <Select
              id="district-filter"
              aria-label="Filter by district"
              options={districtOptions}
              placeholder="All districts"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>
        </motion.div>

        {loading ? (
          <>
            <KPISkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3"><div className="rounded-2xl bg-[#0b1626] border border-[#1e3a5f]/30 p-5"><div className="skeleton h-[350px] rounded-xl" /></div></div>
              <div className="lg:col-span-2"><TableSkeleton rows={6} cols={3} /></div>
            </div>
          </>
        ) : error || !stations ? (
          <ErrorCard message={error || "No data returned"} onRetry={refresh} />
        ) : (
          <>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Stations", value: String(stations.length), icon: Shield, gradient: "from-primary/10 to-blue-500/5", color: "from-primary to-blue-500" },
                { label: "Total Cases", value: (summary?.totalCases ?? 0).toLocaleString(), icon: TrendingUp, gradient: "from-cyan-500/10 to-cyan-600/5", color: "from-cyan-500 to-cyan-600" },
                { label: "Avg Solve Rate", value: `${summary?.solveRate ?? "0.0"}%`, icon: Star, gradient: "from-emerald-500/10 to-emerald-600/5", color: "from-emerald-500 to-emerald-600" },
                { label: "Top Performer", value: summary?.topPerformer ?? "\u2014", icon: Users, gradient: "from-amber-500/10 to-amber-600/5", color: "from-amber-500 to-amber-600" },
              ].map((kpi, idx) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                  <Card variant="gradient" padding="lg" className="relative overflow-hidden group">
                    <div className={cn("absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500", kpi.gradient)} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.08em]">{kpi.label}</span>
                        <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", kpi.color)}>
                          <kpi.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className={cn("font-bold text-foreground tracking-tight truncate", kpi.value.length > 14 ? "text-lg" : "text-2xl")}>
                        {kpi.value}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <StationRanking data={stations} subtitle={district ? `Stations in ${district}` : "Top stations by caseload"} />
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-2xl bg-[#0b1626] border border-[#1e3a5f]/30 p-5">
                  <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">Station Details</h3>
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHeader label="Station" field="name" currentSort={sort} onSort={handleSort} />
                          <SortableHeader label="Cases" field="cases" currentSort={sort} onSort={handleSort} />
                          <SortableHeader label="Rate" field="rate" currentSort={sort} onSort={handleSort} />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(sorted as unknown as Station[]).map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>
                              <div className="font-medium text-foreground/90">{s.name.replace(/ Police Station$/i, "")}</div>
                              <div className="text-xs text-muted-foreground/60">{s.district}</div>
                            </TableCell>
                            <TableCell>{s.cases}</TableCell>
                            <TableCell>
                              <Badge variant={s.rate > 75 ? "success" : s.rate > 60 ? "warning" : "danger"} size="sm">
                                {s.rate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  )
}
