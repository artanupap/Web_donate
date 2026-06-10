"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PlusCircle, X } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

export default function AddPointsButton({
  userId,
  username,
  currentPoints,
}: {
  userId: string;
  username: string;
  currentPoints: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    const pts = parseInt(amount);
    if (!pts || pts === 0) { toast.error("ระบุจำนวนพ้อย"); return; }

    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/members/${userId}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: pts, reason: reason || "แอดมินเพิ่มพ้อย" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setOpen(false);
        setAmount("");
        setReason("");
        router.refresh();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 text-blue-300 px-3 py-1.5 rounded-lg transition-colors"
      >
        <PlusCircle className="w-3.5 h-3.5" />
        เพิ่มพ้อย
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">เพิ่มพ้อยให้ {username}</h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-navy-700 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              พ้อยปัจจุบัน: <span className="text-yellow-400 font-bold">{currentPoints.toLocaleString()}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  จำนวนพ้อย <span className="text-slate-500 text-xs">(ใส่ลบ - เพื่อหักพ้อย)</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input"
                  placeholder="เช่น 100 หรือ -50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">หมายเหตุ</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                  placeholder="เช่น โบนัสพิเศษ, แก้ไขระบบ"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={submit} disabled={loading} className="btn-primary flex-1">
                {loading ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
              <button onClick={() => setOpen(false)} className="btn-ghost">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
