"use client"

import { motion } from "framer-motion"
import { MapPin, TrendingUp, Users, Shield } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ChartWrapper } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { mockData } from "@/lib/api"
import { cn } from "@/lib/utils"

const districtColors = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"]

export default function DistrictPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">District Analytics</h1>
          <p className="text-sm text-muted-foreground">Crime statistics across Karnataka districts</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Districts", value: mockData.districts.length, icon: MapPin, color: "from-primary to-blue-500" },
            { label: "Total Cases", value: mockData.stats.totalCases, icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
            { label: "Police Stations", value: mockData.districts.reduce((a, d) => a + d.stations, 0), icon: Shield, color: "from-emerald-500 to-emerald-600" },
            { label: "Avg Solve Rate", value: "73.2%", icon: Users, color: "from-amber-500 to-amber-600" },
          ].map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
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
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Cases by District</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.districts} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Bar dataKey="cases" radius={[4, 4, 0, 0]}>
                    {mockData.districts.map((_, idx) => (
                      <Cell key={idx} fill={districtColors[idx % districtColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">District Rankings</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead>Cases</TableHead>
                  <TableHead>Solved</TableHead>
                  <TableHead>Stations</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.districts.map((d, idx) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                        <span className="font-medium">{d.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{d.cases}</TableCell>
                    <TableCell>{d.solved}</TableCell>
                    <TableCell>{d.stations}</TableCell>
                    <TableCell>
                      <Badge variant={d.solved / d.cases > 0.7 ? "success" : "warning"}>
                        {((d.solved / d.cases) * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
