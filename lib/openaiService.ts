import OpenAI from "openai"
import Groq from "groq-sdk"

type ColumnStat = {
  name: string
  type: string
  missingPct: number
  min?: number | null
  max?: number | null
  mean?: number | null
}

export async function generateInsights(
  datasetName: string,
  columns: ColumnStat[],
  rowCount: number
): Promise<string[]> {
  const columnSummary = columns
    .map((c) => {
      const stats =
        c.type === "number"
          ? `(min: ${c.min}, max: ${c.max}, mean: ${c.mean?.toFixed(2)}, missing: ${c.missingPct.toFixed(1)}%)`
          : `(missing: ${c.missingPct.toFixed(1)}%)`
      return `- ${c.name} [${c.type}] ${stats}`
    })
    .join("\n")

  const prompt = `You are a data analyst. Analyze this dataset and provide 3-5 key insights in bullet points.

Dataset: "${datasetName}"
Rows: ~${rowCount}
Columns:
${columnSummary}

Provide insights about:
1. Data quality (missing values, data types)
2. Interesting patterns or observations
3. Potential data issues or recommendations

Format: Return ONLY a JSON array of insight strings, like: ["insight 1", "insight 2", ...]`

  // Try Groq first (free and fast!)
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      })

      const content = response.choices[0]?.message?.content || "[]"
      const insights = JSON.parse(content)
      return Array.isArray(insights) ? insights : []
    } catch (error) {
      console.error("Groq insights generation failed, trying OpenAI:", error)
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      })

      const content = response.choices[0]?.message?.content || "[]"
      const insights = JSON.parse(content)
      return Array.isArray(insights) ? insights : []
    } catch (error) {
      console.error("OpenAI insights generation failed:", error)
      return []
    }
  }

  console.warn("No AI API key set (GROQ_API_KEY or OPENAI_API_KEY), skipping AI insights")
  return []
}
