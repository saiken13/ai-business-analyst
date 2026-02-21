// lib/analyticsClient.ts
// Pure JS implementation - no Python service needed, works on Vercel

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

function detectDelimiter(headerLine: string): string {
  if (headerLine.includes("\t")) return "\t"
  if (headerLine.includes(";")) return ";"
  return ","
}

export async function requestAnalysis(csvContent: string): Promise<AnalysisResult> {
  const lines = csvContent.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return { columns: [] }

  const delimiter = detectDelimiter(lines[0])
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ""))
  const dataRows = lines.slice(1).map((line) =>
    line.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""))
  )
  const totalRows = dataRows.length

  const columns = headers.map((name, colIdx) => {
    const allValues = dataRows.map((row) => row[colIdx] ?? "")
    const missingCount = allValues.filter((v) => v === "" || v === "null" || v === "NULL" || v === "N/A").length
    const missingPct = totalRows > 0 ? (missingCount / totalRows) * 100 : 0

    const nonEmpty = allValues.filter((v) => v !== "" && v !== "null" && v !== "NULL" && v !== "N/A")
    const numericValues = nonEmpty.map((v) => parseFloat(v)).filter((v) => !isNaN(v) && isFinite(v))
    const isNumeric = nonEmpty.length > 0 && numericValues.length / nonEmpty.length >= 0.7

    if (isNumeric && numericValues.length > 0) {
      const min = Math.min(...numericValues)
      const max = Math.max(...numericValues)
      const mean = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length
      return { name, type: "number", missingPct, min, max, mean: parseFloat(mean.toFixed(4)) }
    }

    return { name, type: "string", missingPct, min: null, max: null, mean: null }
  })

  return { columns }
}
