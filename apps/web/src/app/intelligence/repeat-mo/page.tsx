"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, MapPin } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { TableSkeleton, CardSkeleton } from "@/components/ui/skeleton"
import { MOSimilarityMatrix, type RepeatMO } from "@/components/intelligence/MOSimilarityMatrix"
import { ErrorCard } from "@/components/intelligence/ErrorCard"
import { useApi } from "@/hooks/useApi"

interface RepeatMOResponse {
  patterns: RepeatMO[]
  corpusSize: number
}

interface District {
  id: number
  name: string
  cases: number
  solved: number
  stations: number
}

export default function RepeatMOPage() {
  const [district, setDistrict] = useState("")
  const [minSize, setMinSize] = useState("3")
  const { data: districts } = useApi<District[]>("/api/districts")

  const params = new URLSearchParams({ minSize })
  if (district) params.set("district", district)
  const { data, error, loading, refresh } = useApi<RepeatMOResponse>(
    `/api/intelligence/repeat-mo?${params.toString()}`
  )

  const patterns = data?.patterns || []

  const riskCounts = {
    critical: patterns.filter((p) => p.risk === "critical").length,
    high: patterns.filter((p) => p.risk === "high").length,
    medium: patterns.filter((p) => p.risk === "medium").length,
  }

  const locationFrequency = patterns
    .flatMap((p) => p.locations.map((loc) => ({ loc, freq: p.frequency })))
    .reduce<Record<string, number>>((acc, { loc, freq }) => {
      acc[loc] = (acc[loc] || 0) + freq
      return acc
    }, {})
  const topLocations = Object.entries(locationFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const maxLocFreq = topLocations[0]?.[1] || 1

  return (
    <AppShell>
      <div className="flex flex-col" style={{ gap: "2rem" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Repeat MO Detection</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Identify and track recurring modus operandi patterns</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: "", label: "All Districts" },
                ...(districts || []).map((d) => ({ value: d.name, label: d.name })),
              ]}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-44"
            />
            <Select
              options={[
                { value: "3", label: "Min 3 cases" },
                { value: "4", label: "Min 4 cases" },
                { value: "5", label: "Min 5 cases" },
              ]}
              value={minSize}
              onChange={(e) => setMinSize(e.target.value)}
              className="w-36"
            />
          </div>
        </motion.div>

        {error ? (
          <ErrorCard title="Repeat MO detection failed" message={error} onRetry={refresh} />
        ) : loading || !data ? (
          <>
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Mining recurring MO patterns from the FIR corpus... this can take up to 30 seconds
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TableSkeleton rows={5} cols={3} />
              </div>
              <div className="space-y-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MOSimilarityMatrix data={patterns} />
            </div>
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Risk Breakdown</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {patterns.length} patterns
                  </div>
                </div>
                <div className="space-y-4">
                  {([
                    { label: "Critical", count: riskCounts.critical, color: "linear-gradient(90deg, #C0392B, #E74C3C)", variant: "danger" as const },
                    { label: "High", count: riskCounts.high, color: "linear-gradient(90deg, #E8A33A, #F0C27A)", variant: "warning" as const },
                    { label: "Medium", count: riskCounts.medium, color: "linear-gradient(90deg, #C65D2E, #D4875E)", variant: "info" as const },
                  ]).map((r) => (
                    <div key={r.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <Badge variant={r.variant} size="sm">{r.label}</Badge>
                        <span className="font-medium text-foreground">{r.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#E7DDD1]/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${patterns.length ? (r.count / patterns.length) * 100 : 0}%` }}
                          transition={{ duration: 1 }}
                          style={{ background: r.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted mt-4">Corpus analyzed: {data.corpusSize} FIRs</p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Hotspot Stations</h3>
                </div>
                <div className="space-y-3">
                  {topLocations.map(([loc, freq], idx) => (
                    <motion.div
                      key={loc}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground truncate pr-2">{loc}</span>
                        <span className="font-medium text-foreground flex-shrink-0">{freq}</span>
                      </div>
                      <div className="h-1 rounded-full bg-[#E7DDD1]/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-linear-to-r from-primary to-accent-cyan"
                          initial={{ width: 0 }}
                          animate={{ width: `${(freq / maxLocFreq) * 100}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                  {topLocations.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No locations</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
