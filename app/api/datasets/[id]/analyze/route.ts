// app/api/datasets/[id]/analyze/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DatasetStatus } from "@prisma/client"
import fs from "fs/promises"
import path from "path"
import { requestAnalysis } from "@/lib/analyticsClient"
import { generateInsights } from "@/lib/openaiService"

export const runtime = "nodejs"

// Detect delimiter based on header line
function detectDelimiter(headerLine: string) {
  if (headerLine.includes("\t")) return "\t"
  if (headerLine.includes(",")) return ","
  if (headerLine.includes(";")) return ";"
  return ","
}

function parseCsvPreview(raw: string, maxRows = 25) {
  const lines = raw.split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [], delimiter: "," }

  const delimiter = detectDelimiter(lines[0])
  const headers = lines[0].split(delimiter).map((h) => h.trim())

  const rows = lines.slice(1, maxRows + 1).map((line) =>
    line.split(delimiter).map((v) => v.trim()),
  )

  return { headers, rows, delimiter }
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { id: true, name: true, filePath: true, status: true },
  })

  if (!dataset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Atomic status transition: only update if not already ANALYZING
  // This prevents race conditions from multiple simultaneous requests
  const updated = await prisma.dataset.updateMany({
    where: {
      id: dataset.id,
      status: { not: DatasetStatus.ANALYZING },
    },
    data: {
      status: DatasetStatus.ANALYZING,
      // Note: analysisStartedAt commented out until migration is applied
      // analysisStartedAt: new Date(),
    },
  })

  // If updateMany returned 0, it means status was already ANALYZING
  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Analysis already in progress" },
      { status: 409 },
    )
  }

  try {
    // 1) Read the stored file
    const abs = path.join(process.cwd(), dataset.filePath)
    const raw = await fs.readFile(abs, "utf8")

    // 2) Build preview
    const preview = parseCsvPreview(raw)
    const rowCountApprox = Math.max(0, raw.split(/\r?\n/).filter(Boolean).length - 1)

    const previewObj = {
      summary: `Dataset "${dataset.name}" loaded successfully.`,
      rowCountApprox,
      columnCount: preview.headers.length,
      delimiter: preview.delimiter === "\t" ? "TAB" : preview.delimiter,
      headers: preview.headers,
      sampleRows: preview.rows,
      notes: [
        "Preview created from the uploaded/pasted file.",
        "Next step: compute column stats (FastAPI).",
      ],
    }

    // 3) Clean ALL old insights to avoid duplicates
    await prisma.insight.deleteMany({
      where: {
        datasetId: dataset.id,
      },
    })

    // 4) Save preview insight
    await prisma.insight.create({
      data: {
        datasetId: dataset.id,
        category: "preview",
        text: JSON.stringify(previewObj, null, 2),
      },
    })

    // 5) Call analytics service for column stats
    const analysis = await requestAnalysis(dataset.filePath)

    // 6) Replace columns in DB
    await prisma.column.deleteMany({ where: { datasetId: dataset.id } })

    await prisma.column.createMany({
      data: analysis.columns.map((c) => ({
        datasetId: dataset.id,
        name: c.name,
        type: c.type,
        missingPct: c.missingPct,
        min: c.min ?? null,
        max: c.max ?? null,
        mean: c.mean ?? null,
      })),
    })

    // 7) Save profile insight
    await prisma.insight.create({
      data: {
        datasetId: dataset.id,
        category: "profile",
        text: JSON.stringify(analysis, null, 2),
      },
    })

    // 8) Generate AI insights (optional, non-blocking)
    try {
      const aiInsights = await generateInsights(
        dataset.name,
        analysis.columns,
        rowCountApprox
      )

      if (aiInsights.length > 0) {
        await prisma.insight.create({
          data: {
            datasetId: dataset.id,
            category: "ai_insight",
            text: JSON.stringify({ insights: aiInsights }, null, 2),
          },
        })
      }
    } catch (aiError) {
      console.error("AI insights generation failed (non-critical):", aiError)
      // Don't fail the entire analysis if AI insights fail
    }

    // 9) Done
    await prisma.dataset.update({
      where: { id: dataset.id },
      data: { status: DatasetStatus.READY },
    })

    return NextResponse.json({ status: "READY" })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"

    await prisma.dataset.update({
      where: { id: dataset.id },
      data: { status: DatasetStatus.FAILED },
    })

    await prisma.insight.create({
      data: {
        datasetId: dataset.id,
        category: "error",
        text: message,
      },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
