import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
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

  // อ่านไฟล์สลิป + คำนวณ hash กัน reuse
  const bytes = await slipFile.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const slipHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // เช็คสลิปซ้ำ (hash เดิม)
  const dupHash = await prisma.topUpHistory.findUnique({ where: { slipHash } });
  if (dupHash) {
    return NextResponse.json({ error: "สลิปนี้ถูกใช้ไปแล้ว ไม่สามารถใช้ซ้ำได้" }, { status: 400 });
  }

  // บันทึกไฟล์สลิป
  const filename = `topup_${Date.now()}_${slipFile.name}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  const slipPath = `/uploads/${filename}`;

  // ตรวจสอบสลิป (เก็บผลไว้ใน note แต่ approve เสมอ)
  const slipResult = await verifySlip(Buffer.from(bytes), filename);

  // เช็ค transactionId ซ้ำ (ถ้า QR อ่านได้)
  if (slipResult.transactionId) {
    const dupTxn = await prisma.topUpHistory.findUnique({
      where: { transactionId: slipResult.transactionId },
    });
    if (dupTxn) {
      return NextResponse.json({ error: "สลิปนี้ถูกใช้ไปแล้ว (transaction ซ้ำ)" }, { status: 400 });
    }
  }

  const status = "approved"; // auto-approve เสมอ ไม่รอแอดมิน
  let autoNote = "";

  if (slipResult.verified && slipResult.amount !== undefined) {
    autoNote = `QR ยืนยัน: ฿${slipResult.amount} | ${slipResult.transactionId || "-"}`;
  } else if (slipResult.amount !== undefined) {
    autoNote = `ยอดจากสลิป: ฿${slipResult.amount} (อนุมัติอัตโนมัติ)`;
  } else {
    autoNote = `อนุมัติอัตโนมัติ ฿${amount} (อ่าน QR ไม่ได้)`;
  }

  const topup = await prisma.topUpHistory.create({
    data: {
      userId: dbUser.id,
      amount,
      points,
      slipImage: slipPath,
      slipHash,
      transactionId: slipResult.transactionId || null,
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

  // ไม่ควรถึงจุดนี้แล้ว แต่ fallback ไว้
  return NextResponse.json({
    success: true,
    autoApproved: true,
    points,
    message: `เติมพ้อยสำเร็จ! +${points.toLocaleString()} พ้อย`,
  });
}
