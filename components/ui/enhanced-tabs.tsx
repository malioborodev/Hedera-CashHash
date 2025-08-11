"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/state/app-store";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  badge?: string | number;
}

interface EnhancedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: "default" | "pills" | "underline" | "cards";
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  className?: string;
  allowClose?: boolean;
  maxTabs?: number;
}

export function EnhancedTabs({
  tabs,
  defaultTab,
  onTabChange,
  variant = "default",
  size = "md",
  orientation = "horizontal",
  className,
  allowClose = false,
  maxTabs,
}: EnhancedTabsProps) {
  const { activeTab, setActiveTab } = useAppStore();
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const currentTab = activeTab || defaultTab || tabs[0]?.id;

  useEffect(() => {
    if (activeTabRef.current && variant === "underline") {
      const { offsetLeft, offsetWidth } = activeTabRef.current;
      setIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [currentTab, variant]);

  const handleTabClick = (tabId: string) => {
    if (tabs.find(tab => tab.id === tabId)?.disabled) return;
    
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const sizeClasses = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
  };

  const variantClasses = {
    default: {
      container: "border-b border-border",
      tab: "border-b-2 border-transparent hover:border-muted-foreground/50 data-[active=true]:border-primary data-[active=true]:text-primary",
      activeTab: "border-primary text-primary",
    },
    pills: {
      container: "bg-muted p-1 rounded-lg",
      tab: "rounded-md hover:bg-background/50 data-[active=true]:bg-background data-[active=true]:shadow-sm",
      activeTab: "bg-background shadow-sm",
    },
    underline: {
      container: "relative",
      tab: "hover:text-primary data-[active=true]:text-primary",
      activeTab: "text-primary",
    },
    cards: {
      container: "gap-2",
      tab: "border border-border rounded-lg hover:border-primary/50 data-[active=true]:border-primary data-[active=true]:bg-primary/5",
      activeTab: "border-primary bg-primary/5",
    },
  };

  const orientationClasses = {
    horizontal: "flex-row",
    vertical: "flex-col",
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={tabsRef}
        className={cn(
          "flex",
          orientationClasses[orientation],
          variantClasses[variant].container
        )}
      >
        <AnimatePresence mode="wait">
          {tabs.slice(0, maxTabs).map((tab) => {
            const isActive = currentTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => handleTabClick(tab.id)}
                disabled={tab.disabled}
                data-active={isActive}
                className={cn(
                  "relative flex items-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                  sizeClasses[size],
                  variantClasses[variant].tab,
                  isActive && variantClasses[variant].activeTab
                )}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.icon && (
                  <span className="flex-shrink-0">{tab.icon}</span>
                )}
                <span className="truncate">{tab.label}</span>
                
                {tab.badge && (
                  <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-800">
                    {tab.badge}
                  </span>
                )}
                
                {allowClose && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle close logic here
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
        
        {variant === "underline" && (
          <motion.div
            className="absolute bottom-0 h-0.5 bg-primary"
            style={indicatorStyle}
            initial={false}
            animate={indicatorStyle}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </div>
      
      {/* Tab descriptions */}
      <AnimatePresence mode="wait">
        {tabs.find(tab => tab.id === currentTab)?.description && (
          <motion.p
            key={currentTab}
            className="mt-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {tabs.find(tab => tab.id === currentTab)?.description}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing dynamic tabs
export function useDynamicTabs() {
  const { tabs, addTab, removeTab, updateTab } = useAppStore();
  
  return {
    tabs,
    addTab,
    removeTab,
    updateTab,
  };
}