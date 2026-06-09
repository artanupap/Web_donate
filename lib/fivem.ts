import { prisma } from "./prisma";

export async function deliverItemsToPlayer(
  discordId: string,
  orderId: string,
  items: { itemName: string; amount: number }[]
): Promise<{ success: boolean; queued: boolean; message: string }> {
  const apiUrl = process.env.FIVEM_API_URL || "";
  const apiKey = process.env.FIVEM_API_KEY || "";

  // ลอง deliver ตรงก่อน
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/fivem-shop/deliver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ discordId, items }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.queued) {
          // FiveM บอกว่า player ออฟไลน์ — save queue ฝั่งเว็บด้วย
          await saveQueue(discordId, orderId, items);
          return { success: true, queued: true, message: "Player ออฟไลน์ บันทึก queue แล้ว" };
        }
        return { success: true, queued: false, message: "ส่งไอเท็มสำเร็จ" };
      }
    } catch {
      // FiveM server ไม่ตอบ — save queue
    }
  }

  // Save queue ไว้รอ player join
  await saveQueue(discordId, orderId, items);
  return { success: true, queued: true, message: "บันทึก queue แล้ว ส่งเมื่อ player เข้าเกม" };
}

async function saveQueue(
  discordId: string,
  orderId: string,
  items: { itemName: string; amount: number }[]
) {
  // เช็คว่า queue นี้ยังไม่มี (กัน duplicate)
  const existing = await prisma.pendingDelivery.count({
    where: { orderId, delivered: false },
  });
  if (existing > 0) return;

  await prisma.pendingDelivery.createMany({
    data: items.map((i) => ({
      discordId,
      orderId,
      itemName: i.itemName,
      amount: i.amount,
    })),
  });
}
