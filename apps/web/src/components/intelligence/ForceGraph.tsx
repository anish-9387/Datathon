"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GraphNode {
  id: string
  label: string
  type: string
  weight: number
}

interface GraphEdge {
  source: string
  target: string
  type: string
  weight: number
  color?: string
}

interface ForceGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const nodeColors: Record<string, string> = {
  criminal: "#f43f5e",
  associate: "#f59e0b",
  victim: "#10b981",
  officer: "#3b82f6",
}

const nodeSizes: Record<string, number> = {
  criminal: 12,
  associate: 8,
  victim: 6,
  officer: 10,
}

export function ForceGraph({ nodes, edges }: ForceGraphProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(undefined)

  const initPositions = useCallback(() => {
    const pos: Record<string, { x: number; y: number }> = {}
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI
      const radius = 120 + Math.random() * 60
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
          const nodeA = nodes.find((n) => n.id === keys[i])
          if (!nodeA) continue
          const a = newPos[keys[i]]
          if (!a) continue

          const cx = center.x - a.x
          const cy = center.y - a.y
          const cd = Math.sqrt(cx * cx + cy * cy) || 1
          a.x += cx * 0.001
          a.y += cy * 0.001

          for (let j = i + 1; j < keys.length; j++) {
            const b = newPos[keys[j]]
            if (!b) continue
            let dx = a.x - b.x
            let dy = a.y - b.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1

            const edge = edges.find(
              (e) => (e.source === keys[i] && e.target === keys[j]) || (e.source === keys[j] && e.target === keys[i])
            )
            const idealDist = edge ? 60 : 130

            if (dist < idealDist) {
              const force = (idealDist - dist) / dist * 0.02
              dx *= force
              dy *= force
              a.x += dx
              a.y += dy
              b.x -= dx
              b.y -= dy
            }

            if (!edge && dist < 80) {
              const repel = (80 - dist) / dist * 0.01
              dx = (dx / dist) * repel * 80
              dy = (dy / dist) * repel * 80
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
  }, [positions, nodes, edges])

  const connectedNodes = selectedNode
    ? edges
        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
        .flatMap((e) => [e.source, e.target])
    : []

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Criminal Network Graph</h3>
          <p className="text-xs text-muted-foreground">Force-directed relationship visualization</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {Object.entries(nodeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative bg-[#0d1b2a] rounded-xl border border-white/5 overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: 500 }}
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
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
                stroke={edge.color || (isHighlighted ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.06)")}
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
          const size = nodeSizes[node.type] || 8

          return (
            <motion.div
              key={node.id}
              className="absolute cursor-pointer group"
              style={{
                left: pos.x - size,
                top: pos.y - size,
                opacity: isHighlighted ? 1 : 0.2,
              }}
              onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
              whileHover={{ scale: 1.2 }}
            >
              <div
                className="rounded-full border-2 flex items-center justify-center transition-all duration-300"
                style={{
                  width: size * 2,
                  height: size * 2,
                  background: `${nodeColors[node.type]}20`,
                  borderColor: `${nodeColors[node.type]}60`,
                }}
              >
                <span className="text-[9px] font-bold" style={{ color: nodeColors[node.type] }}>
                  {node.label[0]}
                </span>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                <span className="text-[10px] bg-[#0d1b2a] px-2 py-0.5 rounded border border-white/10 text-foreground">
                  {node.label}
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
          className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{selectedNode.label}</span>
                <Badge variant={selectedNode.type === "criminal" ? "danger" : selectedNode.type === "associate" ? "warning" : "success"} size="sm">
                  {selectedNode.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Node weight: {selectedNode.weight} · {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} connections</p>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>
        </motion.div>
      )}
    </Card>
  )
}
