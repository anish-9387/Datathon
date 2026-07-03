"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Hotspot {
  id: string
  name: string
  lat: number
  lng: number
  risk: number
  incidents: number
  trend: string
}

interface HotspotOverlayProps {
  hotspots: Hotspot[]
  predictions?: { date: string; probability: number; type: string; confidence: string }[]
}

export function HotspotOverlay({ hotspots, predictions }: HotspotOverlayProps) {
  const maxRisk = Math.max(...hotspots.map((h) => h.risk))

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Hotspot Map Overlay</h3>
          <p className="text-xs text-muted-foreground">Predicted high-risk zones</p>
        </div>
        {predictions && (
          <Badge variant="info" size="sm">
            {predictions.filter((p) => p.confidence === "high").length} high confidence predictions
          </Badge>
        )}
      </div>
      <div className="relative bg-[#0d1b2a] rounded-xl border border-white/5 overflow-hidden" style={{ height: 400 }}>
        <div className="absolute inset-0 bg-grid opacity-20" />
        {hotspots.map((spot, idx) => {
          const x = ((spot.lng - 77.57) / (77.76 - 77.57)) * 80 + 10
          const y = ((12.93 - spot.lat) / (12.93 - 12.97)) * 40 + 20
          const size = 20 + (spot.risk / maxRisk) * 40
          const opacity = 0.3 + (spot.risk / maxRisk) * 0.5

          return (
            <motion.div
              key={spot.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.15, type: "spring" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className="rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-125"
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle, rgba(244,63,94,${opacity}), rgba(244,63,94,0.1))`,
                  border: `2px solid rgba(244,63,94,${0.3 + opacity * 0.5})`,
                }}
              >
                <span className="text-[10px] font-bold text-white">{spot.risk}</span>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="glass-card px-3 py-2 text-xs whitespace-nowrap">
                  <p className="font-medium text-foreground">{spot.name}</p>
                  <p className="text-muted-foreground">{spot.incidents} incidents · Risk: {spot.risk}</p>
                  <Badge variant={spot.trend === "increasing" ? "danger" : spot.trend === "stable" ? "warning" : "success"} size="sm">
                    {spot.trend}
                  </Badge>
                </div>
              </div>
            </motion.div>
          )
        })}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-rose-500/30 border border-rose-500/50" />
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/30" />
            <span>Medium Risk</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
