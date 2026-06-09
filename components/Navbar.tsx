"use client";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useCart } from "@/lib/store";
import { ShoppingCart, LogIn, LogOut, User, Coins, Menu, X, Store, ArrowUpCircle, History } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const items = useCart((s) => s.items);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const user = session?.user as any;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-navy-900/90 backdrop-blur border-b border-navy-700">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-lg font-bold text-white tracking-tight shrink-0">
            <span className="text-blue-500">AMULET</span> SHOP
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5 text-sm text-slate-400">
            <Link href="/shop" className="hover:text-white transition-colors">ร้านค้า</Link>
            {session && (
              <>
                <Link href="/topup" className="hover:text-white transition-colors">เติมพ้อย</Link>
                <Link href="/profile" className="hover:text-white transition-colors">ประวัติ</Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {session && user?.points !== undefined && (
              <div className="flex items-center gap-1 bg-navy-800 border border-navy-700 rounded-full px-2.5 py-1 text-sm">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="font-semibold text-yellow-300 text-xs">{user.points?.toLocaleString()}</span>
              </div>
            )}

            <Link href="/cart" className="relative p-2 hover:bg-navy-800 rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 text-slate-300" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                  {count}
                </span>
              )}
            </Link>

            {/* Desktop user */}
            {session ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 bg-navy-800 rounded-full pr-3 pl-1 py-1">
                  {user?.image ? (
                    <Image src={user.image} alt="" width={26} height={26} className="rounded-full" />
                  ) : (
                    <div className="w-6.5 h-6.5 rounded-full bg-navy-700 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                  <span className="text-xs text-slate-300 max-w-[80px] truncate">{user?.name}</span>
                </div>
                <button onClick={() => signOut()} className="p-2 hover:bg-navy-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => signIn("discord")} className="hidden md:flex btn-primary items-center gap-1.5 text-sm py-1.5">
                <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 hover:bg-navy-800 rounded-lg text-slate-300 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 top-14">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-navy-900 border-b border-navy-700 p-4 space-y-1">
            {session && (
              <div className="flex items-center gap-3 p-3 mb-3 bg-navy-800 rounded-xl">
                {user?.image ? (
                  <Image src={user.image} alt="" width={36} height={36} className="rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-300">{user?.points?.toLocaleString()} พ้อย</span>
                  </div>
                </div>
              </div>
            )}

            {[
              { href: "/shop", label: "ร้านค้า", icon: Store },
              ...(session ? [
                { href: "/topup", label: "เติมพ้อย", icon: ArrowUpCircle },
                { href: "/profile", label: "ประวัติ", icon: History },
              ] : []),
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-navy-800 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}

            <div className="pt-2 border-t border-navy-700 mt-2">
              {session ? (
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-900/20 w-full transition-colors"
                >
                  <LogOut className="w-5 h-5" /> ออกจากระบบ
                </button>
              ) : (
                <button
                  onClick={() => { signIn("discord"); setMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-3 rounded-xl transition-colors"
                >
                  <LogIn className="w-4 h-4" /> เข้าสู่ระบบด้วย Discord
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
