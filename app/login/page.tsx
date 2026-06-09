"use client";
import { signIn } from "next-auth/react";
import { MessageCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card p-10 text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold text-white mb-2">
          <span className="text-blue-500">AMULET</span> SHOP
        </h1>
        <p className="text-slate-500 text-sm mb-8">เข้าสู่ระบบด้วยบัญชี Discord</p>
        <button
          onClick={() => signIn("discord", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          เข้าสู่ระบบด้วย Discord
        </button>
      </div>
    </div>
  );
}
