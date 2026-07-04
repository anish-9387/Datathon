"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FIRDetails {
  crimeNo?: string | null
  date?: string | null
  crimeType?: string | null
  crimeGroup?: string | null
  district?: string | null
  policeStation?: string | null
  status?: string | null
  briefFacts?: string | null
  accused?: string[] | null
  victims?: string[] | null
  weapon?: string | null
}

interface RelatedCase {
  firNumber: string
  similarity: number
  type: string | null
}

interface FIRSummaryData {
  summary: string
  keywords: string[]
  keyPhrases: string[]
  details: FIRDetails | null
  related: RelatedCase[]
}

interface FIRSummaryProps {
  data: FIRSummaryData
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "—"
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function FIRSummary({ data }: FIRSummaryProps) {
  const detailRows: Array<{ label: string; value: string }> = data.details
    ? [
        { label: "Crime No", value: data.details.crimeNo ?? "—" },
        { label: "Date", value: formatDate(data.details.date) },
        { label: "Crime Type", value: data.details.crimeType ?? "—" },
        { label: "District", value: data.details.district ?? "—" },
        { label: "Police Station", value: data.details.policeStation ?? "—" },
        { label: "Status", value: data.details.status ?? "—" },
        { label: "Weapon", value: data.details.weapon ?? "None recorded" },
        { label: "Accused", value: data.details.accused?.length ? data.details.accused.join(", ") : "—" },
        { label: "Victims", value: data.details.victims?.length ? data.details.victims.join(", ") : "—" },
      ]
    : []

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Summary</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
        {data.keywords.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((kw, idx) => (
                <motion.span
                  key={kw}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Badge variant="info" size="sm">{kw}</Badge>
                </motion.span>
              ))}
            </div>
          </div>
        )}
        {data.keyPhrases.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Key Phrases</p>
            <div className="flex flex-wrap gap-2">
              {data.keyPhrases.map((phrase, idx) => (
                <motion.span
                  key={phrase}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary"
                >
                  {phrase}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Case Details</h3>
          {data.details ? (
            <div className="space-y-2">
              {detailRows.map((row, idx) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.02]"
                >
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0 pt-0.5">{row.label}</span>
                  <span className="text-sm text-foreground min-w-0 break-words">{row.value}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No structured case record available — this summary was generated from pasted text.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Related Cases</h3>
          {data.related.length > 0 ? (
            <div className="space-y-2">
              {data.related.map((rel, idx) => (
                <motion.div
                  key={`${rel.firNumber}-${idx}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]"
                >
                  <div className="w-12 text-center flex-shrink-0">
                    <span
                      className="text-sm font-bold"
                      style={{ color: rel.similarity > 85 ? "#f43f5e" : rel.similarity > 70 ? "#f59e0b" : "#06b6d4" }}
                    >
                      {rel.similarity}%
                    </span>
                  </div>
                  <span className="text-sm text-foreground font-mono truncate">{rel.firNumber}</span>
                  {rel.type && <Badge variant="default" size="sm" className="ml-auto">{rel.type}</Badge>}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No related cases found in the corpus.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

export type { FIRSummaryData }
