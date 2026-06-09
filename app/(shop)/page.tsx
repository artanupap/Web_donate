import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { ArrowRight, ShoppingBag, Shield, Zap } from "lucide-react";

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { active: true, featured: true },
    take: 4,
    orderBy: { sortOrder: "asc" },
  });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: { where: { active: true } } } } },
  });

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 border border-navy-700 p-6 md:p-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-blue-900/40 border border-blue-700/50 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
            <Zap className="w-3.5 h-3.5" />
            ส่งไอเท็มเข้าเกมทันที
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            <span className="text-blue-500">Amulet</span> Shop
          </h1>
          <p className="text-slate-400 text-sm md:text-lg mb-6 max-w-lg mx-auto">
            ซื้อไอเท็ม อาวุธ ยานพาหนะ และอื่นๆ เพื่อรับในเกมได้ทันที
          </p>
          <Link href="/shop" className="btn-primary inline-flex items-center gap-2 text-base px-6 py-3">
            ดูสินค้าทั้งหมด <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: "ส่งทันที", desc: "ไอเท็มเข้ากระเป๋าในเกมทันทีหลังชำระเงิน" },
          { icon: Shield, title: "ปลอดภัย", desc: "ล็อกอินด้วย Discord มั่นใจ 100%" },
          { icon: ShoppingBag, title: "หลากหลาย", desc: "ครบทั้งอาวุธ ยานพาหนะ ชุด และไอเท็มทั่วไป" },
        ].map((f) => (
          <div key={f.title} className="card p-6">
            <f.icon className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-sm text-slate-500">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">หมวดหมู่</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.id}`}
                className="btn-ghost text-sm"
              >
                {c.name}
                <span className="ml-1.5 text-xs text-slate-600">({c._count.products})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">สินค้าแนะนำ</h2>
            <Link href="/shop" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
