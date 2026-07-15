"use client"

import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/AppShell"
import { ChatInterface } from "@/components/ai/ChatInterface"

export default function AssistantPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-foreground tracking-tight">AI Investigation Assistant</h1>
          <p className="text-sm text-muted-foreground/60 mt-1">Natural language interface for crime data analysis and insights</p>
        </motion.div>

        <ChatInterface />
      </div>
    </AppShell>
  )
}
