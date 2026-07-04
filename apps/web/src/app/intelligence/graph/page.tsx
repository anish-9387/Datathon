"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSpinner } from "@/components/ui/loading"
import { ForceGraph, type GraphNode, type GraphEdge } from "@/components/intelligence/ForceGraph"
import { NetworkExplorer } from "@/components/intelligence/NetworkExplorer"
import { ErrorCard } from "@/components/intelligence/ErrorCard"
import { useApi } from "@/hooks/useApi"

interface GraphResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    total_nodes: number
    total_edges: number
    density: number
    connected_components: number
    avg_degree: number
  }
}

interface District {
  id: number
  name: string
  cases: number
  solved: number
  stations: number
}

const NODE_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "case", label: "Cases" },
  { value: "person", label: "Persons" },
  { value: "location", label: "Locations" },
  { value: "weapon", label: "Weapons" },
  { value: "district", label: "Districts" },
  { value: "crime_type", label: "Crime Types" },
]

export default function GraphPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [district, setDistrict] = useState("")
  const [nodeType, setNodeType] = useState("")

  const { data: districts } = useApi<District[]>("/api/districts")

  const params = new URLSearchParams({ limit: "60" })
  if (district) params.set("district", district)
  if (nodeType) params.set("type", nodeType)
  const { data, error, loading, refresh } = useApi<GraphResponse>(`/api/graph?${params.toString()}`)

  const stats = data?.stats

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Criminal Relationship Graph</h1>
            <p className="text-sm text-muted-foreground">Interactive force-directed graph of FIR entities and their relationships</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: "", label: "All Districts" },
                ...(districts || []).map((d) => ({ value: d.name, label: d.name })),
              ]}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-44"
            />
            <Select
              options={NODE_TYPE_OPTIONS}
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value)}
              className="w-36"
            />
          </div>
        </motion.div>

        {stats && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Nodes", value: stats.total_nodes },
              { label: "Edges", value: stats.total_edges },
              { label: "Density", value: stats.density.toFixed(4) },
              { label: "Components", value: stats.connected_components },
              { label: "Avg Degree", value: stats.avg_degree.toFixed(2) },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
              </Card>
            ))}
          </motion.div>
        )}

        {error ? (
          <ErrorCard
            title="Failed to build relationship graph"
            message={error}
            onRetry={refresh}
          />
        ) : loading || !data ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="p-5">
                <Skeleton variant="text" className="w-48 mb-4" />
                <div className="relative">
                  <Skeleton className="w-full rounded-xl" height={500} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Building knowledge graph from FIR corpus... this can take up to 30 seconds
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div>
              <Card className="p-5 space-y-3">
                <Skeleton className="w-full h-9 rounded-lg" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} variant="text" className="w-full h-8" />
                ))}
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ForceGraph
                nodes={data.nodes}
                edges={data.edges}
                selectedNodeId={selectedNodeId}
                onSelectNode={(node) => setSelectedNodeId(node?.id || null)}
              />
            </div>
            <div>
              <NetworkExplorer
                nodes={data.nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={(node) => setSelectedNodeId(node?.id || null)}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
