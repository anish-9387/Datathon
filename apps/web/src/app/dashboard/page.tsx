"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Shield, Clock, BarChart3, Activity } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KPISkeleton, ChartSkeleton } from "@/components/ui/skeleton"
import { ErrorCard } from "@/components/ui/error-card"
import { TimeSeriesChart } from "@/components/visualizations/TimeSeriesChart"
import { CrimeDistribution } from "@/components/visualizations/CrimeDistribution"
import { StationRanking } from "@/components/visualizations/StationRanking"
import { StatusDashboard } from "@/components/visualizations/StatusDashboard"
import { HeatMap } from "@/components/visualizations/HeatMap"
import { useApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"

interface DashboardStats {
  totalCases: number
  solvedCases: number
  pendingCases: number
  chargesheetRate: number
  trend: number
  riskIndex: number
  activeInvestigations: number
  avgResolutionDays: number
  monthlyBreakdown: { month: string; incidents: number; solved: number }[]
  byDistrict: { district: string; cases: number; solved: number }[]
  crimeDistribution: { type: string; count: number; percentage: number; color: string }[]
  byStatus: { status: string; count: number; percentage: number }[]
}

interface TimelinePoint {
  date: string
  incidents: number
  filed: number
  solved: number
}

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

// Aggregate daily points into weekly buckets (week starts Monday) so sparse
// single-digit daily counts render as a readable trend.
function aggregateWeekly(data: TimelinePoint[]): TimelinePoint[] {
  const weeks = new Map<string, TimelinePoint>()
  for (const point of data) {
    const dt = new Date(`${point.date}T00:00:00Z`)
    dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7))
    const key = dt.toISOString().slice(0, 10)
    const bucket = weeks.get(key) || { date: key, incidents: 0, filed: 0, solved: 0 }
    bucket.incidents += point.incidents
    bucket.filed += point.filed
    bucket.solved += point.solved
    weeks.set(key, bucket)
  }
  return [...weeks.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export default function DashboardPage() {
  const stats = useApi<DashboardStats>("/api/cases/stats")
  const timeline = useApi<TimelinePoint[]>("/api/cases/timeline?days=365")
  const stations = useApi<Station[]>("/api/police-stations?limit=8")
  const districts = useApi<District[]>("/api/districts")

  const weeklyTimeline = useMemo(
    () => (timeline.data ? aggregateWeekly(timeline.data) : []),
    [timeline.data]
  )

  const kpiCards = useMemo(() => {
    const s = stats.data
    if (!s) return []
    const mb = s.monthlyBreakdown
    const last = mb[mb.length - 1]
    const prev = mb[mb.length - 2]
    const solvedChange =
      last && prev && prev.solved > 0
        ? Math.round(((last.solved - prev.solved) / prev.solved) * 1000) / 10
        : 0
    return [
      { label: "Total Cases", value: s.totalCases.toLocaleString(), change: s.trend, icon: BarChart3, color: "from-primary to-blue-500" },
      { label: "Solved", value: s.solvedCases.toLocaleString(), change: solvedChange, icon: Shield, color: "from-emerald-500 to-emerald-600" },
      { label: "Pending", value: s.pendingCases.toLocaleString(), caption: `${s.activeInvestigations} active investigations`, icon: Clock, color: "from-amber-500 to-amber-600" },
      { label: "Chargesheet Rate", value: `${s.chargesheetRate}%`, caption: `Avg resolution ${s.avgResolutionDays} days`, icon: Activity, color: "from-cyan-500 to-cyan-600" },
    ] as {
      label: string
      value: string
      change?: number
      caption?: string
      icon: typeof BarChart3
      color: string
    }[]
  }, [stats.data])

  if (stats.loading) {
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

  if (stats.error || !stats.data) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Intelligence Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time crime analytics for Karnataka Police</p>
          </div>
          <ErrorCard message={stats.error || "No data returned"} onRetry={stats.refresh} />
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
                    {kpi.change !== undefined ? (
                      <>
                        {kpi.change >= 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-accent-rose" />
                        )}
                        <span className={cn("text-xs font-medium", kpi.change >= 0 ? "text-emerald-400" : "text-accent-rose")}>
                          {Math.abs(kpi.change)}% vs last month
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">{kpi.caption}</span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {timeline.loading ? (
              <ChartSkeleton />
            ) : timeline.error ? (
              <ErrorCard message={timeline.error} onRetry={timeline.refresh} title="Failed to load timeline" />
            ) : (
              <TimeSeriesChart
                data={weeklyTimeline}
                title="Crime Time Series"
                subtitle="Weekly incidents and solved cases (last 12 months)"
                height={360}
              />
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <CrimeDistribution data={stats.data.crimeDistribution} title="Crime Type Distribution" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
            {stations.loading ? (
              <ChartSkeleton />
            ) : stations.error ? (
              <ErrorCard message={stations.error} onRetry={stations.refresh} title="Failed to load stations" />
            ) : (
              <StationRanking data={stations.data || []} subtitle="Top stations by caseload" />
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <StatusDashboard data={stats.data.byStatus} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          {districts.loading ? (
            <ChartSkeleton />
          ) : districts.error ? (
            <ErrorCard message={districts.error} onRetry={districts.refresh} title="Failed to load district map" />
          ) : (
            <HeatMap
              districts={(districts.data || []).map((d) => ({ district: d.name, cases: d.cases, solved: d.solved }))}
            />
          )}
        </motion.div>
      </div>
    </AppShell>
  )
}
