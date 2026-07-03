"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileText, Upload } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FIRSummary } from "@/components/ai/FIRSummary"
import { EmptyState } from "@/components/ui/empty-state"

const mockFIRData = {
  summary: "This is a case of burglary reported on April 12, 2025 at 123, 4th Main Road, Koramangala. The complainant, Mr. Rajesh Kumar, reported that unknown persons gained entry through the rear window of his residence between 2:00 PM and 6:00 PM and stole electronic items including a laptop, tablet, and cash totaling approximately ₹2,50,000. The rear window grill was found cut using what appears to be a metal cutter. No fingerprints were recovered from the scene. CCTV footage from neighboring properties is being analyzed.",
  entities: [
    { label: "Rajesh Kumar", value: "Complainant", type: "person" },
    { label: "123, 4th Main, Koramangala", value: "Crime Scene", type: "location" },
    { label: "Laptop, Tablet, Cash", value: "Stolen Items (₹2.5L)", type: "evidence" },
    { label: "Rear Window", value: "Entry Point", type: "evidence" },
    { label: "Metal Cutter", value: "Tool Used", type: "evidence" },
    { label: "CCTV Footage", value: "Under Analysis", type: "evidence" },
  ],
  timeline: [
    { date: "12 Apr 2025, 2:00 PM", event: "Complainant leaves residence for work" },
    { date: "12 Apr 2025, 3:30 PM", event: "Neighbor reports suspicious activity" },
    { date: "12 Apr 2025, 5:45 PM", event: "Complainant returns home, discovers burglary" },
    { date: "12 Apr 2025, 6:10 PM", event: "FIR registered at Koramangala police station" },
    { date: "12 Apr 2025, 7:00 PM", event: "Forensic team dispatched to scene" },
    { date: "13 Apr 2025, 10:00 AM", event: "CCTV footage collection initiated" },
  ],
  risk: {
    level: "high",
    score: 78,
    factors: [
      "Similar MO detected in 4 other cases",
      "Targeted residential area during work hours",
      "Professional execution (grill cutting)",
      "High-value electronics targeted",
    ],
  },
}

export default function FIRSummarizerPage() {
  const [firText, setFirText] = useState("")
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<typeof mockFIRData | null>(null)

  const handleSummarize = () => {
    if (!firText.trim()) return
    setSummarizing(true)
    setTimeout(() => {
      setSummary(mockFIRData)
      setSummarizing(false)
    }, 1500)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">FIR Summarizer</h1>
          <p className="text-sm text-muted-foreground">AI-powered FIR document analysis and entity extraction</p>
        </motion.div>

        <Card className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">FIR Text</label>
              <textarea
                value={firText}
                onChange={(e) => setFirText(e.target.value)}
                placeholder="Paste FIR text here for AI analysis..."
                className="w-full h-40 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted outline-none focus:border-primary/30 transition-colors resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSummarize} loading={summarizing} size="lg">
                <FileText className="w-4 h-4" />
                {summarizing ? "Analyzing..." : "Summarize FIR"}
              </Button>
              <Button variant="outline" onClick={() => setFirText(mockFIRData.summary)}>
                <Upload className="w-4 h-4" />
                Load Sample
              </Button>
            </div>
          </div>
        </Card>

        {!summary ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-primary" />}
            title="Enter FIR text to analyze"
            description="The AI will extract key entities, timeline, and risk assessment from the FIR document."
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FIRSummary data={summary} />
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
