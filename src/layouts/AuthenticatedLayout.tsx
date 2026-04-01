import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { useAuth } from '@/context/AuthContext';

const AuthenticatedLayout: React.FC = () => {
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const location = useLocation();

  // Map route paths to page names
  const pageNameMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/transactions': 'Transactions',
    '/wallet': 'Wallet',
    '/contacts': 'Contacts',
    '/settings': 'Settings',
    '/buy-sell': 'Buy/Sell',
    '/blockchain': 'Blockchain',
  };

  // Get the current page name based on the pathname
  const getPageName = () => {
    const pathname = location.pathname;
    return pageNameMap[pathname] || 'Dashboard';
  };

  const handleTogglePin = () => setIsSidebarPinned(!isSidebarPinned);
  const handleMouseEnter = () => !isSidebarPinned && setIsSidebarExpanded(true);
  const handleMouseLeave = () => !isSidebarPinned && setIsSidebarExpanded(false);

  const handleNotificationClick = () => {
    setIsNotificationDialogOpen(true);
  };

  const closeNotificationDialog = () => {
    setIsNotificationDialogOpen(false);
  };

  // Close notification dialog after 3 seconds
  useEffect(() => {
    if (isNotificationDialogOpen) {
      const timer = setTimeout(() => {
        closeNotificationDialog();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isNotificationDialogOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        closeNotificationDialog();
      }
    };

    if (isNotificationDialogOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isNotificationDialogOpen]);

  return (
    <div className="flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Sidebar
        isExpanded={isSidebarExpanded}
        isPinned={isSidebarPinned}
        onTogglePin={handleTogglePin}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onLogout={logout}
      />

      <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${isSidebarExpanded || isSidebarPinned ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 flex items-center justify-between border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-xl px-8">
          <h1 className="text-2xl font-bold text-white">{getPageName()}</h1>
           <div className="flex items-center gap-4">
             <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><Input placeholder="Search..." className="pl-10 w-64 bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" autoComplete="off" /></div>
             <Button variant="ghost" size="icon" onClick={handleNotificationClick}><Bell className="h-5 w-5" /></Button>
           </div>
        </header>

        <div className="p-0">
          <Outlet />
        </div>

        <ScrollToTopButton />

        {isNotificationDialogOpen && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={closeNotificationDialog}
          >
            <div 
              ref={dialogRef}
              className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 w-96 max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-slate-200 text-center text-base">Looks like you don't have any notifications yet</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
