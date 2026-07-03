"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Command, LayoutDashboard, GitBranch, Network, Brain, FileText, User, LogOut, Map, TrendingUp, AlertTriangle, Search as SearchIcon, MessageSquare, BarChart3, Shield, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  href: string
  category: string
}

const commands: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", description: "Main intelligence dashboard", icon: <LayoutDashboard className="w-4 h-4" />, href: "/dashboard", category: "Navigation" },
  { id: "dashboard-d", label: "District Analytics", description: "District-level crime analytics", icon: <Map className="w-4 h-4" />, href: "/dashboard/district", category: "Navigation" },
  { id: "dashboard-ps", label: "Police Station", description: "Police station drill-down", icon: <Shield className="w-4 h-4" />, href: "/dashboard/police-station", category: "Navigation" },
  { id: "dna", label: "Crime DNA", description: "Visual DNA fingerprint viewer", icon: <GitBranch className="w-4 h-4" />, href: "/intelligence/crime-dna", category: "Intelligence" },
  { id: "mo", label: "MO Clustering", description: "Modus operandi cluster analysis", icon: <BarChart3 className="w-4 h-4" />, href: "/intelligence/mo-clustering", category: "Intelligence" },
  { id: "evolution", label: "Crime Evolution", description: "Crime progression timeline", icon: <TrendingUp className="w-4 h-4" />, href: "/intelligence/crime-evolution", category: "Intelligence" },
  { id: "repeat-mo", label: "Repeat MO Detection", description: "Detect repeat patterns", icon: <AlertTriangle className="w-4 h-4" />, href: "/intelligence/repeat-mo", category: "Intelligence" },
  { id: "graph", label: "Graph Network", description: "Criminal relationship graph", icon: <Network className="w-4 h-4" />, href: "/intelligence/graph", category: "Network" },
  { id: "gangs", label: "Gang Detection", description: "Gang network visualization", icon: <Users className="w-4 h-4" />, href: "/intelligence/gangs", category: "Network" },
  { id: "criminals", label: "Criminal Scoring", description: "Top criminals and scores", icon: <User className="w-4 h-4" />, href: "/intelligence/criminals", category: "Network" },
  { id: "forecast", label: "Forecasting", description: "AI crime forecasting", icon: <TrendingUp className="w-4 h-4" />, href: "/ai/forecasting", category: "AI" },
  { id: "hotspot", label: "Hotspot Detection", description: "Crime hotspot prediction", icon: <Map className="w-4 h-4" />, href: "/ai/hotspot-detection", category: "AI" },
  { id: "anomaly", label: "Anomaly Detection", description: "Unusual crime detection", icon: <AlertTriangle className="w-4 h-4" />, href: "/ai/anomaly-detection", category: "AI" },
  { id: "similarity", label: "Similarity Search", description: "Find similar crimes", icon: <SearchIcon className="w-4 h-4" />, href: "/ai/similarity-search", category: "AI" },
  { id: "assistant", label: "AI Assistant", description: "Investigation AI assistant", icon: <MessageSquare className="w-4 h-4" />, href: "/ai/assistant", category: "AI" },
  { id: "summarizer", label: "FIR Summarizer", description: "Summarize FIR documents", icon: <FileText className="w-4 h-4" />, href: "/ai/fir-summarizer", category: "AI" },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  const handleSelect = useCallback(
    (item: CommandItem) => {
      router.push(item.href)
      onClose()
    },
    [router, onClose]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex])
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (open) onClose()
        else onClose()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl animate-scale-in">
        <div className="glass-card overflow-hidden shadow-2xl shadow-primary/5">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <Search className="w-5 h-5 text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, tools, and data..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted bg-white/5 rounded-md border border-white/5">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            )}
            {(() => {
              let lastCategory = ""
              return filtered.map((item, index) => {
                const showCategory = item.category !== lastCategory
                lastCategory = item.category
                return (
                  <div key={item.id}>
                    {showCategory && (
                      <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                        {item.category}
                      </div>
                    )}
                    <button
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                        index === selectedIndex
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-white/5"
                      )}
                    >
                      <span className={cn("flex-shrink-0", index === selectedIndex ? "text-primary" : "text-muted")}>
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                        )}
                      </div>
                    </button>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
