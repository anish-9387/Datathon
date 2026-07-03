"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Hotspot {
  id: string
  name: string
  lat: number
  lng: number
  risk: number
  incidents: number
  trend: string
}

interface HeatMapProps {
  hotspots: Hotspot[]
}

export function HeatMap({ hotspots }: HeatMapProps) {
  const getRiskColor = (risk: number) => {
    if (risk >= 85) return "bg-rose-500/20 border-rose-500/30 text-rose-400"
    if (risk >= 70) return "bg-amber-500/20 border-amber-500/30 text-amber-400"
    return "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Crime Heat Map</h3>
          <p className="text-xs text-muted-foreground">Bengaluru city hotspot overview</p>
        </div>
        <Badge variant="info" size="sm">{hotspots.length} active hotspots</Badge>
      </div>
      <div className="relative bg-[#0d1b2a] rounded-xl border border-white/5 overflow-hidden" style={{ height: 400 }}>
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 30% 40%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(6,182,212,0.1) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(16,185,129,0.05) 0%, transparent 60%)"
        }} />
        {hotspots.map((spot, idx) => {
          const x = ((spot.lng - 77.57) / (77.76 - 77.57)) * 100
          const y = ((12.93 - spot.lat) / (12.93 - 12.97)) * 50 + 25
          return (
            <motion.div
              key={spot.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.15, type: "spring" }}
              className="absolute"
              style={{ left: `${x}%`, top: `${Math.max(10, Math.min(90, y))}%` }}
            >
              <div className="relative group cursor-pointer">
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold", getRiskColor(spot.risk))}>
                  {spot.risk}
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-rose animate-pulse opacity-50" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="glass-card px-3 py-2 text-xs whitespace-nowrap">
                    <p className="font-medium text-foreground">{spot.name}</p>
                    <p className="text-muted-foreground">{spot.incidents} incidents · Risk: {spot.risk}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
        <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500/30" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/30" />
            <span>High</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
