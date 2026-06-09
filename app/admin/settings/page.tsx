"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import SlipTester from "./SlipTester";

interface Setting { key: string; value: string; }

const LABELS: Record<string, string> = {
  site_name: "ชื่อเว็บ",
  bank_name: "ชื่อธนาคาร",
  bank_account: "เลขบัญชี",
  bank_owner: "ชื่อเจ้าของบัญชี",
  promptpay_id: "PromptPay ID (เบอร์โทร / เลขบัตรประชาชน)",
  points_per_baht: "พ้อยต่อบาท",
  fivem_api_url: "FiveM Server URL",
  fivem_api_key: "FiveM API Key",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        const f: Record<string, string> = {};
        data.forEach((s: Setting) => (f[s.key] = s.value));
        setForm(f);
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) toast.success("บันทึกแล้ว");
    else toast.error("เกิดข้อผิดพลาด");
    setLoading(false);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">ตั้งค่า</h1>
      <form onSubmit={save} className="card p-6 space-y-4">
        {settings.map((s) => (
          <div key={s.key}>
            <label className="block text-sm text-slate-400 mb-1.5">{LABELS[s.key] || s.key}</label>
            <input
              value={form[s.key] || ""}
              onChange={(e) => setForm((f) => ({ ...f, [s.key]: e.target.value }))}
              className="input text-sm"
            />
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
      <SlipTester />
    </div>
  );
}
