// app/api/datasets/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { id: true, filePath: true },
  })

  if (!dataset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    // Delete the file from disk
    const abs = path.join(process.cwd(), dataset.filePath)
    await fs.unlink(abs).catch(() => {
      // Ignore errors if file doesn't exist
    })

    // Delete related records first (columns don't have cascade delete)
    await prisma.column.deleteMany({
      where: { datasetId: dataset.id },
    })

    // Delete insights (has cascade but being explicit)
    await prisma.insight.deleteMany({
      where: { datasetId: dataset.id },
    })

    // Delete dataset from database
    await prisma.dataset.delete({
      where: { id: dataset.id },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
