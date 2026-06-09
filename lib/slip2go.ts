const API_URL = "https://connect.slip2go.com";
const SECRET_KEY = process.env.SLIP2GO_SECRET_KEY || "0His9_tDKswvH8Izw2OvM+PgOvF9ehjsvm2YaoM41PA=";

export interface SlipResult {
  success: boolean;
  verified: boolean;
  amount?: number;
  senderName?: string;
  receiverName?: string;
  transactionId?: string;
  transactionDate?: string;
  rawData?: any;
  error?: string;
}

export async function verifySlip(slipFile: File | Buffer, filename?: string): Promise<SlipResult> {
  try {
    const form = new FormData();

    if (slipFile instanceof File) {
      form.append("files", slipFile, slipFile.name);
    } else {
      const blob = new Blob([slipFile.buffer as ArrayBuffer], { type: "image/jpeg" });
      form.append("files", blob, filename || "slip.jpg");
    }

    const res = await fetch(`${API_URL}/api/verify-slip/qr-code/info`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: form,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const txt = await res.text();
      return { success: false, verified: false, error: `API ${res.status}: ${txt}` };
    }

    const data = await res.json();

    // ดึงข้อมูลจาก Slip2Go response
    const slip = data?.data || data;
    const amount = slip?.amount || slip?.transferAmount || slip?.data?.amount;
    const verified = !!(amount && amount > 0);

    return {
      success: true,
      verified,
      amount: amount ? parseFloat(amount) : undefined,
      senderName: slip?.sender?.displayName || slip?.fromDisplayName || slip?.data?.senderName,
      receiverName: slip?.receiver?.displayName || slip?.toDisplayName || slip?.data?.receiverName,
      transactionId: slip?.transRef || slip?.transactionId || slip?.data?.transRef,
      transactionDate: slip?.transDtm || slip?.transactionDate || slip?.data?.transDtm,
      rawData: data,
    };
  } catch (e: any) {
    return { success: false, verified: false, error: e.message };
  }
}

export async function getAccountInfo(): Promise<any> {
  const res = await fetch(`${API_URL}/api/account/info`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}
