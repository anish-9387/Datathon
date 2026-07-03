"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, GitBranch, Network, Brain, ChevronLeft, ChevronRight,
  Map, Shield, BarChart3, TrendingUp, AlertTriangle, Search, MessageSquare,
  FileText, Users, User, LogOut, Command, LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Districts", href: "/dashboard/district", icon: Map },
      { label: "Police Stations", href: "/dashboard/police-station", icon: Shield },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Crime DNA", href: "/intelligence/crime-dna", icon: GitBranch },
      { label: "MO Clustering", href: "/intelligence/mo-clustering", icon: BarChart3 },
      { label: "Crime Evolution", href: "/intelligence/crime-evolution", icon: TrendingUp },
      { label: "Repeat MO", href: "/intelligence/repeat-mo", icon: AlertTriangle },
    ],
  },
  {
    label: "Network",
    items: [
      { label: "Graph View", href: "/intelligence/graph", icon: Network },
      { label: "Gangs", href: "/intelligence/gangs", icon: Users },
      { label: "Criminals", href: "/intelligence/criminals", icon: User },
    ],
  },
  {
    label: "AI Intelligence",
    items: [
      { label: "Forecasting", href: "/ai/forecasting", icon: TrendingUp },
      { label: "Hotspots", href: "/ai/hotspot-detection", icon: Map },
      { label: "Anomalies", href: "/ai/anomaly-detection", icon: AlertTriangle },
      { label: "Similarity Search", href: "/ai/similarity-search", icon: Search },
      { label: "AI Assistant", href: "/ai/assistant", icon: MessageSquare },
      { label: "FIR Summarizer", href: "/ai/fir-summarizer", icon: FileText },
    ],
  },
]

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="text-sm font-bold text-foreground tracking-tight">Karnataka Police</span>
              <span className="block text-[10px] text-muted-foreground font-medium">Intelligence Platform</span>
            </motion.div>
          )}
        </Link>
        <button
          onClick={isMobile ? () => setMobileOpen(false) : onToggle}
          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold text-muted uppercase tracking-widest">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => isMobile && setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-primary/5 border border-primary/10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <item.icon className={cn("w-4.5 h-4.5 flex-shrink-0 relative z-10", active && "text-primary")} />
                    {!collapsed && (
                      <span className="relative z-10 truncate">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("px-3 py-4 border-t border-white/5", collapsed && "px-2")}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            SP
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Superintendent</p>
              <p className="text-[11px] text-muted-foreground truncate">Admin Access</p>
            </div>
          )}
          <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-accent-rose transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        {!collapsed && (
          <div className="mt-2 px-3 py-1.5 flex items-center gap-2 text-[11px] text-muted">
            <Command className="w-3 h-3" />
            <span>Cmd+K to search</span>
          </div>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-xl glass-card lg:hidden"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-[280px] h-full glass-card rounded-none overflow-hidden"
              >
                {sidebarContent}
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen glass-card rounded-none border-r border-white/5 transition-all duration-300 overflow-hidden",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {sidebarContent}
    </aside>
  )
}
