import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Amulet Shop",
  description: "ร้านค้าไอเท็ม Amulet Shop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0d1f3c",
                color: "#e2e8f0",
                border: "1px solid #112a50",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
