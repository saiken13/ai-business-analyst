import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DatasetStatus } from "@prisma/client"

export const runtime = "nodejs"

function normalizeCsvText(text: string) {
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  return t.endsWith("\n") ? t : t + "\n"
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const form = await req.formData()
    const nameRaw = String(form.get("name") || "").trim()
    const file = form.get("file") as File | null
    const rawCsv = form.get("rawCsv")

    if (!nameRaw) {
      return NextResponse.json({ error: "Dataset name is required" }, { status: 400 })
    }

    const hasFile = !!file && typeof file === "object"
    const hasRaw = typeof rawCsv === "string" && rawCsv.trim().length > 0

    if (!hasFile && !hasRaw) {
      return NextResponse.json({ error: "Provide either a file or pasted CSV text" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let csvText: string

    if (hasFile && file) {
      const bytes = await file.arrayBuffer()
      csvText = new TextDecoder("utf-8").decode(bytes)
    } else {
      csvText = normalizeCsvText(String(rawCsv))
    }

    // Create dataset record (no file storage - works on Vercel)
    const dataset = await prisma.dataset.create({
      data: {
        userId: user.id,
        name: nameRaw,
        filePath: "",
        status: DatasetStatus.PENDING,
      },
      select: { id: true },
    })

    // Store CSV content in database as a "raw_csv" insight
    await prisma.insight.create({
      data: {
        datasetId: dataset.id,
        category: "raw_csv",
        text: csvText,
      },
    })

    return NextResponse.json({ datasetId: dataset.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
