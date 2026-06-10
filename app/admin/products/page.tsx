import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import ProductToggle from "./ProductToggle";
import ProductDelete from "./ProductDelete";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">สินค้า</h1>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> เพิ่มสินค้า
        </Link>
      </div>

      <div className="card divide-y divide-navy-700">
        {products.length === 0 && (
          <p className="p-8 text-center text-slate-500">ยังไม่มีสินค้า</p>
        )}
        {products.map((p) => (
          <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-navy-800/40 transition-colors">
            <div className="w-12 h-12 bg-navy-800 rounded-lg shrink-0 overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-navy-600 text-xs">IMG</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm">{p.name}</p>
              <p className="text-xs text-slate-500">{p.itemName} × {p.itemAmount} | {p.category?.name || "ไม่มีหมวด"}</p>
            </div>
            <div className="text-right min-w-[80px]">
              <p className="text-blue-400 font-semibold text-sm">฿{p.price.toLocaleString()}</p>
              <p className="text-xs text-slate-500">stock: {p.stock === -1 ? "∞" : p.stock}</p>
            </div>
            <ProductToggle id={p.id} active={p.active} />
            <Link
              href={`/admin/products/${p.id}`}
              className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <ProductDelete id={p.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
