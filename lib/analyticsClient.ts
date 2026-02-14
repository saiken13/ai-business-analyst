// lib/analyticsClient.ts
import fs from "fs/promises"
import path from "path"

export type AnalysisResult = {
  columns: Array<{
    name: string
    type: string
    missingPct: number
    min?: number | null
    max?: number | null
    mean?: number | null
  }>
}

export async function requestAnalysis(filePathFromDb: string): Promise<AnalysisResult> {
  const absPath = path.isAbsolute(filePathFromDb)
    ? filePathFromDb
    : path.join(process.cwd(), filePathFromDb)

  const csvContent = await fs.readFile(absPath, "utf8")

  const baseUrl = process.env.ANALYTICS_SERVICE_URL || "http://localhost:8000"

  const res = await fetch(`${baseUrl}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csvContent }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Analytics service failed (${res.status}): ${text}`)
  }

  return (await res.json()) as AnalysisResult
}
