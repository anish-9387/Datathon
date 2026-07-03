"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestions = [
  "Show me crime trends in Koramangala this month",
  "Analyze FIR #2025-0892 for similar patterns",
  "What are the top 5 hotspots in Bengaluru today?",
  "Compare burglary rates between Indiranagar and Whitefield",
  "Predict crime risk for upcoming festival season",
]

const mockResponses: Record<string, string> = {
  "show": "Based on the data analysis:\n\n**Koramangala Crime Trends (This Month)**\n- Total incidents: 47\n- Solved cases: 34 (72.3% solve rate)\n- Most common crime: Theft (18 cases)\n- Trending up: Cybercrime (+15% vs last month)\n- Peak hours: 6 PM - 10 PM\n\n![chart] A time series chart shows daily incidents with a slight upward trend in the last week.",
  "analyze": "**DNA Analysis Results for FIR #2025-0892**\n\n**Top Match:** FIR2025-0765 - 87.6% similarity\n- Same MO: Forced entry through rear window\n- Same target: Electronics\n- Different location: Indiranagar\n\n**Pattern Detection:**\n- This matches a known burglary ring operating in South Bengaluru\n- 4 other cases with >70% similarity found\n- Recommend cross-referencing with suspects from previous arrests",
  "hotspot": "**Today's Top 5 Hotspots:**\n\n1. **Koramangala** - Risk: 92 (Critical)\n   - 12 incidents in past 48 hours\n   - Predominant: Theft & Burglary\n\n2. **MG Road** - Risk: 87 (High)\n   - Increase in cybercrime reports\n\n3. **Indiranagar** - Risk: 78 (High)\n   - Vehicle theft hotspot\n\n4. **Whitefield** - Risk: 74 (Elevated)\n   - Nighttime burglary cluster\n\n5. **Jayanagar** - Risk: 65 (Moderate)\n   - Stable, routine patrols recommended",
  "compare": "**Burglary Rate Comparison: Indiranagar vs Whitefield**\n\n| Metric | Indiranagar | Whitefield |\n|--------|------------|-----------|\n| Total cases | 143 | 115 |\n| Solved | 112 (78.3%) | 78 (67.8%) |\n| Avg. per month | 11.9 | 9.6 |\n| Peak month | March (18) | January (14) |\n\n**Insight:** Whitefield shows a lower solve rate despite fewer cases, suggesting resource allocation may need review.",
  "predict": "**Festival Season Crime Forecast**\n\n**High Risk Period:** Oct 15 - Nov 15\n**Predicted Increase:** +23% vs monthly average\n\n**Top Predicted Crimes:**\n1. Theft - 78% probability\n2. Burglary - 65% probability\n3. Cybercrime - 52% probability\n\n**Recommended Actions:**\n- Increase patrol density in commercial areas\n- Deploy cybercrime awareness campaigns\n- Set up checkpoints at major junctions",
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello, I'm your AI Investigation Assistant. I can help you analyze crime data, find patterns, and generate insights. Try one of the suggested queries below or ask your own question.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800))

    const lower = content.toLowerCase()
    let response = "I've analyzed your query. Based on the available crime data, here's what I found:\n\nThis is a complex query that requires deeper analysis. I recommend narrowing down by location, time period, or crime type for more specific insights."

    for (const [key, value] of Object.entries(mockResponses)) {
      if (lower.includes(key)) {
        response = value
        break
      }
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Investigation Assistant</p>
            <p className="text-[11px] text-muted-foreground">Powered by Crime Intelligence ML</p>
          </div>
        </div>
        <Badge variant="success" size="sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
          Online
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-primary/10" : "bg-gradient-to-br from-primary to-accent-cyan"
              }`}>
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-primary" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`max-w-[80%] ${msg.role === "user" ? "bg-primary/10 border border-primary/20" : "bg-white/[0.02] border border-white/5"} rounded-xl px-4 py-3`}>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing crime data...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-primary/20 transition-all"
              >
                <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(input)}
            placeholder="Ask anything about crime data..."
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted outline-none focus:border-primary/30 transition-colors"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}
