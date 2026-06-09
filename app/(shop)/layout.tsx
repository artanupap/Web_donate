import Navbar from "@/components/Navbar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 md:px-6 py-5 md:py-8">{children}</main>
    </div>
  );
}
