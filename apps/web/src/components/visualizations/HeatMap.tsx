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

interface DistrictStat {
  district: string
  cases: number
  solved: number
}

interface HeatMapProps {
  /** City-level hotspots (Bengaluru bounding box). */
  hotspots?: Hotspot[]
  /** District-level stats — rendered on a Karnataka-wide bounding box. */
  districts?: DistrictStat[]
  title?: string
  subtitle?: string
}

// Approximate centroids for Karnataka districts (lat, lng).
const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Bagalkote": [16.18, 75.7],
  "Ballari": [15.15, 76.92],
  "Belagavi": [15.85, 74.5],
  "Bengaluru": [12.91, 77.55],
  "Bengaluru Urban": [13.03, 77.65],
  "Bengaluru Rural": [13.28, 77.58],
  "Bidar": [17.91, 77.52],
  "Chamarajanagara": [11.93, 76.94],
  "Chikkaballapura": [13.43, 77.73],
  "Chikkamagaluru": [13.32, 75.77],
  "Chitradurga": [14.23, 76.4],
  "Dakshina Kannada": [12.85, 75.2],
  "Davanagere": [14.46, 75.92],
  "Dharwada": [15.46, 75.01],
  "Gadaga": [15.43, 75.63],
  "Hassan": [13.01, 76.1],
  "Haveri": [14.79, 75.4],
  "Kalaburagi": [17.33, 76.83],
  "Kodagu": [12.42, 75.74],
  "Kolara": [13.14, 78.13],
  "Koppala": [15.35, 76.15],
  "Mandya": [12.52, 76.9],
  "Mysuru": [12.3, 76.64],
  "Raichuru": [16.21, 77.36],
  "Ramanagara": [12.72, 77.28],
  "Shivamogga": [13.93, 75.57],
  "Tumakuru": [13.34, 77.1],
  "Udupi": [13.34, 74.75],
  "Uttara Kannada": [14.9, 74.6],
  "Vijayapura": [16.83, 75.71],
  "Yadgiri": [16.77, 77.14],
}

// Karnataka bounding box
const KA_BOUNDS = { minLat: 11.5, maxLat: 18.4, minLng: 73.9, maxLng: 78.7 }

interface Marker {
  id: string
  name: string
  x: number
  y: number
  risk: number
  detail: string
}

export function HeatMap({ hotspots, districts, title, subtitle }: HeatMapProps) {
  const isDistrictMode = Boolean(districts && districts.length > 0)
  // District risk is normalized 0-100 across districts; hotspot risk uses the original 0-100 city scale.
  const [highAt, medAt] = isDistrictMode ? [70, 40] : [85, 70]

  const getRiskColor = (risk: number) => {
    if (risk >= highAt) return "bg-[#C0392B]/15 border-[#C0392B]/40 text-[#922B21]"
    if (risk >= medAt) return "bg-[#E8A33A]/15 border-[#E8A33A]/40 text-[#9C6B1E]"
    return "bg-[#2D8B55]/15 border-[#2D8B55]/40 text-[#1E6B3A]"
  }

  let markers: Marker[] = []

  if (districts && districts.length > 0) {
    const maxCases = Math.max(...districts.map((d) => d.cases), 1)
    const maxUnsolved = Math.max(...districts.map((d) => d.cases - d.solved), 1)
    markers = districts
      .filter((d) => DISTRICT_COORDS[d.district])
      .map((d) => {
        const [lat, lng] = DISTRICT_COORDS[d.district]
        const x = ((lng - KA_BOUNDS.minLng) / (KA_BOUNDS.maxLng - KA_BOUNDS.minLng)) * 100
        const y = ((KA_BOUNDS.maxLat - lat) / (KA_BOUNDS.maxLat - KA_BOUNDS.minLat)) * 100
        const unsolved = d.cases - d.solved
        const risk = Math.round(((unsolved / maxUnsolved) * 0.6 + (d.cases / maxCases) * 0.4) * 100)
        return {
          id: d.district,
          name: d.district,
          x: Math.max(4, Math.min(96, x)),
          y: Math.max(6, Math.min(92, y)),
          risk,
          detail: `${d.cases} cases · ${unsolved} unsolved · Risk: ${risk}`,
        }
      })
  } else if (hotspots) {
    markers = hotspots.map((spot) => {
      const x = ((spot.lng - 77.57) / (77.76 - 77.57)) * 100
      const y = ((12.93 - spot.lat) / (12.93 - 12.97)) * 50 + 25
      return {
        id: spot.id,
        name: spot.name,
        x,
        y: Math.max(10, Math.min(90, y)),
        risk: spot.risk,
        detail: `${spot.incidents} incidents · Risk: ${spot.risk}`,
      }
    })
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title || "Crime Heat Map"}</h3>
          <p className="text-xs text-muted-foreground">
            {subtitle || (isDistrictMode ? "Karnataka district hotspot overview" : "Bengaluru city hotspot overview")}
          </p>
        </div>
        <Badge variant="info" size="sm">
          {markers.length} {isDistrictMode ? "districts" : "active hotspots"}
        </Badge>
      </div>
      <div className="relative bg-[#FBF6EE] rounded-xl border border-card-border overflow-hidden" style={{ height: 400 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(123,36,28,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(123,36,28,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 40% 45%, rgba(123,36,28,0.06) 0%, transparent 55%), radial-gradient(ellipse at 65% 55%, rgba(198,93,46,0.04) 0%, transparent 45%)"
        }} />
        {markers.map((spot, idx) => (
          <motion.div
            key={spot.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: Math.min(idx * 0.05, 1), type: "spring" }}
            className="absolute"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <div className="relative group cursor-pointer">
              <div className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-sm", getRiskColor(spot.risk))}>
                {spot.risk}
              </div>
              {spot.risk >= 70 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-rose animate-pulse opacity-50" />
              )}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-card border border-card-border rounded-xl px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                  <p className="font-medium text-foreground">{spot.name}</p>
                  <p className="text-muted-foreground">{spot.detail}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#2D8B55]/30" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#E8A33A]/30" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#C0392B]/30" />
            <span>High</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
