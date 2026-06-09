import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const imageFile = form.get("image") as File | null;

  let imagePath: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const bytes = await imageFile.arrayBuffer();
    const filename = `product_${Date.now()}_${imageFile.name}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), Buffer.from(bytes));
    imagePath = `/uploads/${filename}`;
  }

  const product = await prisma.product.create({
    data: {
      name: form.get("name") as string,
      description: (form.get("description") as string) || null,
      image: imagePath,
      price: parseInt(form.get("price") as string),
      salePrice: form.get("salePrice") ? parseInt(form.get("salePrice") as string) : null,
      itemName: form.get("itemName") as string,
      itemAmount: parseInt(form.get("itemAmount") as string) || 1,
      categoryId: (form.get("categoryId") as string) || null,
      stock: parseInt(form.get("stock") as string) ?? -1,
      featured: form.get("featured") === "true",
      sortOrder: parseInt(form.get("sortOrder") as string) || 0,
    },
  });

  return NextResponse.json(product);
}
