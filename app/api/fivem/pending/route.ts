import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // ตรวจ API key
  const key = req.headers.get("x-api-key");
  if (key !== process.env.FIVEM_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const discordId = req.nextUrl.searchParams.get("discordId");
  if (!discordId) return NextResponse.json({ error: "Missing discordId" }, { status: 400 });

  const pending = await prisma.pendingDelivery.findMany({
    where: { discordId, delivered: false },
  });

  return NextResponse.json({ items: pending });
}

export async function POST(req: NextRequest) {
  // FiveM แจ้งว่าส่งไอเท็มแล้ว — mark delivered
  const key = req.headers.get("x-api-key");
  if (key !== process.env.FIVEM_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = await req.json(); // array of PendingDelivery id
  if (!ids?.length) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  await prisma.pendingDelivery.updateMany({
    where: { id: { in: ids } },
    data: { delivered: true, deliveredAt: new Date() },
  });

  // ถ้า order ทุก item delivered แล้ว → update order status
  const deliveries = await prisma.pendingDelivery.findMany({
    where: { id: { in: ids } },
    select: { orderId: true },
  });

  const orderIds = [...new Set(deliveries.map((d) => d.orderId))];
  for (const orderId of orderIds) {
    const remaining = await prisma.pendingDelivery.count({
      where: { orderId, delivered: false },
    });
    if (remaining === 0) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "delivered", fivemSent: true },
      });
    }
  }

  return NextResponse.json({ success: true, delivered: ids.length });
}
