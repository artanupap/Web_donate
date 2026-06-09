"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProductToggle({ id, active }: { id: string; active: boolean }) {
  const [val, setVal] = useState(active);
  const router = useRouter();

  const toggle = async () => {
    const next = !val;
    setVal(next);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    if (res.ok) { router.refresh(); }
    else { setVal(!next); toast.error("เกิดข้อผิดพลาด"); }
  };

  return (
    <button
      onClick={toggle}
      className={`relative w-10 h-5 rounded-full transition-colors ${val ? "bg-blue-600" : "bg-navy-700"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          val ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
