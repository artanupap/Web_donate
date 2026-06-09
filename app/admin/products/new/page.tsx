import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany();
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">เพิ่มสินค้า</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
