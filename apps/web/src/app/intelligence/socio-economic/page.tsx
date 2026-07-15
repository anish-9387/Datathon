"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, Building2, Users, GraduationCap, AlertTriangle } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartWrapper } from "@/components/ui/chart"
import { ErrorCard } from "@/components/ui/error-card"
import { KPISkeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, CartesianGrid, Legend,
} from "recharts"

interface DistrictSocio {
  district: string
  totalCases: number
  solvedRate: number
  crimeDiversity: number
  urbanizationPct: number
  population: number
  literacyRate: number
  casesPer100k: number
}

interface SocioResponse {
  districts: DistrictSocio[]
  correlations: {
    urbanizationVsCrime: number
    literacyVsCrime: number
  }
}

const COLORS = ["#7B241C", "#C65D2E", "#2D8B55", "#E8A33A", "#C0392B", "#8B5E3C"]

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
}

export default function SocioEconomicPage() {
  const { data, error, loading, refresh } = useApi<SocioResponse>("/api/intelligence/socio-economic")

  const stats = useMemo(() => {
    if (!data?.districts) return null
    const d = data.districts
    return {
      total: d.length,
      avgUrbanization: Math.round(d.reduce((a, b) => a + b.urbanizationPct, 0) / d.length),
      avgCasesPer100k: Math.round(d.reduce((a, b) => a + b.casesPer100k, 0) / d.length * 10) / 10,
      topUrban: [...d].sort((a, b) => b.urbanizationPct - a.urbanizationPct).slice(0, 3).map((d) => d.district),
    }
  }, [data])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Socio-Economic Correlation</h1>
            <p className="text-sm text-muted-foreground mt-1">Loading correlation data...</p>
          </div>
          <KPISkeleton />
        </div>
      </AppShell>
    )
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Socio-Economic Correlation</h1>
            <p className="text-sm text-muted-foreground mt-1">Understanding the "why" behind the "where"</p>
          </div>
          <ErrorCard message={error || "No data returned"} onRetry={refresh} />
        </div>
      </AppShell>
    )
  }

  const { districts, correlations } = data

  return (
    <AppShell>
      <motion.div className="flex flex-col" style={{ gap: "2rem" }} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Socio-Economic Correlation</h1>
            <p className="text-sm text-muted-foreground mt-1">Understanding the "why" behind the "where"</p>
          </div>
          <div className="flex items-center gap-2">

          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Districts Analyzed", value: stats?.total.toString() ?? "0", icon: Building2, color: "from-primary to-primary-light" },
            { label: "Avg Urbanization", value: `${stats?.avgUrbanization ?? 0}%`, icon: TrendingUp, color: "from-accent-cyan to-accent-cyan/80" },
            { label: "Avg Crime Rate", value: `${stats?.avgCasesPer100k ?? 0}/100k`, icon: BarChart3, color: "from-accent-rose to-accent-rose/80" },
            { label: "Urban vs Crime Corr", value: correlations.urbanizationVsCrime.toFixed(2), icon: Users, color: "from-accent-amber to-accent-amber/80" },
          ].map((kpi, idx) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card className="p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.08em]">{kpi.label}</span>
                  <div className={cn("w-8 h-8 rounded-xl bg-linear-to-br flex items-center justify-center shadow-sm", kpi.color)}>
                    <kpi.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper title="Urbanization vs Crime Rate" subtitle="Cases per 100k population by urbanization %" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,36,30,0.06)" />
                <XAxis dataKey="urbanizationPct" name="Urbanization %" tick={{ fill: "#6B6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="casesPer100k" name="Cases per 100k" tick={{ fill: "#6B6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as DistrictSocio
                    return (
                      <div className="chart-tooltip">
                        <p className="font-medium text-foreground">{d.district}</p>
                        <p className="text-muted-foreground">Urbanization: {d.urbanizationPct}%</p>
                        <p className="text-muted-foreground">Cases/100k: {d.casesPer100k}</p>
                        <p className="text-muted-foreground">Total Cases: {d.totalCases}</p>
                      </div>
                    )
                  }}
                  cursor={{ fill: "rgba(123,36,28,0.04)" }}
                />
                <Scatter data={districts} fill="#7B241C" opacity={0.7}>
                  {districts.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartWrapper>

          <ChartWrapper title="Literacy Rate vs Crime Rate" subtitle="Cases per 100k population by literacy rate %" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,36,30,0.06)" />
                <XAxis dataKey="literacyRate" name="Literacy %" tick={{ fill: "#6B6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="casesPer100k" name="Cases per 100k" tick={{ fill: "#6B6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as DistrictSocio
                    return (
                      <div className="chart-tooltip">
                        <p className="font-medium text-foreground">{d.district}</p>
                        <p className="text-muted-foreground">Literacy: {d.literacyRate}%</p>
                        <p className="text-muted-foreground">Cases/100k: {d.casesPer100k}</p>
                        <p className="text-muted-foreground">Total Cases: {d.totalCases}</p>
                      </div>
                    )
                  }}
                  cursor={{ fill: "rgba(123,36,28,0.04)" }}
                />
                <Scatter data={districts} fill="#2D8B55" opacity={0.7}>
                  {districts.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">District Socio-Economic Profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Crime metrics overlaid with urbanization, population, and literacy data</p>
              </div>
              <Badge variant="info" size="sm">{districts.length} districts</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">District</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cases</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Solve Rate</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Urbanization</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Population</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Literacy</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cases/100k</th>
                  </tr>
                </thead>
                <tbody>
                  {districts.map((d, idx) => (
                    <motion.tr
                      key={d.district}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-card-border/50 hover:bg-card-hover/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-foreground">{d.district}</td>
                      <td className="py-2.5 px-3 text-right">{d.totalCases}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Badge variant={d.solvedRate > 70 ? "success" : d.solvedRate > 50 ? "warning" : "danger"} size="sm">
                          {d.solvedRate}%
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-card-border overflow-hidden">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-accent-amber to-primary"
                              style={{ width: `${d.urbanizationPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{d.urbanizationPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{(d.population / 1000000).toFixed(1)}M</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{d.literacyRate}%</td>
                      <td className="py-2.5 px-3 text-right font-medium">{d.casesPer100k.toFixed(1)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-[18px] h-[18px] text-accent-cyan" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Key Insight</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {correlations.urbanizationVsCrime > 0.3
                    ? "Urbanization shows a strong positive correlation with crime rates. Highly urbanized districts (Bengaluru Urban, Mysuru) have disproportionately higher caseloads, suggesting targeted resource allocation and community policing strategies are needed in metro areas."
                    : correlations.urbanizationVsCrime > 0
                      ? "Urbanization shows a mild positive correlation with reported crime. While metro districts see higher absolute numbers, per-capita rates suggest a more nuanced relationship with socio-economic factors."
                      : "Urbanization alone does not explain crime patterns in Karnataka. Other factors such as police density, reporting rates, and economic indicators may play a more significant role."}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-rose/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-[18px] h-[18px] text-accent-rose" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Predictive Risk Note</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Districts with above-average urbanization and below-average literacy are marked for elevated crime risk. Cross-reference with the Forecasting page for AI-driven probability scores.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AppShell>
  )
}
