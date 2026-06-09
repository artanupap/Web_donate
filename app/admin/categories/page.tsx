"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

interface Category { id: string; name: string; _count?: { products: number }; }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setCats(await res.json());
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) { toast.success("เพิ่มหมวดแล้ว"); setName(""); load(); }
    else toast.error("เกิดข้อผิดพลาด");
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm("ลบหมวดนี้?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("ลบแล้ว"); load(); }
    else toast.error("เกิดข้อผิดพลาด");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">หมวดหมู่</h1>

      <form onSubmit={add} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input max-w-xs text-sm"
          placeholder="ชื่อหมวดหมู่"
        />
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> เพิ่ม
        </button>
      </form>

      <div className="card divide-y divide-navy-700">
        {cats.length === 0 && <p className="p-8 text-center text-slate-500">ยังไม่มีหมวด</p>}
        {cats.map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-white text-sm">{c.name}</p>
              {c._count && <p className="text-xs text-slate-500">{c._count.products} สินค้า</p>}
            </div>
            <button onClick={() => del(c.id)} className="p-2 hover:bg-red-900/30 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
