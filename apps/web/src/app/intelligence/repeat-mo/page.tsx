"use client"

import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { MOSimilarityMatrix } from "@/components/intelligence/MOSimilarityMatrix"
import { HeatMap } from "@/components/visualizations/HeatMap"
import { mockData } from "@/lib/api"

export default function RepeatMOPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Repeat MO Detection</h1>
          <p className="text-sm text-muted-foreground">Identify and track recurring modus operandi patterns</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MOSimilarityMatrix data={mockData.repeatMOs} />
          </div>
          <div className="space-y-4">
            <HeatMap hotspots={mockData.hotspots.filter((h) => ["Koramangala", "Indiranagar", "Whitefield"].includes(h.name))} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
