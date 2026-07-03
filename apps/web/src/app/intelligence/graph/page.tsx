"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Network } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { ForceGraph } from "@/components/intelligence/ForceGraph"
import { NetworkExplorer } from "@/components/intelligence/NetworkExplorer"
import { mockData } from "@/lib/api"

export default function GraphPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Criminal Relationship Graph</h1>
          <p className="text-sm text-muted-foreground">Interactive force-directed graph of criminal networks</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ForceGraph nodes={mockData.graph.nodes} edges={mockData.graph.edges} />
          </div>
          <div>
            <NetworkExplorer
              nodes={mockData.graph.nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={(node) => setSelectedNodeId(node?.id || null)}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
