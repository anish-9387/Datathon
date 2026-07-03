"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SimilarityMatch {
  id: string
  firNumber: string
  similarity: number
  date: string
  type: string
  location: string
  act: string
  section: string
  description: string
}

interface SimilarityResultProps {
  results: SimilarityMatch[]
}

export function SimilarityResult({ results }: SimilarityResultProps) {
  if (results.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Found {results.length} similar cases</p>
        <Badge variant="info" size="sm">Sorted by similarity</Badge>
      </div>
      {results.map((result, idx) => (
        <motion.div
          key={result.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
        >
          <Card className="p-4 hover:border-primary/30 transition-colors cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 text-center">
                <div className="text-lg font-bold" style={{
                  color: result.similarity > 85 ? "#f43f5e" : result.similarity > 70 ? "#f59e0b" : "#06b6d4"
                }}>
                  {result.similarity}%
                </div>
                <div className="text-[10px] text-muted-foreground">match</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{result.firNumber}</span>
                  <Badge variant="default" size="sm">{result.type}</Badge>
                  <span className="text-xs text-muted-foreground">{result.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{result.act} · Section {result.section} · {result.location}</p>
                <p className="text-xs text-muted line-clamp-2">{result.description}</p>
              </div>
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export type { SimilarityMatch }
