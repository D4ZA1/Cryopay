import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

const AuthenticatedLayout: React.FC = () => {
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { logout } = useAuth();

  const handleTogglePin = () => setIsSidebarPinned(!isSidebarPinned);
  const handleMouseEnter = () => !isSidebarPinned && setIsSidebarExpanded(true);
  const handleMouseLeave = () => !isSidebarPinned && setIsSidebarExpanded(false);

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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><Input placeholder="Search..." className="pl-10 w-64 bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" autoComplete="off" /></div>
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
          </div>
        </header>

        <div className="p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
