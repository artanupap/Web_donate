"use client";
import { useState } from "react";
import Image from "next/image";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

export default function SlipTester() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const test = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const form = new FormData();
    form.append("slip", file);
    const res = await adminFetch("/api/admin/verify-slip-test", { method: "POST", body: form });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <div className="card p-5 mt-6">
      <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
        ทดสอบอ่านสลิป (Local QR Decode)
      </h2>

      <label className="cursor-pointer block mb-3">
        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); }
        }} />
        {preview ? (
          <div className="text-center">
            <Image src={preview} alt="slip" width={150} height={200} className="rounded-lg max-h-48 object-contain mx-auto border border-navy-700" />
            <p className="text-xs text-blue-400 mt-1">คลิกเพื่อเปลี่ยน</p>
          </div>
        ) : (
          <div className="border-2 border-dashed border-navy-700 rounded-xl p-6 text-center hover:border-blue-700 transition-colors">
            <Upload className="w-6 h-6 text-slate-600 mx-auto mb-1" />
            <p className="text-sm text-slate-500">อัปโหลดสลิปทดสอบ</p>
          </div>
        )}
      </label>

      <button onClick={test} disabled={!file || loading} className="btn-primary text-sm w-full">
        {loading ? "กำลังอ่าน..." : "ทดสอบอ่านสลิป"}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded-xl border text-sm ${result.verified ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.verified ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
            <span className={`font-semibold ${result.verified ? "text-green-300" : "text-red-300"}`}>
              {result.verified ? "อ่านสลิปสำเร็จ" : "อ่านสลิปไม่ได้"}
            </span>
          </div>
          {result.verified && (
            <div className="space-y-1 text-slate-300">
              {result.amount && <p>ยอดเงิน: <span className="text-yellow-300 font-bold">฿{result.amount.toLocaleString()}</span></p>}
              {result.transactionId && <p>Transaction ID: <span className="font-mono text-xs">{result.transactionId}</span></p>}
              {result.sendingBank && <p>ธนาคารผู้โอน: {result.sendingBank}</p>}
              {result.sender && <p>ผู้โอน: {result.sender}</p>}
              {result.date && <p>วันที่: {result.date}</p>}
            </div>
          )}
          {result.error && <p className="text-red-300 text-xs mt-1">{result.error}</p>}
          {result.rawQR && (
            <details className="mt-2">
              <summary className="text-xs text-slate-500 cursor-pointer">Raw QR data</summary>
              <p className="text-xs font-mono text-slate-600 mt-1 break-all">{result.rawQR}</p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
