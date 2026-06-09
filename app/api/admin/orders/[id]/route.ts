import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deliverItemsToPlayer } from "@/lib/fivem";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: true, items: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    await prisma.order.update({ where: { id: params.id }, data: { status: "approved" } });
    return NextResponse.json({ message: "อนุมัติแล้ว" });
  }

  if (action === "reject") {
    await prisma.order.update({ where: { id: params.id }, data: { status: "rejected" } });
    return NextResponse.json({ message: "ปฏิเสธแล้ว" });
  }

  if (action === "deliver") {
    const items = order.items.map((i) => ({
      itemName: i.itemName,
      amount: i.quantity * i.itemAmount,
    }));

    const result = await deliverItemsToPlayer(order.user.discordId, order.id, items);

    await prisma.order.update({
      where: { id: params.id },
      data: {
        status: result.queued ? "approved" : "delivered",
        fivemSent: !result.queued,
      },
    });
    return NextResponse.json({
      message: result.queued
        ? "บันทึก queue แล้ว ส่งเมื่อ player เข้าเกม"
        : "ส่งไอเท็มสำเร็จ",
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
