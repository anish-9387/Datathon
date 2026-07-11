"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, Sparkles, RefreshCw, AlertTriangle, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { postApi } from "@/hooks/useApi"

interface AssistantResponse {
  sql?: string
  explanation?: string
  rows?: Record<string, unknown>[]
  rowCount?: number
  note?: string
  error?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content?: string
  response?: AssistantResponse
  error?: string
  timestamp: Date
}

const suggestions = [
  "show robbery cases in Bengaluru",
  "theft cases after 9 pm",
  "recent murder cases",
  "top 10 cases with knife",
]

const PREFERRED_COLUMNS = ["fir_no", "crime_type", "district", "police_station", "date_time", "status", "weapon"]
const HIDDEN_COLUMNS = ["id", "fir_text", "latitude", "longitude", "crime_group"]

function pickColumns(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return []
  const keys = Object.keys(rows[0])
  const preferred = PREFERRED_COLUMNS.filter((k) => keys.includes(k))
  const rest = keys.filter((k) => !preferred.includes(k) && !HIDDEN_COLUMNS.includes(k))
  return [...preferred, ...rest].slice(0, 6)
}

function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "\u2014"
  if (key === "date_time") {
    const d = new Date(String(value))
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    }
  }
  const s = String(value)
  return s.length > 60 ? `${s.slice(0, 57)}...` : s
}

function columnLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = pickColumns(rows)
  const visible = rows.slice(0, 10)
  if (columns.length === 0) return null

  return (
    <div className="mt-3 rounded-lg border border-white/[0.06] overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground/70 whitespace-nowrap">
                {columnLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, idx) => (
            <tr key={idx} className="border-b border-white/[0.03] last:border-0">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-foreground/80 whitespace-nowrap max-w-[220px] truncate">
                  {formatCell(col, row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AssistantReply({ response }: { response: AssistantResponse }) {
  const rows = response.rows ?? []
  return (
    <div className="space-y-3">
      {response.explanation && (
        <p className="text-sm text-foreground/90 leading-relaxed">{response.explanation}</p>
      )}
      {response.sql && (
        <div className="rounded-lg bg-black/30 border border-white/[0.06] overflow-x-auto">
          <div className="flex items-center gap-1.5 px-3 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground/50">
            <Database className="w-3 h-3" /> Generated SQL
          </div>
          <pre className="px-3 py-2 text-xs text-accent-cyan/90 font-mono whitespace-pre-wrap">{response.sql}</pre>
        </div>
      )}
      {rows.length > 0 ? (
        <>
          <ResultTable rows={rows} />
          <p className="text-[11px] text-muted-foreground/50">
            {response.rowCount ?? rows.length} row{(response.rowCount ?? rows.length) === 1 ? "" : "s"} returned
            {rows.length > 10 ? " \u00B7 showing first 10" : ""}
          </p>
        </>
      ) : (
        !response.error && <p className="text-xs text-muted-foreground/50">No matching records found.</p>
      )}
      {response.note && (
        <p className="text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/12 rounded-lg px-3 py-2">
          {response.note}
        </p>
      )}
      {response.error && (
        <p className="text-[11px] text-accent-rose bg-accent-rose/5 border border-accent-rose/15 rounded-lg px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {response.error}
        </p>
      )}
    </div>
  )
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello, I'm your AI Investigation Assistant. Ask me a question in plain English and I'll translate it to SQL, run it against the FIR database, and show you the results. Try one of the suggested queries below.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

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

    try {
      const response = await postApi<AssistantResponse>("/api/ai/assistant", {
        query: content.trim(),
      })
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-a`, role: "assistant", response, timestamp: new Date() },
      ])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: "assistant",
          error: e instanceof Error ? e.message : "Something went wrong while querying the database.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] rounded-2xl bg-card border border-card-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Investigation Assistant</p>
            <p className="text-[11px] text-muted-foreground">Natural language to SQL over live FIR data</p>
          </div>
        </div>
        <Badge variant="success" size="sm" dot>Online</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-primary/10" : "bg-primary/10"
              }`}>
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <div className={`max-w-[85%] min-w-0 ${
                msg.role === "user"
                  ? "bg-primary/8 border border-primary/15"
                  : msg.error
                    ? "bg-accent-rose/5 border border-accent-rose/15"
                    : "bg-card border border-card-border"
              } rounded-xl px-4 py-3`}>
                {msg.response ? (
                  <AssistantReply response={msg.response} />
                ) : msg.error ? (
                  <div className="flex items-start gap-2 text-sm text-accent-rose">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{msg.error}</span>
                  </div>
                ) : (
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">
                  {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-card border border-card-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Translating to SQL and querying the database...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 rounded-lg bg-card border border-card-border text-xs text-muted-foreground hover:text-foreground hover:bg-card-hover transition-all"
              >
                <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-card-border">
        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(input)}
            placeholder="Ask anything about crime data..."
            className="flex-1 px-4 py-2.5 bg-card border border-card-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-card transition-all"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
