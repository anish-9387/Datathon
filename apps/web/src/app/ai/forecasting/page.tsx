"use client"

import { motion } from "framer-motion"
import { TrendingUp, Brain, BarChart3 } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { PredictionCard } from "@/components/ai/PredictionCard"
import { SHAPExplanation } from "@/components/ai/SHAPExplanation"
import { FeatureImportance } from "@/components/ai/FeatureImportance"
import { ChartWrapper } from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockData } from "@/lib/api"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts"

const shapValues = [
  { feature: "Time of Day", value: 22.5, impact: 0.35 },
  { feature: "Location Risk", value: 18.3, impact: 0.28 },
  { feature: "Day of Week", value: 15.1, impact: -0.22 },
  { feature: "Previous Incidents", value: 12.7, impact: 0.18 },
  { feature: "Weather", value: 8.2, impact: -0.12 },
  { feature: "Festival Season", value: 5.9, impact: 0.08 },
  { feature: "Patrol Density", value: 3.4, impact: -0.05 },
]

const features = [
  { name: "Time of Day", importance: 95.2 },
  { name: "Location Risk Index", importance: 88.7 },
  { name: "Day of Week", importance: 76.3 },
  { name: "Previous Incidents", importance: 65.1 },
  { name: "Weather Conditions", importance: 52.8 },
  { name: "Festival Season", importance: 41.5 },
  { name: "Patrol Density", importance: 28.9 },
  { name: "Population Density", importance: 22.3 },
]

const chartData = mockData.forecast.map((f) => ({
  date: new Date(f.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
  probability: f.probability,
}))

export default function ForecastingPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Crime Forecasting</h1>
          <p className="text-sm text-muted-foreground">AI-powered crime probability predictions for the next 7 days</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Avg Probability", value: "65.1%", icon: TrendingUp, color: "from-primary to-blue-500" },
            { label: "High Confidence", value: mockData.forecast.filter(f => f.confidence === "high").length.toString(), icon: Brain, color: "from-emerald-500 to-emerald-600" },
            { label: "Top Crime Type", value: "Theft", icon: BarChart3, color: "from-amber-500 to-amber-600" },
            { label: "Risk Level", value: "Elevated", icon: TrendingUp, color: "from-rose-500 to-rose-600" },
          ].map((kpi, idx) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                    <kpi.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ChartWrapper title="Probability Trend" subtitle="Next 7 days forecast" height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }} />
                  <Area type="monotone" dataKey="probability" stroke="#3b82f6" strokeWidth={2} fill="url(#forecastGrad)" name="Probability %" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockData.forecast.map((p, idx) => (
              <PredictionCard key={p.date} prediction={p} index={idx} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SHAPExplanation values={shapValues} prediction={65.1} />
          <FeatureImportance features={features} />
        </div>
      </div>
    </AppShell>
  )
}
