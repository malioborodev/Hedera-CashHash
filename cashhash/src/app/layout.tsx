import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
+import dynamic from "next/dynamic";

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

-import { Navbar } from "./components/Navbar";
-import { WalletProvider } from "./wallet/WalletProvider";
+import { Navbar } from "./components/Navbar";
+const WalletProviderNoSSR = dynamic(
+  () => import("./wallet/WalletProvider").then((m) => m.WalletProvider),
+  { ssr: false }
+);

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
-        <WalletProvider>
+        <WalletProviderNoSSR>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
-        </WalletProvider>
+        </WalletProviderNoSSR>
      </body>
    </html>
  );
}
