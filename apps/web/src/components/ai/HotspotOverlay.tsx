"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PredictedHotspot {
  id: string
  lat: number
  lng: number
  risk: number
  incidents: number
  confidence: number
}

interface HistoricalHotspot {
  id: string
  name: string | null
  district: string | null
  lat: number
  lng: number
  incidents: number
}

interface HotspotOverlayProps {
  predicted: PredictedHotspot[]
  historical: HistoricalHotspot[]
  modelName?: string
}

export function HotspotOverlay({ predicted, historical, modelName }: HotspotOverlayProps) {
  const allPoints = [
    ...predicted.map((p) => ({ lat: p.lat, lng: p.lng })),
    ...historical.map((h) => ({ lat: h.lat, lng: h.lng })),
  ]
  if (allPoints.length === 0) return null

  const minLat = Math.min(...allPoints.map((p) => p.lat))
  const maxLat = Math.max(...allPoints.map((p) => p.lat))
  const minLng = Math.min(...allPoints.map((p) => p.lng))
  const maxLng = Math.max(...allPoints.map((p) => p.lng))
  const latSpan = Math.max(maxLat - minLat, 0.01)
  const lngSpan = Math.max(maxLng - minLng, 0.01)

  const toX = (lng: number) => ((lng - minLng) / lngSpan) * 88 + 6
  const toY = (lat: number) => ((maxLat - lat) / latSpan) * 84 + 8

  const maxPredIncidents = Math.max(...predicted.map((p) => p.incidents), 1)
  const maxHistIncidents = Math.max(...historical.map((h) => h.incidents), 1)
  const maxRisk = Math.max(...predicted.map((p) => p.risk), 1)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Hotspot Map Overlay</h3>
          <p className="text-xs text-muted-foreground">
            {modelName ? `${modelName} · ` : ""}predicted risk grid vs. historical incident clusters
          </p>
        </div>
        <Badge variant="info" size="sm">
          {predicted.length} predicted zones · {historical.length} historical clusters
        </Badge>
      </div>
      <div className="relative bg-[#0d1b2a] rounded-xl border border-white/5 overflow-hidden" style={{ height: 400 }}>
        <div className="absolute inset-0 bg-grid opacity-20" />
        {predicted.map((spot, idx) => {
          const size = 22 + (spot.incidents / maxPredIncidents) * 34
          const intensity = spot.risk / maxRisk
          const opacity = 0.15 + intensity * 0.45

          return (
            <motion.div
              key={spot.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.03, type: "spring" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${toX(spot.lng)}%`, top: `${toY(spot.lat)}%` }}
            >
              <div
                className="rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-125"
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle, rgba(244,63,94,${opacity}), rgba(244,63,94,0.05))`,
                  border: `1.5px solid rgba(244,63,94,${0.25 + opacity * 0.5})`,
                }}
              >
                <span className="text-[9px] font-bold text-white/90">{spot.risk}</span>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="glass-card px-3 py-2 text-xs whitespace-nowrap">
                  <p className="font-medium text-foreground">Predicted zone {spot.id}</p>
                  <p className="text-muted-foreground">Risk: {spot.risk}/100 · ~{spot.incidents} incidents</p>
                  <p className="text-muted-foreground">Confidence: {Math.round(spot.confidence * 100)}%</p>
                </div>
              </div>
            </motion.div>
          )
        })}
        {historical.map((spot, idx) => {
          const size = 10 + (spot.incidents / maxHistIncidents) * 10
          return (
            <motion.div
              key={spot.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + idx * 0.05, type: "spring" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
              style={{ left: `${toX(spot.lng)}%`, top: `${toY(spot.lat)}%` }}
            >
              <div
                className="rounded-full border-2 border-cyan-400/70 bg-cyan-400/20 transition-all duration-300 group-hover:scale-125"
                style={{ width: size, height: size }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="glass-card px-3 py-2 text-xs whitespace-nowrap">
                  <p className="font-medium text-foreground">{spot.name ?? "Unknown station"}</p>
                  <p className="text-muted-foreground">{spot.district ?? "—"} · {spot.incidents} incidents</p>
                </div>
              </div>
            </motion.div>
          )
        })}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/50" />
            <span>Predicted risk zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-400/20 border border-cyan-400/70" />
            <span>Historical cluster</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
