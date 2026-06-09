import { NextRequest, NextResponse } from "next/server";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const amount = parseFloat(req.nextUrl.searchParams.get("amount") || "0");
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "ระบุจำนวนเงิน" }, { status: 400 });
  }

  const setting = await prisma.siteSetting.findUnique({ where: { key: "promptpay_id" } });
  const promptpayId = setting?.value?.trim();

  if (!promptpayId) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า PromptPay ID" }, { status: 400 });
  }

  const payload = generatePayload(promptpayId, { amount });
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return NextResponse.json({ qr: qrDataUrl, amount, promptpayId });
}
