import Link from "next/link";
import { WalletButton } from "./wallet/WalletButton";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="text-4xl md:text-5xl lg:text-6xl">🚀</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                  Instant Liquidity
                </span>
                <br />
                <span className="text-white">
                  for Export Invoices
                </span>
                <br />
                <span className="text-2xl md:text-3xl lg:text-4xl text-slate-300">
                  — Powered by Hedera
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Tokenize export commodity invoices into NFTs + HBAR Bonds for fast, secure, and transparent financing worldwide.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <WalletButton />
              <Link 
                href="/marketplace" 
                className="px-8 py-4 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all duration-200 font-medium"
              >
                View Market
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-white">$2.5T</div>
            <div className="text-slate-400">Global trade finance gap</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-white">24h</div>
            <div className="text-slate-400">Average funding time</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-white">100%</div>
            <div className="text-slate-400">On-chain transparency</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-white">12%+</div>
            <div className="text-slate-400">Average annual yield</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            From invoice upload to investor returns in 4 simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              1
            </div>
            <h3 className="text-xl font-semibold text-white">Upload Invoice</h3>
            <p className="text-slate-400">
              Exporters upload verified commodity invoices with buyer details and payment terms
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              2
            </div>
            <h3 className="text-xl font-semibold text-white">Tokenize Asset</h3>
            <p className="text-slate-400">
              Invoice becomes an NFT + HBAR Bond, enabling fractional investment and transparent ownership
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              3
            </div>
            <h3 className="text-xl font-semibold text-white">Invest & Fund</h3>
            <p className="text-slate-400">
              Investors browse opportunities, connect HashPack wallet, and fund invoices instantly
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              4
            </div>
            <h3 className="text-xl font-semibold text-white">Automatic Settlement</h3>
            <p className="text-slate-400">
              When buyers pay, smart contracts automatically distribute returns to all investors
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Why Choose CashHash</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Revolutionary features that transform traditional trade finance
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-3">Tokenized Invoices</h3>
            <p className="text-slate-400">
              NFT + HBAR Bond structure enables fractional ownership, instant liquidity, and automated settlement
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-3">Instant Funding</h3>
            <p className="text-slate-400">
              From listing to funding in minutes, not weeks. No lengthy approval processes or paperwork
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-3">Full Transparency</h3>
            <p className="text-slate-400">
              Every transaction, payment, and event recorded on Hedera for complete audit trail
            </p>
          </div>
        </div>
      </section>
      
      {/* Yields Section */}
      <section className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Attractive Returns for Investors
              </h2>
              <p className="text-xl text-slate-300">
                Earn competitive yields by financing real-world trade transactions
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-slate-300">12-18% annual returns on commodity invoices</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-slate-300">30-90 day investment terms</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-slate-300">Diversify across multiple invoices</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-emerald-400">15.2%</div>
                <div className="text-slate-400">Average APY</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-400">45 days</div>
                <div className="text-slate-400">Avg. term length</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-400">98.5%</div>
                <div className="text-slate-400">Payment success rate</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-emerald-400">$50</div>
                <div className="text-slate-400">Minimum investment</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Guarantees Section */}
      <section className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Built for Security & Trust</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Multiple layers of protection for your investments
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Verified Buyers</h3>
            <p className="text-sm text-slate-400">All buyers undergo KYC and credit verification</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Invoice Validation</h3>
            <p className="text-sm text-slate-400">Smart contracts verify invoice authenticity</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Hedera Security</h3>
            <p className="text-sm text-slate-400">Enterprise-grade blockchain infrastructure</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Insurance Pool</h3>
            <p className="text-sm text-slate-400">Community insurance fund for added protection</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to Transform Trade Finance?
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Join exporters and investors already earning from real-world trade on Hedera
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/upload" 
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all duration-200"
              >
                Upload Invoice
              </Link>
              <Link 
                href="/marketplace" 
                className="px-8 py-4 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-200"
              >
                Browse Investments
              </Link>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                <span>No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Instant funding</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Global access</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
