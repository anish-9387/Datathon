"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { ChartWrapper } from "@/components/ui/chart"

interface StationData {
  name: string
  cases: number
  solved: number
  rate: number
}

interface StationRankingProps {
  data: StationData[]
}

export function StationRanking({ data }: StationRankingProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="text-foreground font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.cases - a.cases)

  return (
    <ChartWrapper title="Police Station Ranking" subtitle="Cases by station">
      <div style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
            <Bar dataKey="solved" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Solved">
              {sorted.map((entry, idx) => (
                <Cell key={idx} fill="#10b981" />
              ))}
            </Bar>
            <Bar dataKey="cases" stackId="a" fill="rgba(59,130,246,0.3)" radius={[0, 4, 4, 0]} name="Total">
              {sorted.map((entry, idx) => (
                <Cell key={idx} fill={entry.rate > 75 ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.2)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartWrapper>
  )
}
