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
    return {
      totalCases,
      solveRate: totalCases > 0 ? ((totalSolved / totalCases) * 100).toFixed(1) : "0.0",
      topPerformer: top.name.replace(/ Police Station$/i, ""),
    }
  }, [stations])

  const districtOptions = useMemo(
    () => (districtsApi.data ?? []).map((d) => ({ value: d.name, label: d.name })),
    [districtsApi.data]
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Police Station Drill-down</h1>
            <p className="text-sm text-muted-foreground">Performance and case metrics by station</p>
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
              <div className="lg:col-span-3">
                <Card className="p-6"><div className="skeleton h-[350px] rounded-xl" /></Card>
              </div>
              <div className="lg:col-span-2">
                <TableSkeleton rows={6} cols={3} />
              </div>
            </div>
          </>
        ) : error || !stations ? (
          <ErrorCard message={error || "No data returned"} onRetry={refresh} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Stations", value: String(stations.length), icon: Shield, color: "from-primary to-blue-500" },
                { label: "Total Cases", value: (summary?.totalCases ?? 0).toLocaleString(), icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
                { label: "Avg Solve Rate", value: `${summary?.solveRate ?? "0.0"}%`, icon: Star, color: "from-emerald-500 to-emerald-600" },
                { label: "Top Performer", value: summary?.topPerformer ?? "—", icon: Users, color: "from-amber-500 to-amber-600" },
              ].map((kpi, idx) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                      <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center", kpi.color)}>
                        <kpi.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                    </div>
                    <div className={cn("font-bold text-foreground truncate", kpi.value.length > 14 ? "text-lg leading-8" : "text-2xl")}>
                      {kpi.value}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <StationRanking
                  data={stations}
                  subtitle={district ? `Stations in ${district}` : "Top stations by caseload"}
                />
              </div>
              <div className="lg:col-span-2">
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Station Details</h3>
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
                              <div className="font-medium">{s.name.replace(/ Police Station$/i, "")}</div>
                              <div className="text-xs text-muted-foreground">{s.district}</div>
                            </TableCell>
                            <TableCell>{s.cases}</TableCell>
                            <TableCell>
                              <Badge variant={s.rate > 75 ? "success" : s.rate > 60 ? "warning" : "danger"}>
                                {s.rate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
