"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  Bell, ChevronDown, Settings, Shield, Command, LogOut
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/district": "Districts",
  "/dashboard/police-station": "Police Stations",
  "/intelligence/crime-dna": "Crime DNA",
  "/intelligence/mo-clustering": "MO Clustering",
  "/intelligence/crime-evolution": "Crime Evolution",
  "/intelligence/repeat-mo": "Repeat MO",
  "/intelligence/graph": "Graph View",
  "/intelligence/gangs": "Gangs",
  "/intelligence/criminals": "Criminals",
  "/ai/forecasting": "Forecasting",
  "/ai/hotspot-detection": "Hotspots",
  "/ai/anomaly-detection": "Anomalies",
  "/ai/similarity-search": "Similarity Search",
  "/ai/assistant": "AI Assistant",
  "/ai/fir-summarizer": "FIR Summarizer",
}

export function Header({ onCmdK }: { onCmdK: () => void }) {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = segments.map((_, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/")
    return { name: breadcrumbMap[path] || segments[i], path }
  })

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="flex items-center justify-between h-14 px-5">
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.path} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <span className="text-muted-foreground/20 text-xs">/</span>
                )}
                <span className={cn(
                  idx === breadcrumbs.length - 1
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/60"
                )}>
                  {crumb.name}
                </span>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCmdK}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-muted-foreground/60 text-xs hover:text-foreground hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-200"
          >
            <Command className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-muted-foreground/40 border border-white/[0.04]">Ctrl+K</kbd>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent-rose animate-pulse" />
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-background border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      <span className="text-[11px] text-muted-foreground/50">Mark all read</span>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {[
                      { title: "Anomaly Detected", desc: "Unusual crime pattern in Koramangala", time: "2m ago", color: "bg-accent-rose" },
                      { title: "MO Match Found", desc: "85% similarity with previous burglary case", time: "15m ago", color: "bg-accent-cyan" },
                      { title: "Forecast Updated", desc: "High probability of theft in your area tomorrow", time: "1h ago", color: "bg-accent-amber" },
                      { title: "New Case Assigned", desc: "FIR #2025-1042 assigned to your team", time: "3h ago", color: "bg-primary" },
                    ].map((notif, i) => (
                      <div key={i} className="p-4 border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", notif.color)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{notif.title}</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">{notif.desc}</p>
                            <p className="text-[11px] text-muted-foreground/40 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                SP
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">Superintendent</p>
                <p className="text-[11px] text-muted-foreground/50">Admin</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 hidden md:block" />
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-background border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden"
                >
                  {[
                    { label: "Profile", icon: Shield },
                    { label: "Settings", icon: Settings },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-white/[0.03] transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground/50" />
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-white/[0.04]">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-rose hover:bg-accent-rose/5 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
