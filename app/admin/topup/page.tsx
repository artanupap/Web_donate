import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import TopupActions from "./TopupActions";

export default async function AdminTopupPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status;

  const topups = await prisma.topUpHistory.findMany({
    where: status ? { status } : {},
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const STATUS_COLOR: Record<string, string> = {
    pending: "text-yellow-300 bg-yellow-900/20 border-yellow-700/40",
    approved: "text-green-300 bg-green-900/20 border-green-700/40",
    rejected: "text-red-300 bg-red-900/20 border-red-700/40",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">ประวัติเติมพ้อย</h1>

      <div className="flex gap-2 mb-6">
        {[{ key: "", label: "ทั้งหมด" }, { key: "pending", label: "รอตรวจ" }, { key: "approved", label: "อนุมัติ" }, { key: "rejected", label: "ปฏิเสธ" }].map((f) => (
          <a
            key={f.key}
            href={f.key ? `?status=${f.key}` : "/admin/topup"}
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
        {topups.length === 0 && <p className="p-8 text-center text-slate-500">ไม่มีรายการ</p>}
        {topups.map((t) => {
          const sc = STATUS_COLOR[t.status] || "text-slate-300 bg-navy-800 border-navy-700";
          return (
            <div key={t.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-white text-sm">{t.user.discordUsername}</p>
                  <p className="text-xs text-slate-600">
                    {format(new Date(t.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">฿{t.amount.toLocaleString()}</p>
                  <p className="text-yellow-400 text-sm">+{t.points.toLocaleString()} พ้อย</p>
                  <span className={`badge border text-xs ${sc}`}>{t.status}</span>
                </div>
              </div>

              {t.slipImage && (
                <a href={t.slipImage} target="_blank" className="text-xs text-blue-400 hover:underline mb-3 block">
                  ดูสลิป →
                </a>
              )}

              <TopupActions topup={{ id: t.id, status: t.status, userId: t.userId, points: t.points }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
