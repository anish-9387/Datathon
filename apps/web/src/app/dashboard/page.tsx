"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Shield, AlertTriangle, Clock, BarChart3, Activity } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KPISkeleton } from "@/components/ui/skeleton"
import { TimeSeriesChart } from "@/components/visualizations/TimeSeriesChart"
import { CrimeDistribution } from "@/components/visualizations/CrimeDistribution"
import { StationRanking } from "@/components/visualizations/StationRanking"
import { StatusDashboard } from "@/components/visualizations/StatusDashboard"
import { HeatMap } from "@/components/visualizations/HeatMap"
import { mockData } from "@/lib/api"
import { cn } from "@/lib/utils"

const kpiCards = [
  { label: "Total Cases", value: mockData.stats.totalCases, change: mockData.stats.trend, icon: BarChart3, color: "from-primary to-blue-500" },
  { label: "Solved", value: mockData.stats.solvedCases, change: 8.2, icon: Shield, color: "from-emerald-500 to-emerald-600" },
  { label: "Pending", value: mockData.stats.pendingCases, change: -5.1, icon: Clock, color: "from-amber-500 to-amber-600" },
  { label: "Chargesheet Rate", value: `${mockData.stats.chargesheetRate}%`, change: 3.4, icon: Activity, color: "from-cyan-500 to-cyan-600" },
]

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Intelligence Dashboard</h1>
              <p className="text-sm text-muted-foreground">Loading real-time data...</p>
            </div>
          </div>
          <KPISkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6"><div className="skeleton h-[300px] rounded-xl" /></Card>
            <Card className="p-6"><div className="skeleton h-[300px] rounded-xl" /></Card>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Intelligence Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time crime analytics for Karnataka Police</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Live
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br from-primary to-accent-cyan" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center", kpi.color)}>
                      <kpi.icon className="w-4.5 h-4.5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                  <div className="flex items-center gap-1 mt-1.5">
                    {kpi.change > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-accent-rose" />
                    )}
                    <span className={cn("text-xs font-medium", kpi.change > 0 ? "text-emerald-400" : "text-accent-rose")}>
                      {Math.abs(kpi.change)}% vs last month
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <TimeSeriesChart data={mockData.timeline} title="Crime Time Series" subtitle="Daily incidents and solved cases" height={360} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <CrimeDistribution data={mockData.crimeDistribution} title="Crime Type Distribution" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
            <StationRanking data={mockData.stationRanking} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <StatusDashboard data={mockData.caseStatus} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <HeatMap hotspots={mockData.hotspots} />
        </motion.div>
      </div>
    </AppShell>
  )
}
