"use client";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useCart } from "@/lib/store";
import { ShoppingCart, LogIn, LogOut, User, Coins } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const items = useCart((s) => s.items);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const user = session?.user as any;

  return (
    <nav className="sticky top-0 z-50 bg-navy-900/80 backdrop-blur border-b border-navy-700">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          <span className="text-blue-500">AMULET</span> SHOP
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <Link href="/shop" className="hover:text-white transition-colors">ร้านค้า</Link>
          {session && (
            <>
              <Link href="/topup" className="hover:text-white transition-colors">เติมพ้อย</Link>
              <Link href="/profile" className="hover:text-white transition-colors">ประวัติ</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session && user?.points !== undefined && (
            <div className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 rounded-full px-3 py-1.5 text-sm">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold text-yellow-300">{user.points?.toLocaleString()}</span>
            </div>
          )}

          <Link href="/cart" className="relative p-2 hover:bg-navy-800 rounded-lg transition-colors">
            <ShoppingCart className="w-5 h-5 text-slate-300" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </Link>

          {session ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-navy-800 rounded-full pr-3 pl-1 py-1">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || ""}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <span className="text-sm text-slate-300 hidden sm:block">{user?.name}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 hover:bg-navy-800 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("discord")}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
