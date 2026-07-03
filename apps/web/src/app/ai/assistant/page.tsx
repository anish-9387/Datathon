"use client"

import { motion } from "framer-motion"
import { MessageSquare, Sparkles } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChatInterface } from "@/components/ai/ChatInterface"
import { EmptyState } from "@/components/ui/empty-state"

export default function AssistantPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">AI Investigation Assistant</h1>
          <p className="text-sm text-muted-foreground">Natural language interface for crime data analysis and insights</p>
        </motion.div>

        <ChatInterface />
      </div>
    </AppShell>
  )
}
