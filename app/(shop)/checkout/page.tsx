"use client";
import { useSession, signIn } from "next-auth/react";
import { useCart } from "@/lib/store";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { Upload, Coins, CreditCard, LogIn, CheckCircle, RefreshCw } from "lucide-react";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<"transfer" | "points">("transfer");
  const [slip, setSlip] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{ qr: string; promptpayId: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState<{ bank_name?: string; bank_account?: string; bank_owner?: string } | null>(null);
  const user = session?.user as any;

  const totalAmount = total();

  // โหลด QR + ข้อมูลธนาคาร
  useEffect(() => {
    if (method !== "transfer" || !totalAmount) return;
    loadQR();
    loadBankInfo();
  }, [method, totalAmount]);

  const loadQR = async () => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/payment/qr?amount=${totalAmount}`);
      const data = await res.json();
      if (res.ok) setQrData(data);
      else setQrData(null);
    } catch {
      setQrData(null);
    } finally {
      setQrLoading(false);
    }
  };

  const loadBankInfo = async () => {
    try {
      const res = await fetch("/api/payment/bank-info");
      if (res.ok) setBankInfo(await res.json());
    } catch {}
  };

  if (!session) {
    return (
      <div className="text-center py-24">
        <LogIn className="w-16 h-16 text-navy-700 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">ต้องเข้าสู่ระบบก่อน</h2>
        <button onClick={() => signIn("discord")} className="btn-primary">
          เข้าสู่ระบบด้วย Discord
        </button>
      </div>
    );
  }

  if (items.length === 0) { router.push("/cart"); return null; }

  const handleSubmit = async () => {
    if (method === "transfer" && !slip) {
      toast.error("กรุณาแนบสลิปการโอนเงิน");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("items", JSON.stringify(items));
      form.append("total", String(totalAmount));
      form.append("method", method);
      if (slip) form.append("slip", slip);

      const res = await fetch("/api/orders", { method: "POST", body: form });
      const data = await res.json();

      if (res.ok) {
        clear();
        if (data.autoDelivered) {
          toast.success("ยืนยันสำเร็จ! ไอเท็มถูกส่งเข้าเกมแล้ว", { duration: 6000 });
        } else {
          toast.success(data.message || "สั่งซื้อสำเร็จ รอตรวจสอบ");
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

  const pointsEnough = (user?.points || 0) >= totalAmount;

  return (
    <div className="max-w-2xl mx-auto">
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

      {/* วิธีชำระเงิน */}
      <div className="card p-4 mb-5">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">วิธีชำระเงิน</h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setMethod("transfer")}
            className={`p-3 rounded-xl border text-sm flex items-center gap-2 transition-all ${
              method === "transfer"
                ? "border-blue-600 bg-blue-900/30 text-blue-300"
                : "border-navy-700 text-slate-400 hover:border-navy-600"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            โอนเงิน / PromptPay
          </button>
          <button
            onClick={() => setMethod("points")}
            className={`p-3 rounded-xl border text-sm flex items-center gap-2 transition-all ${
              method === "points"
                ? "border-yellow-600 bg-yellow-900/20 text-yellow-300"
                : "border-navy-700 text-slate-400 hover:border-navy-600"
            }`}
          >
            <Coins className="w-4 h-4" />
            ใช้พ้อย ({(user?.points || 0).toLocaleString()})
          </button>
        </div>

        {/* ข้อมูลชำระเงิน */}
        {method === "transfer" && (
          <div className="space-y-4">
            {/* QR Code */}
            <div className="bg-navy-800 rounded-xl p-4 border border-navy-700">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">สแกน QR ชำระเงิน</p>
              <div className="flex gap-4 items-start">
                {/* QR */}
                <div className="shrink-0">
                  {qrLoading ? (
                    <div className="w-[140px] h-[140px] bg-navy-700 rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
                    </div>
                  ) : qrData?.qr ? (
                    <div className="bg-white p-2 rounded-xl">
                      <Image src={qrData.qr} alt="PromptPay QR" width={140} height={140} />
                    </div>
                  ) : (
                    <div className="w-[140px] h-[140px] bg-navy-700 rounded-xl flex flex-col items-center justify-center gap-2 text-center px-2">
                      <p className="text-xs text-slate-500">ยังไม่ได้ตั้งค่า PromptPay ID</p>
                      <p className="text-xs text-blue-400">ตั้งค่าใน Admin → Settings</p>
                    </div>
                  )}
                </div>

                {/* ข้อมูลบัญชี */}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">ธนาคาร</p>
                    <p className="text-white font-medium text-sm">{bankInfo?.bank_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">เลขบัญชี</p>
                    <p className="text-blue-300 font-mono font-bold">{bankInfo?.bank_account || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">ชื่อบัญชี</p>
                    <p className="text-white text-sm">{bankInfo?.bank_owner || "—"}</p>
                  </div>
                  <div className="pt-1 border-t border-navy-600">
                    <p className="text-xs text-slate-500 mb-0.5">ยอดที่ต้องโอน</p>
                    <p className="text-yellow-300 font-bold text-lg">฿{totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 bg-blue-900/20 border border-blue-800/50 rounded-lg p-2.5">
                <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-xs text-blue-300">โอนแล้วแนบสลิป ระบบยืนยันอัตโนมัติ ไอเท็มเข้าเกมทันที</p>
              </div>
            </div>

            {/* อัปโหลดสลิป */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-slate-400">แนบสลิปหลังโอนเงิน *</p>
                <span className="text-xs text-green-400 bg-green-900/30 border border-green-800/50 rounded-full px-2 py-0.5">
                  ยืนยันอัตโนมัติ
                </span>
              </div>
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setSlip(f); setSlipPreview(URL.createObjectURL(f)); }
                  }}
                  className="hidden"
                />
                {slipPreview ? (
                  <div className="text-center">
                    <Image src={slipPreview} alt="สลิป" width={200} height={300}
                      className="rounded-xl max-h-72 object-contain mx-auto border border-navy-700" />
                    <p className="text-xs text-blue-400 mt-2">คลิกเพื่อเปลี่ยนสลิป</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-navy-700 rounded-xl p-8 text-center hover:border-blue-700 transition-colors">
                    <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">คลิกหรือลากไฟล์สลิปมาวางที่นี่</p>
                    <p className="text-slate-600 text-xs mt-1">รองรับ JPG, PNG</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* พ้อย */}
        {method === "points" && !pointsEnough && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 text-sm text-red-300">
            พ้อยไม่เพียงพอ — มี {(user?.points || 0).toLocaleString()} / ต้องการ {totalAmount.toLocaleString()}
          </div>
        )}
        {method === "points" && pointsEnough && (
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-3 text-sm text-green-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            ใช้ {totalAmount.toLocaleString()} พ้อย — คงเหลือ {((user?.points || 0) - totalAmount).toLocaleString()} พ้อย
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || (method === "points" && !pointsEnough)}
        className="btn-primary w-full py-3.5 text-base font-semibold rounded-xl"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            กำลังตรวจสอบ...
          </span>
        ) : "ยืนยันคำสั่งซื้อ"}
      </button>
      <p className="text-center text-xs text-slate-600 mt-3">
        ระบบยืนยันสลิปอัตโนมัติ ไอเท็มส่งเข้าเกมทันทีเมื่อชำระสำเร็จ
      </p>
    </div>
  );
}
