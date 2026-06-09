import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json();
  const topup = await prisma.topUpHistory.findUnique({ where: { id: params.id } });
  if (!topup) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (topup.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 400 });

  if (action === "approve") {
    await prisma.$transaction([
      prisma.topUpHistory.update({ where: { id: params.id }, data: { status: "approved" } }),
      prisma.user.update({ where: { id: topup.userId }, data: { points: { increment: topup.points } } }),
      prisma.pointTransaction.create({
        data: {
          userId: topup.userId,
          type: "earn",
          amount: topup.points,
          description: `เติมพ้อย ฿${topup.amount}`,
          refId: params.id,
        },
      }),
    ]);
    return NextResponse.json({ message: `อนุมัติแล้ว +${topup.points} พ้อย` });
  }

  if (action === "reject") {
    await prisma.topUpHistory.update({ where: { id: params.id }, data: { status: "rejected" } });
    return NextResponse.json({ message: "ปฏิเสธแล้ว" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
