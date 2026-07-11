"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Shield, Clock, BarChart3, Activity, ArrowUpRight } from "lucide-react"
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
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
      { label: "Total Cases", value: s.totalCases.toLocaleString(), change: s.trend, icon: BarChart3, color: "from-primary to-primary-light", gradient: "from-primary/10 to-primary/5" },
      { label: "Solved", value: s.solvedCases.toLocaleString(), change: solvedChange, icon: Shield, color: "from-accent-emerald to-accent-emerald/80", gradient: "from-accent-emerald/10 to-accent-emerald/5" },
      { label: "Pending", value: s.pendingCases.toLocaleString(), caption: `${s.activeInvestigations} active`, icon: Clock, color: "from-accent-amber to-accent-amber/80", gradient: "from-accent-amber/10 to-accent-amber/5" },
      { label: "Chargesheet Rate", value: `${s.chargesheetRate}%`, caption: `${s.avgResolutionDays} days avg`, icon: Activity, color: "from-accent-cyan to-accent-cyan/80", gradient: "from-accent-cyan/10 to-accent-cyan/5" },
    ] as {
      label: string
      value: string
      change?: number
      caption?: string
      icon: typeof BarChart3
      color: string
      gradient: string
    }[]
  }, [stats.data])

  if (stats.loading) {
    return (
      <AppShell>
        <motion.div className="flex flex-col" style={{ gap: "1.75rem" }} variants={containerVariants} initial="hidden" animate="visible">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Intelligence Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Loading real-time data...</p>
          </div>
          <KPISkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </motion.div>
      </AppShell>
    )
  }

  if (stats.error || !stats.data) {
    return (
      <AppShell>
        <div className="flex flex-col" style={{ gap: "1.75rem" }}>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Intelligence Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time crime analytics for Karnataka Police</p>
          </div>
          <ErrorCard message={stats.error || "No data returned"} onRetry={stats.refresh} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <motion.div
        className="flex flex-col"
        style={{ gap: "1.75rem" }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Intelligence Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time crime analytics for Karnataka Police</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm" dot>Live</Badge>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {kpiCards.map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <Card variant="gradient" padding="lg" className="relative overflow-hidden group h-full">
                <div className={cn(
                  "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500",
                  kpi.gradient
                )} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.08em]">{kpi.label}</span>
                    <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", kpi.color)}>
                      <kpi.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {kpi.change !== undefined ? (
                      <>
                        <span className={cn(
                          "flex items-center gap-0.5 text-xs font-medium",
                          kpi.change >= 0 ? "text-accent-emerald" : "text-accent-rose"
                        )}>
                          {kpi.change >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(kpi.change)}%
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">{kpi.caption}</span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {timeline.loading ? (
            <ChartSkeleton />
          ) : timeline.error ? (
            <ErrorCard message={timeline.error} onRetry={timeline.refresh} title="Failed to load timeline" />
          ) : (
            <TimeSeriesChart
              data={weeklyTimeline}
              title="Crime Time Series"
              subtitle="Weekly incidents and solved cases (last 12 months)"
              height={320}
            />
          )}
          <CrimeDistribution data={stats.data.crimeDistribution} title="Crime Type Distribution" />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {stations.loading ? (
              <ChartSkeleton />
            ) : stations.error ? (
              <ErrorCard message={stations.error} onRetry={stations.refresh} title="Failed to load stations" />
            ) : (
              <StationRanking data={stations.data || []} subtitle="Top stations by caseload" />
            )}
          </div>
          <StatusDashboard data={stats.data.byStatus} />
        </motion.div>

        <motion.div variants={itemVariants}>
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
      </motion.div>
    </AppShell>
  )
}
