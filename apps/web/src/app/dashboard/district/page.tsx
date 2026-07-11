"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { MapPin, TrendingUp, Users, Shield } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { KPISkeleton } from "@/components/ui/skeleton"
import { ErrorCard } from "@/components/ui/error-card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"

interface District {
  id: number
  name: string
  cases: number
  solved: number
  stations: number
}

const districtColors = ["#7B241C", "#C65D2E", "#2D8B55", "#E8A33A", "#C0392B", "#8B5E3C", "#A63D2F"]

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
}

export default function DistrictPage() {
  const { data: districts, error, loading, refresh } = useApi<District[]>("/api/districts")

  const summary = useMemo(() => {
    if (!districts || districts.length === 0) return null
    const totalCases = districts.reduce((a, d) => a + d.cases, 0)
    const totalSolved = districts.reduce((a, d) => a + d.solved, 0)
    const totalStations = districts.reduce((a, d) => a + d.stations, 0)
    return { totalCases, totalStations, solveRate: totalCases > 0 ? ((totalSolved / totalCases) * 100).toFixed(1) : "0.0" }
  }, [districts])

  const topDistricts = useMemo(
    () => (districts ? [...districts].sort((a, b) => b.cases - a.cases).slice(0, 10) : []),
    [districts]
  )

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">District Analytics</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Loading district data...</p>
          </div>
          <KPISkeleton />
        </div>
      </AppShell>
    )
  }

  if (error || !districts) {
    return (
      <AppShell>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">District Analytics</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Crime statistics across Karnataka districts</p>
          </div>
          <ErrorCard message={error || "No data returned"} onRetry={refresh} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <motion.div className="flex flex-col p-6" style={{ gap: "1.75rem" }} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <h1 className="text-xl font-bold text-foreground tracking-tight">District Analytics</h1>
          <p className="text-sm text-muted-foreground/60 mt-1">Crime statistics across Karnataka districts</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Districts", value: districts.length, icon: MapPin, gradient: "from-primary/10 to-primary/5", color: "from-primary to-primary-light" },
            { label: "Total Cases", value: summary?.totalCases.toLocaleString() ?? "0", icon: TrendingUp, gradient: "from-accent-cyan/10 to-accent-cyan/5", color: "from-accent-cyan to-accent-cyan/80" },
            { label: "Police Stations", value: summary?.totalStations ?? 0, icon: Shield, gradient: "from-accent-emerald/10 to-accent-emerald/5", color: "from-accent-emerald to-accent-emerald/80" },
            { label: "Avg Solve Rate", value: `${summary?.solveRate ?? "0.0"}%`, icon: Users, gradient: "from-accent-amber/10 to-accent-amber/5", color: "from-accent-amber to-accent-amber/80" },
          ].map((kpi, idx) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card variant="gradient" padding="lg" className="relative overflow-hidden group">
                <div className={cn("absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500", kpi.gradient)} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.08em]">{kpi.label}</span>
                    <div className={cn("w-8 h-8 rounded-xl bg-linear-to-br flex items-center justify-center shadow-sm", kpi.color)}>
                      <kpi.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-card border border-card-border p-5">
            <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">Cases by District (Top 10)</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDistricts} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: "#6B6258", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#6B6258", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#FFFDF9", border: "1px solid #E7DDD1", borderRadius: 10, fontSize: 13, color: "#2C241E" }} cursor={{ fill: "rgba(123,36,28,0.04)" }} />
                  <Bar dataKey="cases" radius={[4, 4, 0, 0]}>
                    {topDistricts.map((_, idx) => (<Cell key={idx} fill={districtColors[idx % districtColors.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-card border border-card-border p-5">
            <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">District Rankings</h3>
            <div className="max-h-[340px] overflow-y-auto">
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
                  {districts.map((d, idx) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground/50 w-5">{idx + 1}.</span>
                          <span className="font-medium text-foreground/90">{d.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{d.cases}</TableCell>
                      <TableCell>{d.solved}</TableCell>
                      <TableCell>{d.stations}</TableCell>
                      <TableCell>
                        <Badge variant={d.cases > 0 && d.solved / d.cases > 0.7 ? "success" : "warning"} size="sm">
                          {d.cases > 0 ? ((d.solved / d.cases) * 100).toFixed(1) : "0.0"}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  )
}
