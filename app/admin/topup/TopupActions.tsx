"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";

export default function TopupActions({
  topup,
}: {
  topup: { id: string; status: string; userId: string; points: number };
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  if (topup.status !== "pending") return null;

  const action = async (act: string) => {
    setLoading(act);
    try {
      const res = await fetch(`/api/admin/topup/${topup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); router.refresh(); }
      else toast.error(data.error || "เกิดข้อผิดพลาด");
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setLoading(null); }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => action("approve")}
        disabled={!!loading}
        className="flex items-center gap-1.5 text-xs bg-green-900/30 hover:bg-green-900/50 border border-green-800 text-green-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        {loading === "approve" ? "..." : "อนุมัติ"}
      </button>
      <button
        onClick={() => action("reject")}
        disabled={!!loading}
        className="flex items-center gap-1.5 text-xs bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <XCircle className="w-3.5 h-3.5" />
        {loading === "reject" ? "..." : "ปฏิเสธ"}
      </button>
    </div>
  );
}
