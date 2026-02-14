import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DatasetStatus } from "@prisma/client"
import fs from "fs/promises"
import path from "path"
import crypto from "crypto"

export const runtime = "nodejs"

function safeFilenameBase(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40)
}

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
      return NextResponse.json(
        { error: "Dataset name is required" },
        { status: 400 },
      )
    }

    const hasFile = !!file && typeof file === "object"
    const hasRaw = typeof rawCsv === "string" && rawCsv.trim().length > 0

    if (!hasFile && !hasRaw) {
      return NextResponse.json(
        { error: "Provide either a file or pasted CSV text" },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let bytes: Uint8Array
    let ext = ".csv"

    if (hasFile && file) {
      const filename = file.name || "upload.csv"
      ext = filename.toLowerCase().endsWith(".tsv") ? ".tsv" : ".csv"
      bytes = new Uint8Array(await file.arrayBuffer())
    } else {
      const text = normalizeCsvText(String(rawCsv))
      bytes = new TextEncoder().encode(text)
      ext = text.includes("\t") && !text.includes(",") ? ".tsv" : ".csv"
    }

    const dataDir = path.join(process.cwd(), "data")
    await fs.mkdir(dataDir, { recursive: true })

    const stamp = Date.now()
    const rand = crypto.randomBytes(6).toString("hex")
    const base = safeFilenameBase(nameRaw) || "dataset"
    const filename = `${stamp}-${base}-${rand}${ext}`

    const absPath = path.join(dataDir, filename)
    await fs.writeFile(absPath, bytes)

    const relPath = path.join("data", filename)

    const dataset = await prisma.dataset.create({
      data: {
        userId: user.id,
        name: nameRaw,
        filePath: relPath,
        status: DatasetStatus.PENDING,
      },
      select: { id: true },
    })

    return NextResponse.json({ datasetId: dataset.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
