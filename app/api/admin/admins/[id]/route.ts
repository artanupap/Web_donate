import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const me = getAdminFromRequest(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ห้ามลบตัวเอง
  const target = await prisma.admin.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "ไม่พบแอดมิน" }, { status: 404 });
  if (target.username === me.username) {
    return NextResponse.json({ error: "ลบตัวเองไม่ได้" }, { status: 400 });
  }

  // ต้องมีแอดมินเหลืออย่างน้อย 1 คน
  const count = await prisma.admin.count();
  if (count <= 1) {
    return NextResponse.json({ error: "ต้องมีแอดมินอย่างน้อย 1 คน" }, { status: 400 });
  }

  await prisma.admin.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
