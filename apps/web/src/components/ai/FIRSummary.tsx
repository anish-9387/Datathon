"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, MapPin, Shield, Swords, User, Users, Link } from "lucide-react"

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

const detailConfig = [
  { label: "Crime No", icon: FileText },
  { label: "Date", icon: Calendar },
  { label: "Crime Type", icon: Shield },
  { label: "District", icon: MapPin },
  { label: "Police Station", icon: MapPin },
  { label: "Status", icon: Shield },
  { label: "Weapon", icon: Swords },
  { label: "Accused", icon: User },
  { label: "Victims", icon: Users },
]

export function FIRSummary({ data }: FIRSummaryProps) {
  const detailRows = data.details
    ? [
        { label: "Crime No", value: data.details.crimeNo ?? "—", icon: FileText },
        { label: "Date", value: formatDate(data.details.date), icon: Calendar },
        { label: "Crime Type", value: data.details.crimeType ?? "—", icon: Shield },
        { label: "District", value: data.details.district ?? "—", icon: MapPin },
        { label: "Police Station", value: data.details.policeStation ?? "—", icon: MapPin },
        { label: "Status", value: data.details.status ?? "—", icon: Shield },
        { label: "Weapon", value: data.details.weapon ?? "None recorded", icon: Swords },
        { label: "Accused", value: data.details.accused?.length ? data.details.accused.join(", ") : "—", icon: User },
        { label: "Victims", value: data.details.victims?.length ? data.details.victims.join(", ") : "—", icon: Users },
      ]
    : []

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">AI Summary</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          {data.keywords.length > 0 && (
            <div className="mt-5 pt-4 border-t border-card-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Keywords</p>
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Key Phrases</p>
              <div className="flex flex-wrap gap-2">
                {data.keyPhrases.map((phrase, idx) => (
                  <motion.span
                    key={phrase}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium"
                  >
                    {phrase}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data.details && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 h-full">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-accent-amber/10 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-accent-amber" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Case Details</h3>
              </div>
              <div className="space-y-1">
                {detailRows.map((row, idx) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-md bg-primary/5 flex items-center justify-center flex-shrink-0">
                      <row.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{row.label}</span>
                    <span className="text-sm text-foreground min-w-0 break-words font-medium">{row.value}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-accent-emerald/10 flex items-center justify-center">
                <Link className="w-3.5 h-3.5 text-accent-emerald" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Related Cases</h3>
              {data.related.length > 0 && (
                <Badge variant="info" size="sm" className="ml-auto">{data.related.length} found</Badge>
              )}
            </div>
            {data.related.length > 0 ? (
              <div className="space-y-2">
                {data.related.map((rel, idx) => (
                  <motion.div
                    key={`${rel.firNumber}-${idx}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-card-border hover:bg-card-hover transition-colors"
                  >
                    <div className="w-12 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: rel.similarity > 85
                          ? "linear-gradient(135deg, rgba(192,57,43,0.15), rgba(192,57,43,0.05))"
                          : rel.similarity > 70
                            ? "linear-gradient(135deg, rgba(232,163,58,0.15), rgba(232,163,58,0.05))"
                            : "linear-gradient(135deg, rgba(198,93,46,0.15), rgba(198,93,46,0.05))"
                      }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: rel.similarity > 85 ? "#C0392B" : rel.similarity > 70 ? "#E8A33A" : "#C65D2E"
                        }}
                      >
                        {rel.similarity}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground font-mono truncate block">{rel.firNumber}</span>
                      {rel.type && <span className="text-xs text-muted-foreground">{rel.type}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Link className="w-8 h-8 text-muted/40 mb-2" />
                <p className="text-sm text-muted-foreground">No related cases found in the corpus.</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export type { FIRSummaryData }
