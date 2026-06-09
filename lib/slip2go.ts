import { verifySlipLocal, SlipData } from "./slipVerify";

const API_URL = "https://connect.slip2go.com";
const SECRET_KEY = process.env.SLIP2GO_SECRET_KEY || "";

export interface SlipResult {
  success: boolean;
  verified: boolean;
  amount?: number;
  transactionId?: string;
  sendingBank?: string;
  sender?: string;
  receiver?: string;
  method: "local" | "slip2go" | "failed";
  error?: string;
}

export async function verifySlip(
  imageBuffer: Buffer,
  filename?: string
): Promise<SlipResult> {
  // --- 1. ลอง verify เองก่อน (local QR decode) ---
  const local = await verifySlipLocal(imageBuffer);

  if (local.verified && local.amount) {
    return {
      success: true,
      verified: true,
      amount: local.amount,
      transactionId: local.transactionId,
      sendingBank: local.sendingBank,
      sender: local.sender,
      receiver: local.receiver,
      method: "local",
    };
  }

  // --- 2. Fallback → Slip2Go API ---
  if (!SECRET_KEY) {
    return {
      success: false,
      verified: false,
      method: "failed",
      error: local.error || "QR อ่านไม่ได้ และไม่ได้ตั้ง Slip2Go API key",
    };
  }

  try {
    const form = new FormData();
    const blob = new Blob([imageBuffer.buffer as ArrayBuffer], { type: "image/jpeg" });
    form.append("files", blob, filename || "slip.jpg");

    const res = await fetch(`${API_URL}/api/verify-slip/qr-code/info`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
      body: form,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { success: false, verified: false, method: "slip2go", error: `Slip2Go: ${res.status}` };
    }

    const data = await res.json();
    const slip = data?.data || data;
    const amount = slip?.amount || slip?.transferAmount || slip?.data?.amount;

    if (!amount) {
      return { success: false, verified: false, method: "slip2go", error: "Slip2Go: ไม่พบยอดเงิน" };
    }

    return {
      success: true,
      verified: true,
      amount: parseFloat(amount),
      transactionId: slip?.transRef || slip?.transactionId,
      sendingBank: slip?.sender?.bank,
      method: "slip2go",
    };
  } catch (e: any) {
    return {
      success: false,
      verified: false,
      method: "failed",
      error: `Slip2Go error: ${e.message}`,
    };
  }
}
