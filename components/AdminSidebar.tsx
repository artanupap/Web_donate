"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Package, ShoppingBag, ArrowUpCircle,
  Settings, LogOut, Tag, Users, Shield, Menu, X,
} from "lucide-react";
import toast from "react-hot-toast";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "สินค้า", icon: Package },
  { href: "/admin/categories", label: "หมวดหมู่", icon: Tag },
  { href: "/admin/members", label: "สมาชิก", icon: Users },
  { href: "/admin/orders", label: "คำสั่งซื้อ", icon: ShoppingBag },
  { href: "/admin/topup", label: "เติมพ้อย", icon: ArrowUpCircle },
  { href: "/admin/admins", label: "แอดมิน", icon: Shield },
  { href: "/admin/settings", label: "ตั้งค่า", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    toast.success("ออกจากระบบแล้ว");
    router.push("/admin/login");
  };

  const NavLinks = () => (
    <>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname.startsWith(href)
                ? "bg-blue-900/40 text-blue-300"
                : "text-slate-400 hover:bg-navy-800 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-navy-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 bg-navy-900 border-r border-navy-700 flex-col shrink-0">
        <div className="p-4 border-b border-navy-700">
          <p className="font-bold text-white text-sm">
            <span className="text-blue-500">AMULET</span> Admin
          </p>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-navy-900 border-b border-navy-700 h-14 flex items-center px-4 justify-between">
        <p className="font-bold text-white text-sm">
          <span className="text-blue-500">AMULET</span> Admin
        </p>
        <button onClick={() => setOpen(!open)} className="p-2 text-slate-300">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 top-14">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-56 h-full bg-navy-900 border-r border-navy-700 flex flex-col">
            <NavLinks />
          </div>
        </div>
      )}
    </>
  );
}
