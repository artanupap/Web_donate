import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "../ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.category.findMany(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">แก้ไขสินค้า</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
