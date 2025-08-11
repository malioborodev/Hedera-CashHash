import React, { useState } from 'react';
import Navbar from './components/Layout/Navbar';
import DashboardPage from './components/Dashboard/DashboardPage';
import MarketPage from './components/Market/MarketPage';
import PortfolioPage from './components/Portfolio/PortfolioPage';
import InvoiceForm from './components/Invoice/InvoiceForm';
import InvestmentForm from './components/Investment/InvestmentForm';

// Mock user data
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountId: string;
  role: 'investor' | 'seller' | 'admin';
  isVerified: boolean;
}

const mockUser: User = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  accountId: '0.0.123456',
  role: 'investor',
  isVerified: true
};

// Mock invoice data for investment form
const mockInvoice = {
  id: '1',
  invoiceNumber: 'INV-2024-001',
  amount: 10000,
  currency: 'USD',
  seller: {
    firstName: 'Jane',
    lastName: 'Smith',
    companyName: 'TechCorp Solutions'
  },
  buyer: {
    firstName: 'Bob',
    lastName: 'Johnson',
    companyName: 'Global Enterprises'
  },
  dueDate: '2024-06-15',
  issueDate: '2024-02-15',
  description: 'Software development services',
  riskScore: 25,
  expectedReturnRate: 0.085,
  fundingProgress: 65,
  remainingAmount: 3500,
  minimumInvestment: 100,
  maximumInvestment: 5000,
  maturityDate: '2024-05-15',
  industry: 'Technology',
  paymentTerms: 'Net 30'
};

function App() {
  const [user, setUser] = useState<User | null>(mockUser);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(mockInvoice);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    // Mock login - in real app, this would call authentication API
    console.log('Login attempt:', credentials);
    setUser(mockUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleInvoiceSubmit = async (invoiceData: any) => {
    console.log('Invoice submitted:', invoiceData);
    // In real app, this would call API to create invoice
    setShowInvoiceForm(false);
    // Show success message or redirect
  };

  const handleInvestmentSubmit = async (investmentData: any) => {
    console.log('Investment submitted:', investmentData);
    // In real app, this would call API to create investment
    setShowInvestmentForm(false);
    // Show success message or redirect
  };

  const handleInvestClick = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvestmentForm(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'market':
        return <MarketPage onInvestClick={handleInvestClick} />;
      case 'portfolio':
        return <PortfolioPage />;
      case 'create-invoice':
        return (
          <div className="p-6">
            <InvoiceForm
              onSubmit={handleInvoiceSubmit}
              onCancel={() => setCurrentPage('dashboard')}
            />
          </div>
        );
      default:
        return <DashboardPage />;
    }
  };

  // If user is not logged in, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CashHash</h1>
            <p className="text-gray-600">Invoice Factoring Platform</p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleLogin({
              email: formData.get('email') as string,
              password: formData.get('password') as string
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  defaultValue="john.doe@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  defaultValue="password123"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign In
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p>Email: john.doe@example.com</p>
            <p>Password: password123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <Navbar 
        user={user} 
        onLogout={handleLogout}
        onPageChange={setCurrentPage}
        currentPage={currentPage}
      />

      {/* Page content */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Investment Form Modal */}
      {showInvestmentForm && (
        <InvestmentForm
          invoice={selectedInvoice}
          isOpen={showInvestmentForm}
          onClose={() => setShowInvestmentForm(false)}
          onSubmit={handleInvestmentSubmit}
        />
      )}

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <InvoiceForm
              onSubmit={handleInvoiceSubmit}
              onCancel={() => setShowInvoiceForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;