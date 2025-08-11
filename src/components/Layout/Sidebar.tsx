import React from 'react';
import { 
  Home, 
  TrendingUp, 
  Briefcase, 
  FileText, 
  PlusCircle,
  BarChart3,
  Settings,
  HelpCircle,
  Shield,
  CreditCard,
  Users,
  Activity
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountId: string;
  role: 'investor' | 'seller' | 'admin';
  isVerified: boolean;
}

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user: User;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, user }) => {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      roles: ['investor', 'seller', 'admin']
    },
    {
      id: 'market',
      label: 'Market',
      icon: <TrendingUp className="w-5 h-5" />,
      roles: ['investor', 'admin'],
      badge: 'New'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: <Briefcase className="w-5 h-5" />,
      roles: ['investor', 'admin']
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: <FileText className="w-5 h-5" />,
      roles: ['seller', 'admin'],
      children: [
        {
          id: 'my-invoices',
          label: 'My Invoices',
          icon: <FileText className="w-4 h-4" />,
          roles: ['seller', 'admin']
        },
        {
          id: 'create-invoice',
          label: 'Create Invoice',
          icon: <PlusCircle className="w-4 h-4" />,
          roles: ['seller', 'admin']
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['investor', 'seller', 'admin']
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <CreditCard className="w-5 h-5" />,
      roles: ['investor', 'seller', 'admin']
    }
  ];

  const adminMenuItems: MenuItem[] = [
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      id: 'system',
      label: 'System Monitor',
      icon: <Activity className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="w-5 h-5" />,
      roles: ['admin']
    }
  ];

  const bottomMenuItems: MenuItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      roles: ['investor', 'seller', 'admin']
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: <HelpCircle className="w-5 h-5" />,
      roles: ['investor', 'seller', 'admin']
    }
  ];

  const filterMenuItems = (items: MenuItem[]) => {
    return items.filter(item => item.roles.includes(user.role));
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const isActive = currentPage === item.id;
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.id}>
        <button
          onClick={() => !hasChildren && onPageChange(item.id)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          } ${
            isChild ? 'ml-4 pl-8' : ''
          }`}
        >
          <div className="flex items-center space-x-3">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              {item.badge}
            </span>
          )}
        </button>
        
        {hasChildren && (
          <div className="mt-1 space-y-1">
            {filterMenuItems(item.children!).map(child => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center px-4 py-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CashHash</h1>
            <p className="text-xs text-gray-500">Invoice Factoring</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            {user.isVerified && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                ✓ Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {filterMenuItems(menuItems).map(item => renderMenuItem(item))}
        </div>

        {/* Admin section */}
        {user.role === 'admin' && (
          <div className="pt-6">
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </h3>
            </div>
            <div className="space-y-1">
              {filterMenuItems(adminMenuItems).map(item => renderMenuItem(item))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom navigation */}
      <div className="px-4 py-4 border-t border-gray-200 space-y-1">
        {filterMenuItems(bottomMenuItems).map(item => renderMenuItem(item))}
      </div>

      {/* Account info */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <p className="font-medium">Hedera Account</p>
          <p className="font-mono text-gray-700 mt-1">{user.accountId}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;