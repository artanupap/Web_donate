import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admins = await prisma.admin.findMany({
    select: { id: true, username: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username, password } = await req.json();
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "ระบุ username และ password" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านขั้นต่ำ 6 ตัวอักษร" }, { status: 400 });
  }

  const exists = await prisma.admin.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "Username นี้มีอยู่แล้ว" }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({
    data: { username, password: hash },
    select: { id: true, username: true, createdAt: true },
  });
  return NextResponse.json(admin);
}
