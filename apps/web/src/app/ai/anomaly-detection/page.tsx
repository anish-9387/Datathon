"use client"

import { motion } from "framer-motion"
import { AlertTriangle, Activity, TrendingUp, Search } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnomalyAlert } from "@/components/ai/AnomalyAlert"
import { ChartWrapper } from "@/components/ui/chart"
import { mockData } from "@/lib/api"
import { cn } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const anomalyTimeline = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(2025, 3, 29 + i).toISOString().split("T")[0].slice(5),
  score: Math.floor(Math.random() * 40) + 40 + (i > 10 ? 20 : 0),
  base: 50,
}))

export default function AnomalyDetectionPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Anomaly Detection</h1>
          <p className="text-sm text-muted-foreground">AI-powered detection of unusual crime patterns and emerging threats</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Active Alerts", value: mockData.anomalies.length, icon: AlertTriangle, color: "from-rose-500 to-rose-600" },
            { label: "Confirmed", value: mockData.anomalies.filter(a => a.status === "confirmed").length, icon: Activity, color: "from-emerald-500 to-emerald-600" },
            { label: "Investigating", value: mockData.anomalies.filter(a => a.status === "investigating").length, icon: TrendingUp, color: "from-amber-500 to-amber-600" },
            { label: "Avg Anomaly Score", value: (mockData.anomalies.reduce((a, an) => a + an.score, 0) / mockData.anomalies.length).toFixed(0), icon: Search, color: "from-primary to-blue-500" },
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {mockData.anomalies.map((anomaly, idx) => (
              <AnomalyAlert key={anomaly.id} anomaly={anomaly} index={idx} />
            ))}
          </div>
          <div className="space-y-6">
            <ChartWrapper title="Anomaly Score Timeline" subtitle="Last 14 days" height={250}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={anomalyTimeline}>
                  <defs>
                    <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }} />
                  <Area type="monotone" dataKey="score" stroke="#f43f5e" strokeWidth={2} fill="url(#anomalyGrad)" name="Anomaly Score" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Alert Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total alerts</span>
                  <span className="text-foreground font-medium">{mockData.anomalies.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">High priority</span>
                  <span className="text-accent-rose font-medium">{mockData.anomalies.filter(a => a.score >= 85).length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Avg response time</span>
                  <span className="text-foreground font-medium">4.2 hours</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
