"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface MOCluster {
  id: number
  pattern: string
  size: number
  confidence: number
  crimeTypes: string[]
  locations: string[]
  districts: string[]
  firstIncident: string
  lastIncident: string
}

export const CLUSTER_COLORS = ["#7B241C", "#C65D2E", "#2D8B55", "#E8A33A", "#C0392B", "#8B5E3C", "#A63D2F", "#6B6258", "#5C1A14", "#2D8B55"]

export function clusterColor(index: number) {
  return CLUSTER_COLORS[index % CLUSTER_COLORS.length]
}

interface ClusterScatterProps {
  clusters: MOCluster[]
}

export function ClusterScatter({ clusters }: ClusterScatterProps) {
  const positions = useMemo(
    () =>
      clusters.map((_, i) => {
        const angle = (i / Math.max(clusters.length, 1)) * 2 * Math.PI
        const r = 25 + Math.random() * 15
        return { x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) }
      }),
    [clusters]
  )

  const maxSize = Math.max(...clusters.map((c) => c.size), 1)

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">MO Cluster Visualization</h3>
      <div className="relative bg-[#FBF6EE] rounded-xl border border-card-border overflow-hidden" style={{ height: 400 }}>
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(123,36,28,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(123,36,28,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <svg className="absolute inset-0 w-full h-full">
          {clusters.map((c, i) =>
            positions.map((_, j) => {
              if (i >= j) return null
              const dist = Math.sqrt(
                Math.pow(positions[i].x - positions[j].x, 2) + Math.pow(positions[i].y - positions[j].y, 2)
              )
              if (dist > 35) return null
              return (
                <line
                  key={`${i}-${j}`}
                  x1={`${positions[i].x}%`}
                  y1={`${positions[i].y}%`}
                  x2={`${positions[j].x}%`}
                  y2={`${positions[j].y}%`}
                  stroke="rgba(123,36,28,0.1)"
                  strokeWidth="1"
                />
              )
            })
          )}
        </svg>
        {clusters.map((cluster, i) => {
          const size = Math.max(40, (cluster.size / maxSize) * 90)
          const color = clusterColor(i)
          return (
            <motion.div
              key={cluster.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}
            >
              <div
                className="rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110"
                style={{
                  width: size,
                  height: size,
                  background: `${color}15`,
                  borderColor: `${color}40`,
                }}
              >
                <span className="text-xs font-bold" style={{ color }}>
                  {cluster.size}
                </span>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
                <div className="bg-card border border-card-border rounded-xl p-3 text-xs shadow-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{cluster.pattern}</span>
                    <Badge variant={cluster.confidence >= 75 ? "success" : cluster.confidence >= 50 ? "info" : "warning"} size="sm">
                      {cluster.confidence}%
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{cluster.districts.join(", ")}</p>
                  <p className="text-muted-foreground">{cluster.locations.slice(0, 3).join(", ")}</p>
                  <p className="text-muted mt-1">
                    {cluster.size} incidents · {cluster.firstIncident} → {cluster.lastIncident}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
        {clusters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No clusters detected with the current filters</p>
          </div>
        )}
      </div>
    </Card>
  )
}
