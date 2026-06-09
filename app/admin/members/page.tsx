import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { User } from "lucide-react";
import AddPointsButton from "./AddPointsButton";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const users = await prisma.user.findMany({
    where: searchParams.q
      ? { discordUsername: { contains: searchParams.q } }
      : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { orders: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">สมาชิก</h1>

      <form className="flex gap-2 mb-6">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="ค้นหาชื่อ Discord..."
          className="input max-w-xs text-sm"
        />
        <button type="submit" className="btn-primary text-sm">ค้นหา</button>
      </form>

      <div className="card divide-y divide-navy-700">
        {users.length === 0 && (
          <p className="p-8 text-center text-slate-500">ไม่พบสมาชิก</p>
        )}
        {users.map((u) => (
          <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-navy-800/40 transition-colors">
            <div className="shrink-0">
              {u.avatar ? (
                <Image
                  src={u.avatar}
                  alt={u.discordUsername}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm">{u.discordUsername}</p>
              <p className="text-xs text-slate-500 font-mono">{u.discordId}</p>
              <p className="text-xs text-slate-600 mt-0.5">สั่งซื้อ {u._count.orders} ครั้ง</p>
            </div>

            <div className="text-right mr-4">
              <p className="text-yellow-400 font-bold">{u.points.toLocaleString()}</p>
              <p className="text-xs text-slate-500">พ้อย</p>
            </div>

            <AddPointsButton userId={u.id} username={u.discordUsername} currentPoints={u.points} />
          </div>
        ))}
      </div>
    </div>
  );
}
