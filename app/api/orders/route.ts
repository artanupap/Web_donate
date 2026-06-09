import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { deliverItemsToPlayer } from "@/lib/fivem";
import { verifySlip } from "@/lib/slip2go";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

  const user = session.user as any;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });

  const form = await req.formData();
  const itemsRaw = form.get("items") as string;
  const total = parseInt(form.get("total") as string);
  const method = form.get("method") as string;
  const slipFile = form.get("slip") as File | null;

  const items: { id: string; name: string; price: number; quantity: number }[] = JSON.parse(itemsRaw);
  if (!items?.length) return NextResponse.json({ error: "ไม่มีรายการสินค้า" }, { status: 400 });

  // ตรวจสอบสินค้า
  const productIds = items.map((i) => i.id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  if (products.length !== items.length) {
    return NextResponse.json({ error: "สินค้าบางรายการไม่พบหรือปิดการขายแล้ว" }, { status: 400 });
  }

  let slipPath: string | null = null;
  let orderStatus = "pending";
  let slipNote = "";

  // --- ชำระด้วยโอนเงิน ---
  if (method === "transfer") {
    if (!slipFile) return NextResponse.json({ error: "กรุณาแนบสลิปการโอนเงิน" }, { status: 400 });

    const bytes = await slipFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `order_${Date.now()}_${slipFile.name}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    slipPath = `/uploads/${filename}`;

    // ตรวจสลิปอัตโนมัติ
    const slipResult = await verifySlip(buffer, filename);

    if (slipResult.verified && slipResult.amount !== undefined) {
      if (Math.abs(slipResult.amount - total) <= 1) {
        orderStatus = "approved";
        slipNote = `ยืนยันอัตโนมัติ: ฿${slipResult.amount} | ref: ${slipResult.transactionId || "-"}`;
      } else {
        slipNote = `ยอดสลิป ฿${slipResult.amount} ≠ ยอดสั่งซื้อ ฿${total} — รอแอดมินตรวจสอบ`;
      }
    } else {
      slipNote = `อ่าน QR ไม่ได้ — รอแอดมินตรวจสอบ`;
    }
  }

  // --- ชำระด้วยพ้อย ---
  if (method === "points") {
    if (dbUser.points < total) {
      return NextResponse.json({ error: "พ้อยไม่เพียงพอ" }, { status: 400 });
    }
    orderStatus = "approved";
  }

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId: dbUser.id,
        totalPrice: total,
        status: orderStatus,
        slipImage: slipPath,
        note: slipNote || undefined,
        items: {
          create: items.map((item) => {
            const p = products.find((pr) => pr.id === item.id)!;
            return {
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              itemName: p.itemName,
              itemAmount: p.itemAmount,
            };
          }),
        },
      },
      include: { items: true },
    });

    if (method === "points") {
      await tx.user.update({
        where: { id: dbUser.id },
        data: { points: { decrement: total } },
      });
      await tx.pointTransaction.create({
        data: {
          userId: dbUser.id,
          type: "spend",
          amount: -total,
          description: `ซื้อสินค้า: ${items.map((i) => i.name).join(", ")}`,
          refId: o.id,
        },
      });
    }

    return o;
  });

  // ถ้าอนุมัติแล้ว — ส่งไอเท็มเข้าเกมเลย
  if (orderStatus === "approved") {
    const deliverItems = order.items.map((i) => ({
      itemName: i.itemName,
      amount: i.quantity * i.itemAmount,
    }));
    const result = await deliverItemsToPlayer(dbUser.discordId, order.id, deliverItems);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: result.queued ? "approved" : "delivered",
        fivemSent: !result.queued,
      },
    });
    return NextResponse.json({
      success: true,
      autoDelivered: !result.queued,
      orderId: order.id,
      message: result.queued
        ? "ชำระสำเร็จ! ไอเท็มจะส่งเข้าเกมอัตโนมัติเมื่อคุณเข้าเกม"
        : "ชำระสำเร็จ! ไอเท็มถูกส่งเข้าเกมแล้ว",
    });
  }

  return NextResponse.json({
    success: true,
    autoDelivered: false,
    orderId: order.id,
    message: slipNote || "สั่งซื้อสำเร็จ รอแอดมินตรวจสอบสลิป",
  });
}
