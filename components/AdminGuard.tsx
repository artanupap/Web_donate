"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") { setOk(true); return; }
    fetch("/api/admin/auth/me")
      .then((r) => {
        if (r.ok) setOk(true);
        else router.push("/admin/login");
      })
      .catch(() => router.push("/admin/login"));
  }, [pathname, router]);

  if (!ok && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }
  return <>{children}</>;
}
