"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { adminFetch } from "@/lib/adminFetch";
import { Upload } from "lucide-react";
import Image from "next/image";

interface Category { id: string; name: string; }
interface Product {
  id?: string;
  name: string;
  description?: string | null;
  image?: string | null;
  price: number;
  salePrice?: number | null;
  itemName: string;
  itemAmount: number;
  categoryId?: string | null;
  stock: number;
  featured: boolean;
  sortOrder: number;
}

export default function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const isEdit = !!product?.id;

  const [form, setForm] = useState<Product>(
    product || {
      name: "",
      description: "",
      image: "",
      price: 0,
      salePrice: null,
      itemName: "",
      itemAmount: 1,
      categoryId: null,
      stock: -1,
      featured: false,
      sortOrder: 0,
    }
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(form.image || null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof Product, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setImageFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, String(v));
      });
      if (imageFile) fd.append("image", imageFile);

      const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await adminFetch(url, { method, body: fd });
      const data = await res.json();

      if (res.ok) {
        toast.success(isEdit ? "อัปเดตแล้ว" : "เพิ่มสินค้าแล้ว");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {/* Image */}
      <div className="card p-4">
        <label className="block text-sm text-slate-400 mb-2">รูปสินค้า</label>
        <label className="cursor-pointer block">
          <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          {preview ? (
            <div className="text-center">
              <Image src={preview} alt="preview" width={200} height={200} className="rounded-lg object-cover mx-auto max-h-48" />
              <p className="text-xs text-blue-400 mt-2">คลิกเพื่อเปลี่ยนรูป</p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-navy-700 rounded-lg p-8 text-center hover:border-blue-700 transition-colors">
              <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">คลิกเพื่ออัปโหลดรูป</p>
            </div>
          )}
        </label>
      </div>

      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1.5">ชื่อสินค้า *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" required />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1.5">คำอธิบาย</label>
            <textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="input resize-none" rows={3} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">ราคา (฿) *</label>
            <input type="number" value={form.price} onChange={(e) => set("price", parseInt(e.target.value))} className="input" required min={0} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">ราคาลด (฿)</label>
            <input type="number" value={form.salePrice || ""} onChange={(e) => set("salePrice", e.target.value ? parseInt(e.target.value) : null)} className="input" min={0} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Item Name (ox_inventory) *</label>
            <input value={form.itemName} onChange={(e) => set("itemName", e.target.value)} className="input font-mono text-sm" required placeholder="weapon_pistol" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">จำนวน Item</label>
            <input type="number" value={form.itemAmount} onChange={(e) => set("itemAmount", parseInt(e.target.value))} className="input" min={1} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">หมวดหมู่</label>
            <select value={form.categoryId || ""} onChange={(e) => set("categoryId", e.target.value || null)} className="input bg-navy-800">
              <option value="">ไม่มีหมวด</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Stock (-1 = ไม่จำกัด)</label>
            <input type="number" value={form.stock} onChange={(e) => set("stock", parseInt(e.target.value))} className="input" min={-1} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value))} className="input" min={0} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">สินค้าแนะนำ</label>
            <button
              type="button"
              onClick={() => set("featured", !form.featured)}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.featured ? "bg-blue-600" : "bg-navy-700"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.featured ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "กำลังบันทึก..." : isEdit ? "อัปเดตสินค้า" : "เพิ่มสินค้า"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">ยกเลิก</button>
      </div>
    </form>
  );
}
