import { prisma } from "./prisma";

export async function deliverItemsToPlayer(
  discordId: string,
  items: { itemName: string; amount: number }[]
): Promise<{ success: boolean; message: string }> {
  const apiUrl = process.env.FIVEM_API_URL || "";
  const apiKey = process.env.FIVEM_API_KEY || "";

  if (!apiUrl) return { success: false, message: "FiveM API URL not set" };

  try {
    const res = await fetch(`${apiUrl}/fivem-shop/deliver`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ discordId, items }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      return { success: true, message: "Delivered" };
    }
    return { success: false, message: `Server returned ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
