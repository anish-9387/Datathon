"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface Gang {
  id: string
  name: string
  members: number
  memberNames: string[]
  leader: string
  area: string
  crimes: string[]
  cases: number
  formed: string
  lastActive: string
  status: "active" | "dormant"
  influence: number
}

interface GangNetworkProps {
  gangs: Gang[]
}

// Radial map of the most influential detected communities (Louvain).
export function GangNetwork({ gangs }: GangNetworkProps) {
  const shown = gangs.slice(0, 10)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Gang Network Map</h3>
        <span className="text-[11px] text-muted-foreground">Top {shown.length} by influence</span>
      </div>
      <div className="relative bg-[#FBF6EE] rounded-xl border border-card-border overflow-hidden" style={{ height: 450 }}>
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(123,36,28,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(123,36,28,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        {shown.map((gang, idx) => {
          const angle = (idx / shown.length) * 2 * Math.PI - Math.PI / 2
          const x = 50 + 30 * Math.cos(angle)
          const y = 50 + 25 * Math.sin(angle)
          const size = Math.max(50, gang.influence * 1.1)

          return (
            <motion.div
              key={gang.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1, type: "spring" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <svg className="absolute -inset-4 w-28 h-28 -z-10" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill={`rgba(123,36,28,${0.05 + gang.influence / 500})`}
                  stroke="rgba(123,36,28,0.1)"
                  strokeWidth="1"
                  className="animate-pulse-soft"
                  style={{ animationDuration: `${2 + idx * 0.5}s` }}
                />
              </svg>
              <div
                className="rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg"
                style={{
                  width: size,
                  height: size,
                  background: gang.status === "active"
                    ? "linear-gradient(135deg, rgba(123,36,28,0.15), rgba(198,93,46,0.1))"
                    : "linear-gradient(135deg, rgba(232,163,58,0.15), rgba(192,57,43,0.1))",
                  borderColor: gang.status === "active" ? "rgba(123,36,28,0.3)" : "rgba(232,163,58,0.3)",
                }}
              >
                <span className="text-[10px] font-bold text-foreground text-center leading-tight px-1">{gang.name.split(" ")[0]}</span>
                <span className="text-[9px] text-muted-foreground">{gang.members}m</span>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-56">
                <div className="bg-card border border-card-border rounded-xl p-3 text-xs shadow-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{gang.name}</span>
                    <Badge variant={gang.status === "active" ? "danger" : "warning"} size="sm">{gang.status}</Badge>
                  </div>
                  <p className="text-muted-foreground">Leader: {gang.leader}</p>
                  <p className="text-muted-foreground">Area: {gang.area}</p>
                  <p className="text-muted-foreground">Linked cases: {gang.cases}</p>
                  <p className="text-muted-foreground">Influence: {gang.influence}%</p>
                  <p className="text-muted-foreground">Last active: {gang.lastActive}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {gang.crimes.slice(0, 4).map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-[#E7DDD1]/40 text-[10px] text-muted-foreground">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
