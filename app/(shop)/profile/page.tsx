import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Coins, ShoppingBag, ArrowUpCircle, User } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "รอตรวจสอบ", color: "text-yellow-300 bg-yellow-900/20 border-yellow-700/40" },
  approved: { label: "อนุมัติ", color: "text-green-300 bg-green-900/20 border-green-700/40" },
  rejected: { label: "ปฏิเสธ", color: "text-red-300 bg-red-900/20 border-red-700/40" },
  completed: { label: "สำเร็จ", color: "text-blue-300 bg-blue-900/20 border-blue-700/40" },
  delivered: { label: "ส่งแล้ว", color: "text-green-300 bg-green-900/20 border-green-700/40" },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/");

  const tab = searchParams.tab || "orders";

  const orders = tab === "orders"
    ? await prisma.order.findMany({
        where: { userId: dbUser.id },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const topups = tab === "topup"
    ? await prisma.topUpHistory.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const pointTxns = tab === "points"
    ? await prisma.pointTransaction.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile card */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        {dbUser.avatar ? (
          <Image src={dbUser.avatar} alt={dbUser.discordUsername} width={64} height={64} className="rounded-full" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-navy-800 flex items-center justify-center">
            <User className="w-8 h-8 text-slate-500" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{dbUser.discordUsername}</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 font-semibold">{dbUser.points.toLocaleString()} พ้อย</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-navy-900 border border-navy-700 p-1 rounded-xl">
        {[
          { key: "orders", label: "ประวัติคำสั่งซื้อ", icon: ShoppingBag },
          { key: "topup", label: "ประวัติเติมพ้อย", icon: ArrowUpCircle },
          { key: "points", label: "ประวัติพ้อย", icon: Coins },
        ].map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={`?tab=${key}`}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-navy-700 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:block">{label}</span>
          </a>
        ))}
      </div>

      {/* Orders */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-center text-slate-500 py-12">ยังไม่มีคำสั่งซื้อ</p>}
          {orders.map((o) => {
            const st = STATUS_LABEL[o.status] || { label: o.status, color: "text-slate-300 bg-navy-800 border-navy-700" };
            return (
              <div key={o.id} className="card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {format(new Date(o.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                    </p>
                  </div>
                  <span className={`badge border text-xs ${st.color}`}>{st.label}</span>
                </div>
                <div className="space-y-1">
                  {o.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-400">{item.itemName} x{item.quantity * item.itemAmount}</span>
                      <span className="text-slate-300">฿{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-navy-700 mt-3 pt-3 flex justify-between">
                  <span className="text-sm text-slate-500">รวม</span>
                  <span className="font-bold text-blue-400">฿{o.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Topup history */}
      {tab === "topup" && (
        <div className="space-y-3">
          {topups.length === 0 && <p className="text-center text-slate-500 py-12">ยังไม่มีประวัติเติมพ้อย</p>}
          {topups.map((t) => {
            const st = STATUS_LABEL[t.status] || { label: t.status, color: "text-slate-300 bg-navy-800 border-navy-700" };
            return (
              <div key={t.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">฿{t.amount.toLocaleString()}</p>
                  <p className="text-xs text-yellow-400">+{t.points.toLocaleString()} พ้อย</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {format(new Date(t.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                  </p>
                </div>
                <span className={`badge border text-xs ${st.color}`}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Points history */}
      {tab === "points" && (
        <div className="space-y-2">
          {pointTxns.length === 0 && <p className="text-center text-slate-500 py-12">ยังไม่มีประวัติพ้อย</p>}
          {pointTxns.map((t) => (
            <div key={t.id} className="card p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">{t.description}</p>
                <p className="text-xs text-slate-600">
                  {format(new Date(t.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                </p>
              </div>
              <span className={`font-bold text-sm ${t.type === "earn" ? "text-green-400" : "text-red-400"}`}>
                {t.type === "earn" ? "+" : ""}{t.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
