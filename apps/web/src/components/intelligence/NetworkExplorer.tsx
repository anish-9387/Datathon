"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/useDebounce"
import { NODE_COLORS, NODE_TYPE_LABELS, NODE_BADGE_VARIANTS, type GraphNode } from "./ForceGraph"

interface NetworkExplorerProps {
  nodes: GraphNode[]
  onSelectNode: (node: GraphNode | null) => void
  selectedNodeId?: string | null
}

export function NetworkExplorer({ nodes, onSelectNode, selectedNodeId }: NetworkExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const debouncedSearch = useDebounce(searchQuery, 200)

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch = n.label.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesType = typeFilter === "all" || n.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [nodes, debouncedSearch, typeFilter])

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted outline-none focus:border-primary/30 transition-colors"
          />
        </div>
      </div>
      <div className="space-y-1 max-h-100 overflow-y-auto">
        {filteredNodes.map((node) => (
          <button
            key={node.id}
            onClick={() => onSelectNode(selectedNodeId === node.id ? null : node)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedNodeId === node.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: NODE_COLORS[node.type] || "#64748b" }}
            />
            <span className="flex-1 text-left truncate">{node.label}</span>
            <Badge variant={NODE_BADGE_VARIANTS[node.type] || "default"} size="sm">
              {NODE_TYPE_LABELS[node.type] || node.type}
            </Badge>
          </button>
        ))}
        {filteredNodes.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No nodes found</p>
        )}
      </div>
    </Card>
  )
}
