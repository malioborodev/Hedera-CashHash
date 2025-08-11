import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  path: string;
}

interface AppState {
  // Tab Management
  activeTab: string;
  tabs: Tab[];
  setActiveTab: (tabId: string) => void;
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  
  // User Preferences
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  dashboardLayout: 'grid' | 'list';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDashboardLayout: (layout: 'grid' | 'list') => void;
  
  // Loading States
  isLoading: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
  
  // Error States
  errors: Record<string, string | null>;
  setError: (key: string, error: string | null) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  
  // Wallet State
  walletConnected: boolean;
  walletAddress: string | null;
  walletBalance: string | null;
  setWalletConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setWalletBalance: (balance: string | null) => void;
  
  // Bridge State
  bridgeHistory: any[];
  pendingTransactions: any[];
  addBridgeTransaction: (transaction: any) => void;
  updateBridgeTransaction: (txId: string, updates: any) => void;
  addPendingTransaction: (transaction: any) => void;
  removePendingTransaction: (txId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Tab Management
      activeTab: 'market',
      tabs: [],
      setActiveTab: (tabId) => set({ activeTab: tabId }),
      addTab: (tab) => set((state) => ({ 
        tabs: [...state.tabs.filter(t => t.id !== tab.id), tab] 
      })),
      removeTab: (tabId) => set((state) => ({ 
        tabs: state.tabs.filter(t => t.id !== tabId),
        activeTab: state.activeTab === tabId ? state.tabs[0]?.id || 'market' : state.activeTab
      })),
      updateTab: (tabId, updates) => set((state) => ({
        tabs: state.tabs.map(tab => 
          tab.id === tabId ? { ...tab, ...updates } : tab
        )
      })),
      
      // User Preferences
      theme: 'system',
      sidebarCollapsed: false,
      dashboardLayout: 'grid',
      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      
      // Loading States
      isLoading: {},
      setLoading: (key, loading) => set((state) => ({
        isLoading: { ...state.isLoading, [key]: loading }
      })),
      
      // Error States
      errors: {},
      setError: (key, error) => set((state) => ({
        errors: { ...state.errors, [key]: error }
      })),
      clearError: (key) => set((state) => {
        const { [key]: _, ...rest } = state.errors;
        return { errors: rest };
      }),
      clearAllErrors: () => set({ errors: {} }),
      
      // Wallet State
      walletConnected: false,
      walletAddress: null,
      walletBalance: null,
      setWalletConnected: (connected) => set({ walletConnected: connected }),
      setWalletAddress: (address) => set({ walletAddress: address }),
      setWalletBalance: (balance) => set({ walletBalance: balance }),
      
      // Bridge State
      bridgeHistory: [],
      pendingTransactions: [],
      addBridgeTransaction: (transaction) => set((state) => ({
        bridgeHistory: [transaction, ...state.bridgeHistory]
      })),
      updateBridgeTransaction: (txId, updates) => set((state) => ({
        bridgeHistory: state.bridgeHistory.map(tx => 
          tx.id === txId ? { ...tx, ...updates } : tx
        )
      })),
      addPendingTransaction: (transaction) => set((state) => ({
        pendingTransactions: [...state.pendingTransactions, transaction]
      })),
      removePendingTransaction: (txId) => set((state) => ({
        pendingTransactions: state.pendingTransactions.filter(tx => tx.id !== txId)
      })),
    }),
    {
      name: 'hedera-cashhash-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        dashboardLayout: state.dashboardLayout,
        activeTab: state.activeTab,
      }),
    }
  )
);

// Selectors for better performance
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useTabs = () => useAppStore((state) => state.tabs);
export const useTheme = () => useAppStore((state) => state.theme);
export const useWalletState = () => useAppStore((state) => ({
  connected: state.walletConnected,
  address: state.walletAddress,
  balance: state.walletBalance,
}));
export const useLoadingState = (key: string) => useAppStore((state) => state.isLoading[key] || false);
export const useErrorState = (key: string) => useAppStore((state) => state.errors[key] || null);