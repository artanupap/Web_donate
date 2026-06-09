import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = process.env.ADMIN_JWT_SECRET || "admin-secret-fallback";

export function signAdminToken(adminId: string, username: string) {
  return jwt.sign({ id: adminId, username, role: "admin" }, SECRET, {
    expiresIn: "8h",
  });
}

export function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as { id: string; username: string };
  } catch {
    return null;
  }
}

export function getAdminFromRequest(req: NextRequest) {
  const token =
    req.cookies.get("admin_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyAdminToken(token);
}
