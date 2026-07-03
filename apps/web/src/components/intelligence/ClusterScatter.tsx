"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Cluster {
  id: number
  name: string
  size: number
  avgSimilarity: number
  pattern: string
  color: string
  trend: string
}

interface ClusterScatterProps {
  clusters: Cluster[]
}

export function ClusterScatter({ clusters }: ClusterScatterProps) {
  const positions = clusters.map((_, i) => {
    const angle = (i / clusters.length) * 2 * Math.PI
    const r = 25 + Math.random() * 15
    return { x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) }
  })

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">MO Cluster Visualization</h3>
      <div className="relative bg-[#0d1b2a] rounded-xl border border-white/5 overflow-hidden" style={{ height: 400 }}>
        <div className="absolute inset-0 bg-grid opacity-20" />
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
                  stroke="rgba(59,130,246,0.08)"
                  strokeWidth="1"
                />
              )
            })
          )}
        </svg>
        {clusters.map((cluster, i) => {
          const size = Math.max(40, cluster.size * 3)
          return (
            <motion.div
              key={cluster.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.15, type: "spring" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}
            >
              <div
                className="rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110"
                style={{
                  width: size,
                  height: size,
                  background: `${cluster.color}15`,
                  borderColor: `${cluster.color}40`,
                }}
              >
                <span className="text-xs font-bold" style={{ color: cluster.color }}>
                  {cluster.size}
                </span>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
                <div className="glass-card p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{cluster.name}</span>
                    <Badge variant={cluster.trend === "rapid" ? "danger" : cluster.trend === "increasing" ? "warning" : "default"} size="sm">
                      {cluster.trend}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{cluster.pattern}</p>
                  <p className="text-muted mt-1">{cluster.avgSimilarity}% avg similarity</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
