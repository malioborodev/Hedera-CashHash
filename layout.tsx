import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { Navbar } from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CashHash",
  description: "Receivable financing on Hedera",
};

const WalletProviderNoSSR = dynamic(
  () => import("./wallet/WalletProvider").then((m) => m.WalletProvider),
  { ssr: false }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gradient-to-br from-[#0b0f19] to-[#111827] text-white min-h-screen`}
      >
        <WalletProviderNoSSR>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </WalletProviderNoSSR>
      </body>
    </html>
  );
}
