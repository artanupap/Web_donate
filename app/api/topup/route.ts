import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { verifySlip } from "@/lib/slip2go";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

  const user = session.user as any;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });

  const form = await req.formData();
  const amount = parseInt(form.get("amount") as string);
  const slipFile = form.get("slip") as File | null;

  if (!amount || amount < 10) return NextResponse.json({ error: "จำนวนเงินขั้นต่ำ 10 บาท" }, { status: 400 });
  if (!slipFile) return NextResponse.json({ error: "กรุณาแนบสลิปการโอนเงิน" }, { status: 400 });

  const settingRaw = await prisma.siteSetting.findUnique({ where: { key: "points_per_baht" } });
  const rate = parseInt(settingRaw?.value || "1");
  const points = amount * rate;

  // บันทึกไฟล์สลิป
  const bytes = await slipFile.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `topup_${Date.now()}_${slipFile.name}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  const slipPath = `/uploads/${filename}`;

  // ตรวจสอบสลิปอัตโนมัติ ด้วย Slip2Go
  const slipResult = await verifySlip(Buffer.from(bytes), filename);

  let status = "pending";
  let autoNote = "";

  if (slipResult.verified && slipResult.amount !== undefined) {
    if (Math.abs(slipResult.amount - amount) <= 1) {
      // ยอดตรง — อนุมัติอัตโนมัติ
      status = "approved";
      autoNote = `ยืนยันอัตโนมัติ: ฿${slipResult.amount} | ${slipResult.transactionId || ""}`;
    } else {
      // ยอดไม่ตรง — รอแอดมิน
      autoNote = `ยอดสลิป ฿${slipResult.amount} ไม่ตรงกับที่แจ้ง ฿${amount} — รอแอดมินตรวจสอบ`;
    }
  } else if (!slipResult.success) {
    autoNote = `ตรวจสลิปไม่สำเร็จ: ${slipResult.error || "ไม่ทราบสาเหตุ"} — รอแอดมินตรวจสอบ`;
  } else {
    autoNote = "อ่าน QR ไม่ได้ — รอแอดมินตรวจสอบ";
  }

  const topup = await prisma.topUpHistory.create({
    data: {
      userId: dbUser.id,
      amount,
      points,
      slipImage: slipPath,
      status,
      note: autoNote,
    },
  });

  // ถ้าอนุมัติอัตโนมัติ — บวกพ้อยทันที
  if (status === "approved") {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: dbUser.id },
        data: { points: { increment: points } },
      }),
      prisma.pointTransaction.create({
        data: {
          userId: dbUser.id,
          type: "earn",
          amount: points,
          description: `เติมพ้อย ฿${amount} (ยืนยันอัตโนมัติ)`,
          refId: topup.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      autoApproved: true,
      points,
      message: `เติมพ้อยสำเร็จ! +${points.toLocaleString()} พ้อย`,
    });
  }

  return NextResponse.json({
    success: true,
    autoApproved: false,
    message: autoNote || "ส่งคำขอแล้ว รอแอดมินตรวจสอบ",
  });
}
