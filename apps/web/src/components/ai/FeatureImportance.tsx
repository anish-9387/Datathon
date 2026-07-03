"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Feature {
  name: string
  importance: number
}

interface FeatureImportanceProps {
  features: Feature[]
}

export function FeatureImportance({ features }: FeatureImportanceProps) {
  const sorted = [...features].sort((a, b) => b.importance - a.importance)

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Feature Importance</h3>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }}
              formatter={(value: unknown) => [`${Number(value).toFixed(1)}%`, "Importance"]}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
              {sorted.map((_, idx) => (
                <Cell key={idx} fill={idx < 3 ? "#3b82f6" : idx < 6 ? "#06b6d4" : "#64748b"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
