"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "@/components/ui/WalletConnect";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Market", href: "/market" },
  { name: "Create", href: "/create" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Events", href: "/events" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                CashHash
              </span>
            </Link>
            
            <nav className="flex space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-600 hover:text-violet-600 hover:bg-violet-50"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <WalletConnect />
        </div>
      </div>
    </div>
  );
}