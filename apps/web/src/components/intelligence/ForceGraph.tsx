"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface GraphNode {
  id: string
  label: string
  type: string
  weight: number
}

export interface GraphEdge {
  source: string
  target: string
  type: string
  weight: number
  relationship?: string
  color?: string
}

interface ForceGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId?: string | null
  onSelectNode?: (node: GraphNode | null) => void
}

// Real knowledge-graph entity types coming from /api/graph
export const NODE_COLORS: Record<string, string> = {
  case: "#7B241C",
  person: "#C0392B",
  location: "#2D8B55",
  weapon: "#E8A33A",
  district: "#8B5E3C",
  crime_type: "#C65D2E",
}

export const NODE_TYPE_LABELS: Record<string, string> = {
  case: "Case",
  person: "Person",
  location: "Location",
  weapon: "Weapon",
  district: "District",
  crime_type: "Crime Type",
}

export const NODE_BADGE_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info" | "purple"> = {
  case: "info",
  person: "danger",
  location: "success",
  weapon: "warning",
  district: "purple",
  crime_type: "default",
}

function nodeSize(node: GraphNode) {
  // weight = node degree; keep FIR/case hubs visually dominant
  const base = node.type === "case" ? 9 : node.type === "district" ? 8 : 6
  return Math.min(14, base + Math.min(node.weight, 10) * 0.6)
}

export function ForceGraph({ nodes, edges, selectedNodeId, onSelectNode }: ForceGraphProps) {
  const [internalSelected, setInternalSelected] = useState<GraphNode | null>(null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(undefined)

  const controlled = selectedNodeId !== undefined
  const selectedNode = controlled
    ? nodes.find((n) => n.id === selectedNodeId) || null
    : internalSelected

  const selectNode = useCallback(
    (node: GraphNode | null) => {
      if (onSelectNode) onSelectNode(node)
      if (!controlled) setInternalSelected(node)
    },
    [onSelectNode, controlled]
  )

  // Precompute adjacency so the simulation loop stays O(n²) instead of O(n²·E)
  const edgeSet = useMemo(() => {
    const set = new Set<string>()
    edges.forEach((e) => {
      set.add(`${e.source}|${e.target}`)
      set.add(`${e.target}|${e.source}`)
    })
    return set
  }, [edges])

  const initPositions = useCallback(() => {
    const pos: Record<string, { x: number; y: number }> = {}
    nodes.forEach((node, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * 2 * Math.PI
      const radius = 120 + Math.random() * 80
      pos[node.id] = {
        x: 300 + radius * Math.cos(angle),
        y: 250 + radius * Math.sin(angle),
      }
    })
    return pos
  }, [nodes])

  useEffect(() => {
    setPositions(initPositions())
  }, [initPositions])

  useEffect(() => {
    if (Object.keys(positions).length === 0) return

    const simulateForces = () => {
      setPositions((prev) => {
        const newPos = { ...prev }
        const keys = Object.keys(newPos)
        if (keys.length === 0) return prev

        const center = { x: 300, y: 250 }

        for (let i = 0; i < keys.length; i++) {
          const a = newPos[keys[i]]
          if (!a) continue

          const cx = center.x - a.x
          const cy = center.y - a.y
          a.x += cx * 0.001
          a.y += cy * 0.001

          for (let j = i + 1; j < keys.length; j++) {
            const b = newPos[keys[j]]
            if (!b) continue
            let dx = a.x - b.x
            let dy = a.y - b.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1

            const linked = edgeSet.has(`${keys[i]}|${keys[j]}`)
            const idealDist = linked ? 55 : 120

            if (dist < idealDist) {
              const force = ((idealDist - dist) / dist) * 0.02
              dx *= force
              dy *= force
              a.x += dx
              a.y += dy
              b.x -= dx
              b.y -= dy
            }

            if (!linked && dist < 70) {
              const repel = ((70 - dist) / dist) * 0.01
              dx = (dx / dist) * repel * 70
              dy = (dy / dist) * repel * 70
              a.x += dx
              a.y += dy
              b.x -= dx
              b.y -= dy
            }
          }
        }

        return newPos
      })
      animFrameRef.current = requestAnimationFrame(simulateForces)
    }

    animFrameRef.current = requestAnimationFrame(simulateForces)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(positions).length === 0, edgeSet])

  const connectedNodes = selectedNode
    ? edges
        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
        .flatMap((e) => [e.source, e.target])
    : []

  const selectedEdges = selectedNode
    ? edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : []

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Criminal Knowledge Graph</h3>
          <p className="text-xs text-muted-foreground">Force-directed FIR entity relationship visualization</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span>{NODE_TYPE_LABELS[type] || type}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative bg-[#FBF6EE] rounded-xl border border-card-border overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: 500 }}
      >
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(123,36,28,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(123,36,28,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <svg className="absolute inset-0 w-full h-full">
          {edges.map((edge, i) => {
            const source = positions[edge.source]
            const target = positions[edge.target]
            if (!source || !target) return null
            const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id)
            return (
              <line
                key={i}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={edge.color || (isHighlighted ? "rgba(123,36,28,0.4)" : "rgba(123,36,28,0.08)")}
                strokeWidth={isHighlighted ? 2 : 1}
                className="transition-all duration-300"
              />
            )
          })}
        </svg>
        {nodes.map((node) => {
          const pos = positions[node.id]
          if (!pos) return null
          const isHighlighted = selectedNode ? selectedNode.id === node.id || connectedNodes.includes(node.id) : true
          const size = nodeSize(node)
          const color = NODE_COLORS[node.type] || "#64748b"

          return (
            <motion.div
              key={node.id}
              className="absolute cursor-pointer group"
              style={{
                left: pos.x - size,
                top: pos.y - size,
                opacity: isHighlighted ? 1 : 0.2,
              }}
              onClick={() => selectNode(selectedNode?.id === node.id ? null : node)}
              whileHover={{ scale: 1.2 }}
            >
              <div
                className="rounded-full border-2 flex items-center justify-center transition-all duration-300"
                style={{
                  width: size * 2,
                  height: size * 2,
                  background: `${color}20`,
                  borderColor: `${color}60`,
                }}
              >
                <span className="text-[9px] font-bold" style={{ color }}>
                  {node.label[0]}
                </span>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <span className="text-[10px] bg-card px-2 py-0.5 rounded border border-card-border text-foreground">
                  {node.label} · {NODE_TYPE_LABELS[node.type] || node.type}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-[#E7DDD1]/20 border border-[#E7DDD1]/50"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">{selectedNode.label}</span>
                <Badge variant={NODE_BADGE_VARIANTS[selectedNode.type] || "default"} size="sm">
                  {NODE_TYPE_LABELS[selectedNode.type] || selectedNode.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Degree: {selectedNode.weight} · {selectedEdges.length} connections
                {selectedEdges.length > 0 && (
                  <>
                    {" · "}
                    {Array.from(new Set(selectedEdges.map((e) => e.relationship || e.type)))
                      .slice(0, 4)
                      .map((r) => r.replace(/_/g, " "))
                      .join(", ")}
                  </>
                )}
              </p>
            </div>
            <button onClick={() => selectNode(null)} className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0 ml-3">
              Close
            </button>
          </div>
        </motion.div>
      )}
    </Card>
  )
}
