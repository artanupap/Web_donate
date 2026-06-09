"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Shield } from "lucide-react";

interface Admin { id: string; username: string; createdAt: string; }

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/admins");
    if (res.ok) setAdmins(await res.json());
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    if (password.length < 6) { toast.error("รหัสผ่านขั้นต่ำ 6 ตัวอักษร"); return; }
    setLoading(true);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("เพิ่มแอดมินแล้ว");
      setUsername(""); setPassword(""); load();
    } else {
      toast.error(data.error || "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };

  const del = async (id: string, name: string) => {
    if (!confirm(`ลบแอดมิน "${name}" ?`)) return;
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("ลบแล้ว"); load(); }
    else {
      const data = await res.json();
      toast.error(data.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">จัดการแอดมิน</h1>

      {/* เพิ่มแอดมิน */}
      <form onSubmit={add} className="card p-5 mb-6 space-y-3">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">เพิ่มแอดมินใหม่</h2>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="username"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="ขั้นต่ำ 6 ตัวอักษร"
            required
            minLength={6}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          {loading ? "กำลังเพิ่ม..." : "เพิ่มแอดมิน"}
        </button>
      </form>

      {/* รายชื่อแอดมิน */}
      <div className="card divide-y divide-navy-700">
        {admins.length === 0 && <p className="p-8 text-center text-slate-500">ไม่มีข้อมูล</p>}
        {admins.map((a) => (
          <div key={a.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-900/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{a.username}</p>
                <p className="text-xs text-slate-600">
                  {new Date(a.createdAt).toLocaleDateString("th-TH")}
                </p>
              </div>
            </div>
            <button
              onClick={() => del(a.id, a.username)}
              className="p-2 hover:bg-red-900/30 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
              title="ลบแอดมิน"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
