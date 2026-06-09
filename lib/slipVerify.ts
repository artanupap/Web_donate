import sharp from "sharp";
import jsQR from "jsqr";

export interface SlipData {
  verified: boolean;
  amount?: number;
  transactionId?: string;
  sendingBank?: string;
  receivingBank?: string;
  sender?: string;
  receiver?: string;
  date?: string;
  rawQR?: string;
  error?: string;
}

// ธนาคารไทย (รหัส SWIFT / BIC)
const BANK_NAMES: Record<string, string> = {
  "004": "กสิกรไทย",
  "006": "กรุงไทย",
  "002": "กรุงเทพ",
  "011": "TMBThanachart",
  "014": "ไทยพาณิชย์",
  "025": "กรุงศรีอยุธยา",
  "069": "เกียรตินาคินภัทร",
  "022": "ซีไอเอ็มบีไทย",
  "067": "ทิสโก้",
  "073": "ไทยเครดิต",
  "024": "ยูโอบี",
  "071": "ออมสิน",
  "034": "ธ.ก.ส.",
  "033": "อาคารสงเคราะห์",
  KBANK: "กสิกรไทย",
  KTB: "กรุงไทย",
  BBL: "กรุงเทพ",
  TTB: "TMBThanachart",
  SCB: "ไทยพาณิชย์",
  BAY: "กรุงศรีอยุธยา",
  KKP: "เกียรตินาคินภัทร",
  CIMBT: "ซีไอเอ็มบีไทย",
  TISCO: "ทิสโก้",
  GSB: "ออมสิน",
  BAAC: "ธ.ก.ส.",
};

// Parse EMV QR TLV (Tag-Length-Value)
function parseEMV(qr: string): Record<string, string> {
  const result: Record<string, string> = {};
  let i = 0;
  while (i < qr.length) {
    const tag = qr.substring(i, i + 2);
    const len = parseInt(qr.substring(i + 2, i + 4), 10);
    if (isNaN(len)) break;
    const value = qr.substring(i + 4, i + 4 + len);
    result[tag] = value;
    i += 4 + len;
  }
  return result;
}

// Parse nested EMV
function parseNestedEMV(value: string): Record<string, string> {
  return parseEMV(value);
}

export async function verifySlipLocal(imageBuffer: Buffer): Promise<SlipData> {
  try {
    // แปลงรูปเป็น raw pixels ด้วย sharp
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelData = new Uint8ClampedArray(data);

    // อ่าน QR code
    const code = jsQR(pixelData, info.width, info.height, {
      inversionAttempts: "dontInvert",
    });

    if (!code) {
      // ลอง invert สีด้วย
      const code2 = jsQR(pixelData, info.width, info.height, {
        inversionAttempts: "onlyInvert",
      });
      if (!code2) {
        return { verified: false, error: "ไม่พบ QR code ในสลิป" };
      }
      return extractSlipData(code2.data);
    }

    return extractSlipData(code.data);
  } catch (e: any) {
    return { verified: false, error: `อ่านรูปไม่ได้: ${e.message}` };
  }
}

function extractSlipData(qrRaw: string): SlipData {
  try {
    const emv = parseEMV(qrRaw);

    // สลิปโอนเงินไทย — มักอยู่ใน tag 30 ขึ้นไป
    // PromptPay transaction slip format
    let amount: number | undefined;
    let transactionId: string | undefined;
    let sendingBank: string | undefined;
    let receivingBank: string | undefined;
    let sender: string | undefined;
    let receiver: string | undefined;
    let date: string | undefined;

    // Tag 54 = Amount
    if (emv["54"]) {
      amount = parseFloat(emv["54"]);
    }

    // Tag 62 = Additional data field
    if (emv["62"]) {
      const sub = parseNestedEMV(emv["62"]);
      transactionId = sub["05"] || sub["01"] || undefined;
    }

    // Tags 30-51 = Merchant account info (บางธนาคารใช้ต่างกัน)
    for (let t = 30; t <= 51; t++) {
      const tag = t.toString().padStart(2, "0");
      if (emv[tag]) {
        const sub = parseNestedEMV(emv[tag]);
        // Tag 00 ใน sub = GUID/App ID มักมีชื่อธนาคาร
        const appId = sub["00"] || "";
        if (appId.includes("SCB")) sendingBank = "ไทยพาณิชย์";
        else if (appId.includes("KBANK")) sendingBank = "กสิกรไทย";
        else if (appId.includes("KTB")) sendingBank = "กรุงไทย";
        else if (appId.includes("BBL")) sendingBank = "กรุงเทพ";
        else if (appId.includes("BAY")) sendingBank = "กรุงศรีอยุธยา";
        else if (appId.includes("TTB")) sendingBank = "TMBThanachart";
        break;
      }
    }

    // ลอง parse ถ้าเป็น JSON format (บางธนาคาร)
    if (!amount && qrRaw.startsWith("{")) {
      try {
        const json = JSON.parse(qrRaw);
        amount = json.amount || json.transAmt || json.transferAmount;
        transactionId = json.transRef || json.ref || json.txnId;
        sendingBank = json.sendingBank || json.fromBank;
        receivingBank = json.receivingBank || json.toBank;
        sender = json.senderName || json.fromName;
        receiver = json.receiverName || json.toName;
        date = json.transDate || json.txnDate;
      } catch {}
    }

    // ลอง parse แบบ key=value (บางธนาคาร)
    if (!amount && qrRaw.includes("amount=")) {
      const params = new URLSearchParams(qrRaw.replace(/&amp;/g, "&"));
      amount = parseFloat(params.get("amount") || "0") || undefined;
      transactionId = params.get("ref") || params.get("transRef") || undefined;
    }

    const verified = !!(amount && amount > 0);

    return {
      verified,
      amount,
      transactionId,
      sendingBank,
      receivingBank,
      sender,
      receiver,
      date,
      rawQR: qrRaw.substring(0, 200), // เก็บแค่ 200 ตัวแรก
    };
  } catch (e: any) {
    return { verified: false, rawQR: qrRaw, error: `Parse ไม่ได้: ${e.message}` };
  }
}
