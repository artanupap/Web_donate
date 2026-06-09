import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface Props {
  searchParams: { category?: string; q?: string };
}

export default async function ShopPage({ searchParams }: Props) {
  const categories = await prisma.category.findMany();

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(searchParams.category ? { categoryId: searchParams.category } : {}),
      ...(searchParams.q
        ? { name: { contains: searchParams.q } }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">ร้านค้า</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="ค้นหาสินค้า..."
            className="input max-w-xs text-sm"
          />
          <button type="submit" className="btn-primary text-sm">ค้นหา</button>
        </form>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/shop"
          className={`badge px-3 py-1.5 text-sm border ${
            !searchParams.category
              ? "bg-blue-600 text-white border-blue-600"
              : "border-navy-700 text-slate-400 hover:border-blue-700 hover:text-white"
          }`}
        >
          ทั้งหมด
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.id}`}
            className={`badge px-3 py-1.5 text-sm border ${
              searchParams.category === c.id
                ? "bg-blue-600 text-white border-blue-600"
                : "border-navy-700 text-slate-400 hover:border-blue-700 hover:text-white"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-slate-500">ไม่พบสินค้า</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
