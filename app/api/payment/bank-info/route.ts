import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: ["bank_name", "bank_account", "bank_owner"] } },
  });
  const result: Record<string, string> = {};
  settings.forEach((s) => (result[s.key] = s.value));
  return NextResponse.json(result);
}
