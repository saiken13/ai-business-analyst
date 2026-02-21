import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    select: { id: true },
  })

  if (!dataset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    await prisma.column.deleteMany({ where: { datasetId: dataset.id } })
    await prisma.insight.deleteMany({ where: { datasetId: dataset.id } })
    await prisma.dataset.delete({ where: { id: dataset.id } })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
