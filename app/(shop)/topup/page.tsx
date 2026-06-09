"use client";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { Upload, Coins, LogIn, RefreshCw, CheckCircle } from "lucide-react";

const PACKAGES = [
  { amount: 50, points: 50 },
  { amount: 100, points: 110 },
  { amount: 200, points: 230 },
  { amount: 500, points: 600 },
  { amount: 1000, points: 1300 },
];

export default function TopupPage() {
  const { data: session } = useSession();
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{ qr: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});

  const finalAmount = selected ?? (parseInt(custom) || 0);

  useEffect(() => {
    fetch("/api/payment/bank-info").then((r) => r.json()).then(setBankInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!finalAmount || finalAmount < 10) { setQrData(null); return; }
    const t = setTimeout(loadQR, 300);
    return () => clearTimeout(t);
  }, [finalAmount]);

  const loadQR = async () => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/payment/qr?amount=${finalAmount}`);
      const data = await res.json();
      if (res.ok) setQrData(data);
      else setQrData(null);
    } catch { setQrData(null); }
    finally { setQrLoading(false); }
  };

  if (!session) {
    return (
      <div className="text-center py-24">
        <LogIn className="w-16 h-16 text-navy-700 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-4">ต้องเข้าสู่ระบบก่อน</h2>
        <button onClick={() => signIn("discord")} className="btn-primary">เข้าสู่ระบบด้วย Discord</button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!finalAmount || finalAmount < 10) { toast.error("ระบุจำนวนเงินขั้นต่ำ 10 บาท"); return; }
    if (!slip) { toast.error("กรุณาแนบสลิป"); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("amount", String(finalAmount));
      form.append("slip", slip);
      const res = await fetch("/api/topup", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        if (data.autoApproved) {
          toast.success(data.message || `เติมพ้อยสำเร็จ! +${data.points} พ้อย`, { duration: 6000 });
        } else {
          toast.success("ส่งคำขอแล้ว รอแอดมินตรวจสอบ");
        }
        setSlip(null); setSlipPreview(null); setSelected(null); setCustom("");
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">เติมพ้อย</h1>
      <p className="text-slate-500 text-sm mb-6">สแกน QR โอนเงิน แล้วแนบสลิป — ระบบยืนยันอัตโนมัติ</p>

      {/* แพ็กเกจ */}
      <div className="card p-4 mb-4">
        <h2 className="text-xs text-slate-500 uppercase tracking-wide mb-3">เลือกแพ็กเกจ</h2>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {PACKAGES.map((p) => (
            <button
              key={p.amount}
              onClick={() => { setSelected(p.amount); setCustom(""); }}
              className={`p-3 rounded-xl border text-center transition-all ${
                selected === p.amount
                  ? "border-blue-600 bg-blue-900/30"
                  : "border-navy-700 hover:border-navy-600"
              }`}
            >
              <p className="font-bold text-white text-sm">฿{p.amount}</p>
              <p className="text-xs text-yellow-400 flex items-center justify-center gap-0.5 mt-0.5">
                <Coins className="w-3 h-3" />{p.points}
              </p>
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="หรือระบุจำนวนเอง (บาท)"
          value={custom}
          onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
          className="input text-sm"
          min="10"
        />
      </div>

      {/* QR + ข้อมูลธนาคาร */}
      {finalAmount >= 10 && (
        <div className="card p-4 mb-4">
          <h2 className="text-xs text-slate-500 uppercase tracking-wide mb-3">ข้อมูลชำระเงิน</h2>
          <div className="flex gap-4 items-start">
            {/* QR */}
            <div className="shrink-0">
              {qrLoading ? (
                <div className="w-[140px] h-[140px] bg-navy-800 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
                </div>
              ) : qrData?.qr ? (
                <div className="bg-white p-2 rounded-xl">
                  <Image src={qrData.qr} alt="QR" width={140} height={140} />
                </div>
              ) : (
                <div className="w-[140px] h-[140px] bg-navy-800 rounded-xl flex items-center justify-center">
                  <p className="text-xs text-slate-500 text-center px-2">ตั้งค่า PromptPay ใน Settings</p>
                </div>
              )}
            </div>

            {/* ข้อมูลบัญชี */}
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-xs text-slate-500">ธนาคาร</p>
                <p className="text-white font-medium text-sm">{bankInfo.bank_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">เลขบัญชี</p>
                <p className="text-blue-300 font-mono font-bold">{bankInfo.bank_account || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">ชื่อบัญชี</p>
                <p className="text-white text-sm">{bankInfo.bank_owner || "—"}</p>
              </div>
              <div className="pt-1 border-t border-navy-700">
                <p className="text-xs text-slate-500">ยอดที่ต้องโอน</p>
                <p className="text-yellow-300 font-bold text-xl">฿{finalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 bg-blue-900/20 border border-blue-800/50 rounded-lg p-2.5">
            <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-300">โอนแล้วแนบสลิป — ระบบยืนยันอัตโนมัติ พ้อยเข้าทันที</p>
          </div>
        </div>
      )}

      {/* อัปโหลดสลิป */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm text-slate-400">แนบสลิปหลังโอนเงิน *</label>
          <span className="text-xs text-green-400 bg-green-900/30 border border-green-800/50 rounded-full px-2 py-0.5">ยืนยันอัตโนมัติ</span>
        </div>
        <label className="cursor-pointer block">
          <input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setSlip(f); setSlipPreview(URL.createObjectURL(f)); }
          }} className="hidden" />
          {slipPreview ? (
            <div className="text-center">
              <Image src={slipPreview} alt="สลิป" width={200} height={300} className="rounded-xl max-h-64 object-contain mx-auto border border-navy-700" />
              <p className="text-xs text-blue-400 mt-2">คลิกเพื่อเปลี่ยนสลิป</p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-navy-700 rounded-xl p-8 text-center hover:border-blue-700 transition-colors">
              <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">คลิกหรือลากไฟล์สลิปมาวางที่นี่</p>
            </div>
          )}
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !finalAmount || !slip}
        className="btn-primary w-full py-3.5 text-base font-semibold rounded-xl"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            กำลังตรวจสอบ...
          </span>
        ) : "ยืนยันการเติมพ้อย"}
      </button>
    </div>
  );
}
