import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/session-provider";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Mietealle", template: "%s | Mietealle" },
  description: "B2B Industriemaschinen-Mietmarktplatz",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body>
        <SessionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
