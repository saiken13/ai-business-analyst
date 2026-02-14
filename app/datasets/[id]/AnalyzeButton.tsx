/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type DatasetStatus = "PENDING" | "ANALYZING" | "READY" | "FAILED"

export default function AnalyzeButton({
  datasetId,
  status,
}: {
  datasetId: string
  status: DatasetStatus
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  async function handleClick() {
    // Prevent duplicate clicks
    if (isAnalyzing || isPending) return

    setError(null)
    setIsAnalyzing(true)

    try {
      const res = await fetch(`/api/datasets/${datasetId}/analyze`, { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Failed to analyze dataset")
      startTransition(() => router.refresh())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Allow analysis when PENDING, FAILED, or READY (for re-analysis)
  const canAnalyze = status === "PENDING" || status === "FAILED" || status === "READY"
  const disabled = !canAnalyze || isAnalyzing || isPending

  const getButtonText = () => {
    if (isAnalyzing || isPending) return "Analyzing..."
    if (status === "ANALYZING") return "Analysis in progress..."
    if (status === "READY") return "Re-analyze dataset"
    return "Analyze dataset"
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={disabled}
        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
      >
        {getButtonText()}
      </button>
      {error && <p className="text-xs text-red-600 max-w-xs text-right">{error}</p>}
    </div>
  )
}
