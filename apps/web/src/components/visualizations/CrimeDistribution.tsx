"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { ChartWrapper } from "@/components/ui/chart"

interface CrimeDistItem {
  type: string
  count: number
  percentage: number
  color: string
}

interface CrimeDistributionProps {
  data: CrimeDistItem[]
  title?: string
}

export function CrimeDistribution({ data, title = "Crime Distribution" }: CrimeDistributionProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const item = payload[0].payload
    return (
      <div className="chart-tooltip">
        <p className="text-xs text-muted-foreground mb-1">{item.type}</p>
        <p className="text-sm text-foreground font-medium">{item.count} cases</p>
        <p className="text-xs text-muted-foreground">{item.percentage}%</p>
      </div>
    )
  }

  return (
    <ChartWrapper title={title} subtitle="Breakdown by crime category">
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="w-full lg:w-1/2" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="count"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full lg:w-1/2 space-y-2">
          {data.map((item) => (
            <div key={item.type} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate">{item.type}</span>
                  <span className="text-sm font-medium text-muted-foreground">{item.count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, background: item.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartWrapper>
  )
}
