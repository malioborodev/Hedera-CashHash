"use client";
import { useState } from "react";
import { TrendingUp, PlusCircle, Briefcase, Activity, HelpCircle, Users } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: Tab[] = [
  { 
    id: 'market', 
    label: 'Market', 
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Browse and invest in export invoices'
  },
  { 
    id: 'create', 
    label: 'Create Invoice', 
    icon: <PlusCircle className="w-4 h-4" />,
    description: 'Upload and tokenize your export invoices'
  },
  { 
    id: 'portfolio', 
    label: 'Portfolio', 
    icon: <Briefcase className="w-4 h-4" />,
    description: 'Track your investments and listings'
  },
  { 
    id: 'events', 
    label: 'Events', 
    icon: <Activity className="w-4 h-4" />,
    description: 'View transaction history and updates'
  },
  { 
    id: 'community', 
    label: 'Community', 
    icon: <Users className="w-4 h-4" />,
    description: 'Connect with other traders'
  },
  { 
    id: 'help', 
    label: 'Help', 
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'FAQ and support resources'
  }
];

interface HorizontalTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function HorizontalTabs({ activeTab, onTabChange }: HorizontalTabsProps) {
  return (
    <div className="sticky top-[61px] z-40 border-b border-slate-700/50 bg-slate-800/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 group relative ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5 hover:border-slate-600'
                }`}
                title={tab.description}
              >
                <span className={`transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  {tab.icon}
                </span>
                {tab.label}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 to-emerald-600/5 rounded-t-lg" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}