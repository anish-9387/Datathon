"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Map, TrendingUp, Shield, AlertTriangle, RefreshCw } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HotspotOverlay } from "@/components/ai/HotspotOverlay"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { KPISkeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"

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

interface HotspotResponse {
  predicted: PredictedHotspot[]
  historical: HistoricalHotspot[]
  modelInfo: { model?: string; algorithm?: string; grid_size?: number; district?: string; crime_type?: string }
}

interface District {
  id: number
  name: string
}

const CRIME_TYPES = ["Theft", "Robbery", "Burglary", "Assault", "Narcotics", "Cyber Crime"]

export default function HotspotDetectionPage() {
  const [district, setDistrict] = useState("")
  const [crimeType, setCrimeType] = useState("")

  const { data: districts } = useApi<District[]>("/api/districts")
  const params = new URLSearchParams()
  if (district) params.set("district", district)
  if (crimeType) params.set("type", crimeType)
  const qs = params.toString()
  const { data, error, loading, refresh } = useApi<HotspotResponse>(`/api/ai/hotspots${qs ? `?${qs}` : ""}`)

  const predicted = data?.predicted ?? []
  const historical = data?.historical ?? []
  const avgRisk = predicted.length > 0 ? predicted.reduce((a, p) => a + p.risk, 0) / predicted.length : 0
  const peakRisk = predicted.length > 0 ? Math.max(...predicted.map((p) => p.risk)) : 0
  const totalIncidents = historical.reduce((a, h) => a + h.incidents, 0)
  const maxHistIncidents = Math.max(...historical.map((h) => h.incidents), 1)

  return (
    <AppShell>
      <div className="flex flex-col" style={{ gap: "2rem" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Hotspot Detection</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">AI-powered crime hotspot prediction and risk assessment</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={(districts ?? []).map((d) => ({ value: d.name, label: d.name }))}
              placeholder="All districts"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-44"
            />
            <Select
              options={CRIME_TYPES.map((t) => ({ value: t, label: t }))}
              placeholder="All crime types"
              value={crimeType}
              onChange={(e) => setCrimeType(e.target.value)}
              className="w-40"
            />
          </div>
        </motion.div>

        {error ? (
          <Card>
            <EmptyState
              icon={<AlertTriangle className="w-8 h-8 text-accent-rose" />}
              title="Failed to load hotspots"
              description={error}
              action={{ label: "Retry", onClick: refresh }}
            />
          </Card>
        ) : loading ? (
          <>
            <KPISkeleton />
            <Card className="p-5">
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground" style={{ height: 400 }}>
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                Running the hotspot prediction model — this can take up to 30 seconds...
              </div>
            </Card>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Predicted Zones", value: predicted.length.toString(), icon: Map, color: "from-primary to-primary-light" },
                { label: "Peak Risk Score", value: `${peakRisk}/100`, icon: TrendingUp, color: "from-accent-rose to-accent-rose/80" },
                { label: "Avg Risk Score", value: avgRisk.toFixed(0), icon: Shield, color: "from-accent-emerald to-accent-emerald/80" },
                { label: "Historical Incidents", value: totalIncidents.toString(), icon: AlertTriangle, color: "from-accent-amber to-accent-amber/80" },
              ].map((kpi, idx) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                      <div className={cn("w-9 h-9 rounded-xl bg-linear-to-br flex items-center justify-center", kpi.color)}>
                        <kpi.icon className="w-[18px] h-[18px] text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {predicted.length === 0 && historical.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Map className="w-8 h-8 text-primary" />}
                  title="No hotspots found"
                  description="No predicted or historical hotspots for the selected filters. Try another district or crime type."
                />
              </Card>
            ) : (
              <>
                <HotspotOverlay
                  predicted={predicted}
                  historical={historical}
                  modelName={data?.modelInfo?.model}
                />

                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Top Historical Clusters</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {historical.slice(0, 9).map((spot, idx) => (
                      <motion.div
                        key={spot.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                      >
                        <Card className="p-5">
                          <div className="flex items-center justify-between mb-3 gap-2">
                            <h3 className="text-sm font-semibold text-foreground truncate">{spot.name ?? "Unknown station"}</h3>
                            <Badge variant="info" size="sm">{spot.district ?? "—"}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Incident Density</span>
                                <span>{spot.incidents} cases</span>
                              </div>
                              <div className="h-2 rounded-full bg-[#E7DDD1]/40 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(spot.incidents / maxHistIncidents) * 100}%` }}
                                  transition={{ duration: 1, delay: idx * 0.1 }}
                                  style={{
                                    background:
                                      spot.incidents / maxHistIncidents >= 0.8
                                        ? "linear-gradient(90deg, #C0392B, #E74C3C)"
                                        : spot.incidents / maxHistIncidents >= 0.5
                                          ? "linear-gradient(90deg, #E8A33A, #F0C27A)"
                                          : "linear-gradient(90deg, #2D8B55, #52BE80)",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{spot.lat.toFixed(2)}, {spot.lng.toFixed(2)}</span>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
