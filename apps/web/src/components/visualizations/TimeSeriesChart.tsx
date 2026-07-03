"use client"

import { useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Brush, Legend
} from "recharts"
import { ChartWrapper } from "@/components/ui/chart"

interface TimeSeriesData {
  date: string
  incidents?: number
  solved?: number
  filed?: number
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[]
  title?: string
  subtitle?: string
  height?: number
}

export function TimeSeriesChart({ data, title, subtitle, height = 400 }: TimeSeriesChartProps) {
  const [zoom, setZoom] = useState<{ start: number; end: number } | null>(null)

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

  return (
    <ChartWrapper title={title || "Crime Trends"} subtitle={subtitle || "Daily incidents over time"} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incidentsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="solvedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
            tickFormatter={(val) => val.slice(5)}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="incidents"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#incidentsGradient)"
            name="Incidents"
          />
          <Area
            type="monotone"
            dataKey="solved"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#solvedGradient)"
            name="Solved"
          />
          <Brush
            dataKey="date"
            height={30}
            stroke="#3b82f6"
            fill="rgba(13,27,42,0.6)"
            travellerWidth={10}
            gap={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
