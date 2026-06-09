"use client";
import { useCart } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, Package, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, remove, updateQty, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <Package className="w-16 h-16 text-navy-700 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-400 mb-2">ตะกร้าว่าง</h2>
        <p className="text-slate-600 mb-6">เพิ่มสินค้าก่อนชำระเงิน</p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
          ไปที่ร้านค้า <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-0">
      <h1 className="text-2xl font-bold text-white mb-6">ตะกร้าสินค้า</h1>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="card p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-navy-800 rounded-lg overflow-hidden shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-navy-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{item.name}</p>
              <p className="text-blue-400 font-semibold">฿{item.price.toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-300 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-300 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="text-right min-w-[80px]">
              <p className="text-white font-semibold text-sm">
                ฿{(item.price * item.quantity).toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => remove(item.id)}
              className="p-2 hover:bg-red-900/30 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-400">รวมทั้งหมด</span>
          <span className="text-2xl font-bold text-white">฿{total().toLocaleString()}</span>
        </div>
        <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          ดำเนินการชำระเงิน <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
