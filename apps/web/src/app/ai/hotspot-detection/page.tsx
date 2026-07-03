"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Map, TrendingUp, Shield, AlertTriangle } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HotspotOverlay } from "@/components/ai/HotspotOverlay"
import { Select } from "@/components/ui/select"
import { mockData } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function HotspotDetectionPage() {
  const [timeFilter, setTimeFilter] = useState("7d")

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hotspot Detection</h1>
            <p className="text-sm text-muted-foreground">AI-powered crime hotspot prediction and risk assessment</p>
          </div>
          <Select
            options={[
              { value: "24h", label: "Last 24 Hours" },
              { value: "7d", label: "Last 7 Days" },
              { value: "30d", label: "Last 30 Days" },
            ]}
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-40"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Active Hotspots", value: mockData.hotspots.length, icon: Map, color: "from-primary to-blue-500" },
            { label: "High Risk Areas", value: mockData.hotspots.filter(h => h.risk >= 85).length, icon: TrendingUp, color: "from-rose-500 to-rose-600" },
            { label: "Avg Risk Score", value: (mockData.hotspots.reduce((a, h) => a + h.risk, 0) / mockData.hotspots.length).toFixed(0), icon: Shield, color: "from-emerald-500 to-emerald-600" },
            { label: "Rising Trends", value: mockData.hotspots.filter(h => h.trend === "increasing").length, icon: AlertTriangle, color: "from-amber-500 to-amber-600" },
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

        <HotspotOverlay hotspots={mockData.hotspots} predictions={mockData.forecast} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {mockData.hotspots.map((spot, idx) => (
            <motion.div
              key={spot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">{spot.name}</h3>
                  <Badge variant={spot.trend === "increasing" ? "danger" : spot.trend === "stable" ? "warning" : "success"} size="sm">
                    {spot.trend}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Risk Score</span>
                      <span>{spot.risk}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${spot.risk}%` }}
                        transition={{ duration: 1, delay: idx * 0.15 }}
                        style={{ background: spot.risk >= 85 ? "linear-gradient(90deg, #f43f5e, #fb7185)" : spot.risk >= 70 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #10b981, #34d399)" }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{spot.incidents} incidents</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
