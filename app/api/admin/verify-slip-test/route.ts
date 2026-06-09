import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { verifySlipLocal } from "@/lib/slipVerify";

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("slip") as File | null;
  if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await verifySlipLocal(buffer);

  return NextResponse.json(result);
}
