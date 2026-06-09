import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, reason } = await req.json();
  if (!amount || typeof amount !== "number") {
    return NextResponse.json({ error: "ระบุจำนวนพ้อย" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

  // ป้องกันพ้อยติดลบ
  if (amount < 0 && user.points + amount < 0) {
    return NextResponse.json({ error: `พ้อยไม่พอ (มี ${user.points} พ้อย)` }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: params.id },
      data: { points: { increment: amount } },
    }),
    prisma.pointTransaction.create({
      data: {
        userId: params.id,
        type: amount > 0 ? "earn" : "spend",
        amount,
        description: reason || "แอดมินปรับพ้อย",
      },
    }),
  ]);

  const newPoints = user.points + amount;
  const action = amount > 0 ? `+${amount}` : `${amount}`;
  return NextResponse.json({
    message: `${action} พ้อยให้ ${user.discordUsername} แล้ว (คงเหลือ ${newPoints.toLocaleString()})`,
  });
}
