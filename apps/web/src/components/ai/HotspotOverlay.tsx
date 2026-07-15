"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapboxMap, type MapMarker } from "@/components/ui/MapboxMap"

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
  const markers: MapMarker[] = useMemo(() => {
    const predictedMarkers: MapMarker[] = predicted.map((p) => ({
      id: `pred-${p.id}`,
      lat: p.lat,
      lng: p.lng,
      label: `Predicted zone ${p.id}`,
      risk: p.risk,
      color: "#C0392B",
      size: 20 + (p.incidents / 50) * 20,
      detail: `Risk: ${p.risk}/100 · ~${p.incidents} incidents · Confidence: ${Math.round(p.confidence * 100)}%`,
    }))
    const historicalMarkers: MapMarker[] = historical.map((h) => ({
      id: `hist-${h.id}`,
      lat: h.lat,
      lng: h.lng,
      label: h.name ?? "Unknown",
      risk: 0,
      color: "#06b6d4",
      size: 12 + (h.incidents / 100) * 12,
      detail: `${h.district ?? "—"} · ${h.incidents} incidents`,
    }))
    return [...predictedMarkers, ...historicalMarkers]
  }, [predicted, historical])

  const center = useMemo(() => {
    if (markers.length === 0) return [77.6, 12.97] as [number, number]
    const avgLat = markers.reduce((a, m) => a + m.lat, 0) / markers.length
    const avgLng = markers.reduce((a, m) => a + m.lng, 0) / markers.length
    return [avgLng, avgLat] as [number, number]
  }, [markers])

  if (markers.length === 0) return null

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Hotspot Map</h3>
          <p className="text-xs text-muted-foreground">
            {modelName ? `${modelName} · ` : ""}predicted risk zones vs. historical incident clusters
          </p>
        </div>
        <Badge variant="info" size="sm">
          {predicted.length} predicted · {historical.length} historical
        </Badge>
      </div>
      <MapboxMap
        markers={markers}
        center={center}
        zoom={11}
      />
    </Card>
  )
}
