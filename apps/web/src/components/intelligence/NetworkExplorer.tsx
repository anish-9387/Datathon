"use client"

import { useState, useMemo } from "react"
import { Search, Filter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/useDebounce"

interface GraphNode {
  id: string
  label: string
  type: string
  weight: number
}

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
        <Select
          options={[
            { value: "all", label: "All Types" },
            { value: "criminal", label: "Criminals" },
            { value: "associate", label: "Associates" },
            { value: "victim", label: "Victims" },
            { value: "officer", label: "Officers" },
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-32"
        />
      </div>
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {filteredNodes.map((node) => (
          <button
            key={node.id}
            onClick={() => onSelectNode(selectedNodeId === node.id ? null : node)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedNodeId === node.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: node.type === "criminal" ? "#f43f5e" : node.type === "associate" ? "#f59e0b" : node.type === "victim" ? "#10b981" : "#3b82f6",
              }}
            />
            <span className="flex-1 text-left truncate">{node.label}</span>
            <Badge variant={node.type === "criminal" ? "danger" : node.type === "associate" ? "warning" : node.type === "victim" ? "success" : "info"} size="sm">
              {node.type}
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
