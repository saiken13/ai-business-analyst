import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(
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
    select: { id: true, status: true, name: true },
  })

  if (!dataset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const insights = await prisma.insight.findMany({
    where: { datasetId: dataset.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return NextResponse.json({ dataset, insights })
}
