import { prisma } from "@/lib/prisma";
import { ShoppingBag, Users, ArrowUpCircle, Package, TrendingUp } from "lucide-react";

export default async function AdminDashboard() {
  const [totalOrders, pendingOrders, totalUsers, pendingTopups, totalProducts] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.user.count(),
    prisma.topUpHistory.count({ where: { status: "pending" } }),
    prisma.product.count({ where: { active: true } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { user: true, items: true },
  });

  const revenue = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { status: { in: ["approved", "delivered", "completed"] } },
  });

  const stats = [
    { label: "คำสั่งซื้อทั้งหมด", value: totalOrders, sub: `รอตรวจ ${pendingOrders}`, icon: ShoppingBag, color: "text-blue-400" },
    { label: "ผู้ใช้งาน", value: totalUsers, sub: "บัญชีทั้งหมด", icon: Users, color: "text-purple-400" },
    { label: "รอเติมพ้อย", value: pendingTopups, sub: "รายการ", icon: ArrowUpCircle, color: "text-yellow-400" },
    { label: "รายได้รวม", value: `฿${(revenue._sum.totalPrice || 0).toLocaleString()}`, sub: "ที่อนุมัติแล้ว", icon: TrendingUp, color: "text-green-400" },
  ];

  const STATUS_COLOR: Record<string, string> = {
    pending: "text-yellow-300 bg-yellow-900/20",
    approved: "text-green-300 bg-green-900/20",
    rejected: "text-red-300 bg-red-900/20",
    delivered: "text-blue-300 bg-blue-900/20",
    completed: "text-green-300 bg-green-900/20",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm mt-0.5">{s.label}</p>
            <p className="text-slate-600 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="p-4 border-b border-navy-700">
          <h2 className="font-semibold text-white">คำสั่งซื้อล่าสุด</h2>
        </div>
        <div className="divide-y divide-navy-700">
          {recentOrders.map((o) => (
            <div key={o.id} className="p-4 flex items-center justify-between hover:bg-navy-800/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">{o.user.discordUsername}</p>
                <p className="text-xs text-slate-500 font-mono">{o.id.slice(-8)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-400">฿{o.totalPrice.toLocaleString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || ""}`}>
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
