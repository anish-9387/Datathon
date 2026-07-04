"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, GitBranch, Network, Brain, ChevronLeft, ChevronRight,
  Map, Shield, BarChart3, TrendingUp, AlertTriangle, Search, MessageSquare,
  FileText, Users, User, LogOut, Command, type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
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
      { label: "Crime DNA", href: "/intelligence/crime-dna", icon: GitBranch, badge: "New" },
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
      { label: "Anomalies", href: "/ai/anomaly-detection", icon: AlertTriangle, badge: "3" },
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
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.04]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center shadow-sm shadow-primary/20 group-hover:shadow-md group-hover:shadow-primary/30 transition-shadow">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span className="text-sm font-bold text-foreground tracking-tight">Karnataka Police</span>
              <span className="block text-[10px] text-muted-foreground font-medium leading-tight">Intelligence Platform</span>
            </motion.div>
          )}
        </Link>
        <button
          onClick={isMobile ? () => setMobileOpen(false) : onToggle}
          className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em]">
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group/item relative",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/12"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className={cn(
                      "relative z-10 flex items-center gap-3 w-full",
                      collapsed && "justify-center"
                    )}>
                      <item.icon className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground/60 group-hover/item:text-foreground/80"
                      )} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none",
                              active
                                ? "bg-primary/15 text-primary"
                                : "bg-white/[0.04] text-muted-foreground"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("px-3 py-4 border-t border-white/[0.04]", collapsed && "px-2")}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03]",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
            SP
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Superintendent</p>
              <p className="text-[11px] text-muted-foreground/60 truncate">Admin Access</p>
            </div>
          )}
          <button className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-accent-rose transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        {!collapsed && (
          <div className="mt-2 px-3 py-1.5 flex items-center gap-2 text-[11px] text-muted-foreground/40">
            <Command className="w-3 h-3" />
            <span>Cmd+K</span>
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
          className="fixed top-4 left-4 z-40 p-2.5 rounded-xl glass-card shadow-lg lg:hidden"
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
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-[280px] h-full bg-background border-r border-white/[0.05] overflow-hidden"
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
        "hidden lg:flex flex-col h-screen bg-background border-r border-white/[0.04] transition-all duration-300 overflow-hidden",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {sidebarContent}
    </aside>
  )
}
