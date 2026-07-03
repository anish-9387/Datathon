"use client"

import { motion } from "framer-motion"
import { Users, TrendingUp, Shield, AlertTriangle } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GangNetwork } from "@/components/intelligence/GangNetwork"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { mockData } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function GangsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Gang Detection</h1>
          <p className="text-sm text-muted-foreground">Organized crime network identification and analysis</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Active Gangs", value: mockData.gangs.length, icon: Users, color: "from-primary to-blue-500" },
            { label: "Total Members", value: mockData.gangs.reduce((a, g) => a + g.members, 0), icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
            { label: "Avg Influence", value: "74.2%", icon: Shield, color: "from-emerald-500 to-emerald-600" },
            { label: "Emerging Threats", value: mockData.gangs.filter(g => g.status === "emerging").length, icon: AlertTriangle, color: "from-amber-500 to-amber-600" },
          ].map((kpi, idx) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center", kpi.color)}>
                    <kpi.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GangNetwork gangs={mockData.gangs} />
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Gang Intelligence</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Influence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Formed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.gangs.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{g.members}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent-cyan" style={{ width: `${g.influence}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{g.influence}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={g.status === "active" ? "danger" : "warning"} size="sm">{g.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{g.formed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
