"use client";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, CheckCircle, FileText, Users, TrendingUp, Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-slate-900 font-bold text-xl">CashHash</span>
            </div>
            <Link
              href="/market"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6">
            Instant Liquidity for
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              {" "}Export Invoices
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Powered by Hedera Hashgraph. Transform your export invoices into tradeable assets 
            and get instant funding through decentralized finance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/market"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-medium text-lg hover:bg-slate-50 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-slate-900">$2.5T</div>
            <div className="text-slate-600">Global trade finance gap</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-slate-900">24h</div>
            <div className="text-slate-600">Average funding time</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-slate-900">100%</div>
            <div className="text-slate-600">On-chain transparency</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-slate-900">12%+</div>
            <div className="text-slate-600">Average annual yield</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
            How CashHash Works
          </h2>
          <p className="text-xl text-slate-600 text-center mb-16 max-w-3xl mx-auto">
            A revolutionary platform that bridges traditional export finance with blockchain technology
          </p>
          
          {/* Process Flow */}
          <div className="grid md:grid-cols-4 gap-8 mb-20">
            <div className="text-center relative">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <FileText className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">1. Upload Invoice</h3>
              <p className="text-slate-600">
                Exporters upload their verified export invoices to the platform
              </p>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-emerald-400/50 to-transparent -z-10"></div>
            </div>
            <div className="text-center relative">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">2. Tokenize Asset</h3>
              <p className="text-slate-600">
                Invoice is converted into an NFT with HBAR Bond backing on Hedera
              </p>
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-400/50 to-transparent -z-10"></div>
            </div>
            <div className="text-center relative">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">3. Investor Funding</h3>
              <p className="text-slate-600">
                Investors purchase bonds, providing instant liquidity to exporters
              </p>
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-purple-400/50 to-transparent -z-10"></div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">4. Auto Settlement</h3>
              <p className="text-slate-600">
                Smart contracts distribute returns when buyers pay invoices
              </p>
            </div>
          </div>

          {/* Detailed Explanation */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">For Exporters</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Instant Cash Flow</h4>
                    <p className="text-slate-600">Get up to 80% of invoice value immediately instead of waiting 30-90 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">No Credit Checks</h4>
                    <p className="text-slate-600">Funding based on invoice quality, not your credit history</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Global Access</h4>
                    <p className="text-slate-600">Access international investors through blockchain technology</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">For Investors</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Fixed Returns</h4>
                    <p className="text-slate-600">Earn 8-15% annual returns on verified export invoices</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Diversified Portfolio</h4>
                    <p className="text-slate-600">Invest across multiple commodities and countries</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Transparent Tracking</h4>
                    <p className="text-slate-600">Real-time updates on invoice status and payments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
            Built on Hedera Hashgraph
          </h2>
          <p className="text-xl text-slate-600 text-center mb-16 max-w-3xl mx-auto">
            Enterprise-grade blockchain technology ensuring security, speed, and sustainability
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white backdrop-blur rounded-xl p-8 border border-slate-200 shadow-lg text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Hedera Token Service (HTS)</h3>
              <p className="text-slate-300">
                Native tokenization of invoices into NFTs and fungible tokens for investment units
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-8 border border-white/10 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Hedera Consensus Service (HCS)</h3>
              <p className="text-slate-300">
                Immutable audit trail of all transactions and events for complete transparency
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-8 border border-white/10 text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Hedera File Service (HFS)</h3>
              <p className="text-slate-300">
                Secure, decentralized storage of invoice documents and supporting files
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Why Choose CashHash?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
              <Zap className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Instant Liquidity</h3>
              <p className="text-slate-300">
                Get funding in minutes, not months. Transform cash flow challenges into opportunities
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
              <Shield className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Bank-Grade Security</h3>
              <p className="text-slate-300">
                Built on Hedera's enterprise blockchain with institutional-level security standards
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
              <Globe className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Global Marketplace</h3>
              <p className="text-slate-300">
                Connect with investors worldwide. No geographical limitations or currency barriers
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Smart Automation</h3>
              <p className="text-slate-300">
                Automated settlements, risk assessment, and compliance through smart contracts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">$50M+</div>
              <div className="text-slate-300">Total Volume Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">500+</div>
              <div className="text-slate-300">Active Exporters</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">12%</div>
              <div className="text-slate-300">Average Annual Return</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">24h</div>
              <div className="text-slate-300">Average Funding Time</div>
            </div>
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

      {/* CTA */}
      <section className="py-20 bg-black/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Export Business?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of exporters and investors already using CashHash to revolutionize trade finance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Start Trading Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="inline-flex items-center gap-2 border border-white/20 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-white/5 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-white font-bold text-xl">CashHash</span>
              </div>
              <p className="text-slate-400">
                Revolutionizing trade finance through blockchain technology and instant liquidity solutions.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">For Exporters</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Investors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2024 CashHash. All rights reserved. Powered by Hedera Hashgraph.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
