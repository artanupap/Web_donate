"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Send } from "lucide-react";

interface Props {
  order: {
    id: string;
    status: string;
    userId: string;
    discordId: string;
    items: { itemName: string; quantity: number; itemAmount: number }[];
  };
}

export default function OrderActions({ order }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const action = async (act: string) => {
    setLoading(act);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "สำเร็จ");
        router.refresh();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setLoading(null); }
  };

  if (order.status === "delivered" || order.status === "rejected") return null;

  return (
    <div className="flex gap-2">
      {order.status === "pending" && (
        <>
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
        </>
      )}
      {order.status === "approved" && (
        <button
          onClick={() => action("deliver")}
          disabled={!!loading}
          className="flex items-center gap-1.5 text-xs bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 text-blue-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {loading === "deliver" ? "กำลังส่ง..." : "ส่งไอเท็มเข้าเกม"}
        </button>
      )}
    </div>
  );
}
