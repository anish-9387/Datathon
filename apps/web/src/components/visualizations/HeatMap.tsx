"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapboxMap, type MapMarker } from "@/components/ui/MapboxMap"

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
  hotspots?: Hotspot[]
  districts?: DistrictStat[]
  title?: string
  subtitle?: string
}

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

function getRiskColor(risk: number): string {
  if (risk >= 70) return "#C0392B"
  if (risk >= 40) return "#E8A33A"
  return "#2D8B55"
}

export function HeatMap({ hotspots, districts, title, subtitle }: HeatMapProps) {
  const isDistrictMode = Boolean(districts && districts.length > 0)

  const markers: MapMarker[] = useMemo(() => {
    if (isDistrictMode && districts) {
      const maxCases = Math.max(...districts.map((d) => d.cases), 1)
      return districts
        .filter((d) => DISTRICT_COORDS[d.district])
        .map((d) => {
          const [lat, lng] = DISTRICT_COORDS[d.district]
          const unsolved = d.cases - d.solved
          const risk = Math.round(((unsolved / d.cases) * 0.6 + (d.cases / maxCases) * 0.4) * 100)
          return {
            id: d.district,
            lat,
            lng,
            label: d.district,
            risk,
            color: getRiskColor(risk),
            detail: `${d.cases} cases · ${unsolved} unsolved`,
          }
        })
    }
    if (hotspots) {
      return hotspots.map((spot) => ({
        id: spot.id,
        lat: spot.lat,
        lng: spot.lng,
        label: spot.name,
        risk: spot.risk,
        color: getRiskColor(spot.risk),
        size: 22 + (spot.incidents / 50) * 20,
        detail: `${spot.incidents} incidents · ${spot.trend}`,
      }))
    }
    return []
  }, [hotspots, districts, isDistrictMode])

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
      <MapboxMap
        markers={markers}
        center={isDistrictMode ? [76.5, 15.3] : [77.6, 12.97]}
        zoom={isDistrictMode ? 6.5 : 10}
      />
    </Card>
  )
}
