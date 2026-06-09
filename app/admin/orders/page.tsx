import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import OrderActions from "./OrderActions";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status;

  const orders = await prisma.order.findMany({
    where: status ? { status } : {},
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const STATUS_COLOR: Record<string, string> = {
    pending: "text-yellow-300 bg-yellow-900/20 border-yellow-700/40",
    approved: "text-green-300 bg-green-900/20 border-green-700/40",
    rejected: "text-red-300 bg-red-900/20 border-red-700/40",
    delivered: "text-blue-300 bg-blue-900/20 border-blue-700/40",
  };

  const FILTERS = [
    { key: "", label: "ทั้งหมด" },
    { key: "pending", label: "รอตรวจ" },
    { key: "approved", label: "อนุมัติ" },
    { key: "delivered", label: "ส่งแล้ว" },
    { key: "rejected", label: "ปฏิเสธ" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">คำสั่งซื้อ</h1>

      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <a
            key={f.key}
            href={f.key ? `?status=${f.key}` : "/admin/orders"}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              status === f.key || (!status && !f.key)
                ? "bg-blue-900/40 border-blue-700 text-blue-300"
                : "border-navy-700 text-slate-400 hover:border-navy-600"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="card divide-y divide-navy-700">
        {orders.length === 0 && <p className="p-8 text-center text-slate-500">ไม่มีคำสั่งซื้อ</p>}
        {orders.map((o) => {
          const sc = STATUS_COLOR[o.status] || "text-slate-300 bg-navy-800 border-navy-700";
          return (
            <div key={o.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-white text-sm">{o.user.discordUsername}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{o.id}</p>
                  <p className="text-xs text-slate-600">
                    {format(new Date(o.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-400">฿{o.totalPrice.toLocaleString()}</p>
                  <span className={`badge border text-xs ${sc}`}>{o.status}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 mb-3">
                {o.items.map((i) => `${i.itemName} ×${i.quantity * i.itemAmount}`).join(", ")}
              </div>

              {o.slipImage && (
                <a href={o.slipImage} target="_blank" className="text-xs text-blue-400 hover:underline mb-3 block">
                  ดูสลิปการโอน →
                </a>
              )}

              <OrderActions order={{ id: o.id, status: o.status, userId: o.userId, discordId: o.user.discordId, items: o.items }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
