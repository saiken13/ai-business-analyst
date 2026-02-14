"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type Insight = {
  id: string
  category: string
  text: string
  createdAt: string | Date
}

export function InsightsSection({
  datasetId,
  insights: initialInsights,
}: {
  datasetId: string
  insights: Insight[]
}) {
  const [insights, setInsights] = useState<Insight[]>(initialInsights)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleGenerate() {
    setError(null)
    try {
      const res = await fetch(`/api/datasets/${datasetId}/insights`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to generate insights")
      }
      const data = await res.json()
      setInsights((prev) => [data.insight, ...prev])
      startTransition(() => {
        router.refresh()
      })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI Insights</h2>
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="px-3 py-1.5 rounded-md bg-black text-white text-xs disabled:opacity-60"
        >
          {isPending ? "Thinking..." : "Generate insights"}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {insights.length === 0 && !isPending && (
        <p className="text-sm text-gray-500">
          No insights yet. Click &quot;Generate insights&quot; to let the AI
          analyze this dataset.
        </p>
      )}

      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((i) => (
            <article
              key={i.id}
              className="border rounded-md p-3 bg-white/50 space-y-1"
            >
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                {i.category} •{" "}
                {new Date(i.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="text-sm whitespace-pre-wrap">{i.text}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
