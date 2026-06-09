"use client";
import Image from "next/image";
import { useCart } from "@/lib/store";
import { ShoppingCart, Package } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  product: {
    id: string;
    name: string;
    description?: string | null;
    image?: string | null;
    price: number;
    salePrice?: number | null;
    itemName: string;
    stock: number;
    featured?: boolean;
  };
}

export default function ProductCard({ product }: Props) {
  const add = useCart((s) => s.add);
  const outOfStock = product.stock === 0;
  const displayPrice = product.salePrice ?? product.price;

  return (
    <div className="card group relative overflow-hidden hover:border-blue-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/20">
      {product.featured && (
        <span className="absolute top-2 left-2 z-10 badge bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          แนะนำ
        </span>
      )}
      {product.salePrice && (
        <span className="absolute top-2 right-2 z-10 badge bg-red-500/20 text-red-300 border border-red-500/30">
          ลดราคา
        </span>
      )}

      <div className="aspect-square bg-navy-800 overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-navy-600" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div>
            {product.salePrice ? (
              <div>
                <span className="text-xs text-slate-500 line-through mr-1">
                  ฿{product.price.toLocaleString()}
                </span>
                <span className="font-bold text-blue-400">฿{product.salePrice.toLocaleString()}</span>
              </div>
            ) : (
              <span className="font-bold text-blue-400">฿{product.price.toLocaleString()}</span>
            )}
          </div>

          <button
            disabled={outOfStock}
            onClick={() => {
              add({
                id: product.id,
                name: product.name,
                price: displayPrice,
                image: product.image || undefined,
                quantity: 1,
              });
              toast.success(`เพิ่ม ${product.name} แล้ว`);
            }}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-40"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {outOfStock ? "หมด" : "เพิ่ม"}
          </button>
        </div>
      </div>
    </div>
  );
}
