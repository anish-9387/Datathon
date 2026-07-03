"use client"

import { motion } from "framer-motion"
import { Shield, TrendingUp, Users, Star } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, SortableHeader, useTableSort } from "@/components/ui/table"
import { StationRanking } from "@/components/visualizations/StationRanking"
import { mockData } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function PoliceStationPage() {
  const { sorted, sort, handleSort } = useTableSort(mockData.stationRanking as any) as any

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Police Station Drill-down</h1>
          <p className="text-sm text-muted-foreground">Performance and case metrics by station</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Stations", value: mockData.stationRanking.length, icon: Shield, color: "from-primary to-blue-500" },
            { label: "Total Cases", value: mockData.stationRanking.reduce((a, s) => a + s.cases, 0), icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
            { label: "Avg Solve Rate", value: "74.2%", icon: Star, color: "from-emerald-500 to-emerald-600" },
            { label: "Top Performer", value: mockData.stationRanking[0].name, icon: Users, color: "from-amber-500 to-amber-600" },
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <StationRanking data={mockData.stationRanking} />
          </div>
          <div className="lg:col-span-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Station Details</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Station" field="name" currentSort={sort} onSort={handleSort} />
                    <SortableHeader label="Cases" field="cases" currentSort={sort} onSort={handleSort} />
                    <SortableHeader label="Rate" field="rate" currentSort={sort} onSort={handleSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((s: any) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.cases}</TableCell>
                      <TableCell>
                        <Badge variant={s.rate > 75 ? "success" : s.rate > 70 ? "warning" : "danger"}>
                          {s.rate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
