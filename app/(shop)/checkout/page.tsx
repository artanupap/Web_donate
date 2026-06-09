"use client";
import { useSession, signIn } from "next-auth/react";
import { useCart } from "@/lib/store";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Coins, LogIn, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const user = session?.user as any;

  const totalAmount = total();
  const pointsEnough = (user?.points || 0) >= totalAmount;

  if (!session) {
    return (
      <div className="text-center py-24">
        <LogIn className="w-16 h-16 text-navy-700 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">ต้องเข้าสู่ระบบก่อน</h2>
        <button onClick={() => (window.location.href = "/login")} className="btn-primary">
          เข้าสู่ระบบด้วย Discord
        </button>
      </div>
    );
  }

  if (items.length === 0) { router.push("/cart"); return null; }

  const handleSubmit = async () => {
    if (!pointsEnough) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("items", JSON.stringify(items));
      form.append("total", String(totalAmount));
      form.append("method", "points");

      const res = await fetch("/api/orders", { method: "POST", body: form });
      const data = await res.json();

      if (res.ok) {
        clear();
        if (data.autoDelivered) {
          toast.success("ชำระสำเร็จ! ไอเท็มถูกส่งเข้าเกมแล้ว", { duration: 6000 });
        } else {
          toast.success(data.message || "สั่งซื้อสำเร็จ");
        }
        router.push("/profile?tab=orders");
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">ชำระเงิน</h1>

      {/* รายการสั่งซื้อ */}
      <div className="card p-4 mb-5">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">รายการสั่งซื้อ</h2>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm py-1.5 border-b border-navy-700 last:border-0">
            <span className="text-slate-300">{i.name} × {i.quantity}</span>
            <span className="text-white font-medium">฿{(i.price * i.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-3 text-lg">
          <span className="text-slate-400">รวมทั้งหมด</span>
          <span className="text-blue-400">฿{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* พ้อย */}
      <div className="card p-5 mb-5">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">ชำระด้วยพ้อย</h2>

        <div className="flex items-center justify-between bg-navy-800 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-slate-300 text-sm">พ้อยของคุณ</span>
          </div>
          <span className="text-yellow-300 font-bold text-lg">{(user?.points || 0).toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between bg-navy-800 rounded-xl p-4 mb-4">
          <span className="text-slate-300 text-sm">ใช้พ้อย</span>
          <span className="text-blue-300 font-bold text-lg">{totalAmount.toLocaleString()}</span>
        </div>

        {pointsEnough ? (
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-800 rounded-xl p-3 text-sm text-green-300">
            <CheckCircle className="w-4 h-4 shrink-0" />
            คงเหลือหลังซื้อ: <span className="font-bold">{((user?.points || 0) - totalAmount).toLocaleString()} พ้อย</span>
          </div>
        ) : (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-sm text-red-300 text-center">
            <p className="font-semibold mb-1">พ้อยไม่เพียงพอ</p>
            <p className="text-xs text-red-400 mb-3">
              ขาดอีก {(totalAmount - (user?.points || 0)).toLocaleString()} พ้อย
            </p>
            <Link href="/topup" className="inline-flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
              <Coins className="w-3.5 h-3.5" /> เติมพ้อยเพิ่ม
            </Link>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !pointsEnough}
        className="btn-primary w-full py-3.5 text-base font-semibold rounded-xl disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            กำลังดำเนินการ...
          </span>
        ) : `ยืนยันซื้อ (${totalAmount.toLocaleString()} พ้อย)`}
      </button>
      <p className="text-center text-xs text-slate-600 mt-3">
        ไอเท็มส่งเข้าเกมทันทีเมื่อชำระสำเร็จ
      </p>
    </div>
  );
}
