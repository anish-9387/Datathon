"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TabsContextType {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string
  children: ReactNode
  className?: string
}) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 p-1 rounded-xl bg-card border border-card-border", className)}>
      {children}
    </div>
  )
}

function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string
  children: ReactNode
  className?: string
}) {
  const ctx = useContext(TabsContext)
  if (!ctx) return null
  const isActive = ctx.activeTab === value
  return (
    <button
      onClick={() => ctx.setActiveTab(value)}
      className={cn(
        "relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150",
        isActive
          ? "text-white"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="tabs-active"
          className="absolute inset-0 rounded-lg bg-primary shadow-sm"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

function TabsContent({
  value,
  children,
  className,
}: {
  value: string
  children: ReactNode
  className?: string
}) {
  const ctx = useContext(TabsContext)
  if (!ctx) return null
  if (ctx.activeTab !== value) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
