"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DNAMatch {
  firNumber: string
  similarity: number
  type: string
  date: string
  location: string
  mo: string
}

interface CrimeDNAVisualizerProps {
  matches: DNAMatch[]
  firNumber: string
}

function DNAStrand({ similarity, index }: { similarity: number; index: number }) {
  const pairs = Array.from({ length: 12 }, (_, i) => ({
    left: Math.random() > 0.5,
    right: Math.random() > 0.5,
    intensity: Math.max(0.2, similarity / 100 - i * 0.05),
  }))

  return (
    <div className="flex items-center gap-1">
      <div className="flex flex-col gap-0.5">
        {pairs.map((p, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.05 + index * 0.1 }}
            className="flex items-center gap-0.5"
          >
            <div
              className="w-1.5 h-3 rounded-sm"
              style={{ background: p.left ? `rgba(59,130,246,${p.intensity})` : `rgba(6,182,212,${p.intensity})` }}
            />
            <div className="w-1 h-0.5 bg-white/10" />
            <div
              className="w-1.5 h-3 rounded-sm"
              style={{ background: p.right ? `rgba(16,185,129,${p.intensity})` : `rgba(245,158,11,${p.intensity})` }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function CrimeDNAVisualizer({ matches, firNumber }: CrimeDNAVisualizerProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">DNA Fingerprint: {firNumber}</h3>
          <p className="text-xs text-muted-foreground">Modus operandi similarity analysis</p>
        </div>
      </div>
      <div className="space-y-3">
        {matches.map((match, idx) => (
          <motion.div
            key={match.firNumber}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
          >
            <DNAStrand similarity={match.similarity} index={idx} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{match.firNumber}</span>
                <Badge variant={match.similarity > 85 ? "danger" : match.similarity > 75 ? "warning" : "info"} size="sm">
                  {match.similarity}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{match.type} · {match.location} · {match.date}</p>
              <p className="text-xs text-muted mt-1 truncate">{match.mo}</p>
            </div>
            <div className="flex-shrink-0 w-16 h-16 relative">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                <motion.circle
                  cx="18" cy="18" r="16" fill="none"
                  stroke={match.similarity > 85 ? "#f43f5e" : match.similarity > 75 ? "#f59e0b" : "#06b6d4"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - match.similarity / 100)}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - match.similarity / 100) }}
                  transition={{ duration: 1, delay: idx * 0.2 }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                {match.similarity}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
