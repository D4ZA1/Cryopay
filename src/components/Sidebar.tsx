import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, ArrowRightLeft, Users, Settings, LogOut, PanelLeftClose, PanelRightClose, ArrowUp, Wallet, Database } from 'lucide-react';

type SidebarProps = {
  isExpanded?: boolean;
  isPinned?: boolean;
  onTogglePin: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onLogout?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, isPinned, onTogglePin, onMouseEnter, onMouseLeave, onLogout }) => (
  <aside
    className={`fixed top-0 left-0 h-full bg-slate-900/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-all duration-300 ease-in-out z-50 ${isExpanded || isPinned ? 'w-64' : 'w-20'}`}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <div className="h-16 flex items-center border-b border-white/[0.06] px-2">
      <div className="text-2xl font-bold tracking-tighter px-4 whitespace-nowrap text-white">
        {isExpanded ? <>Cryo<span className="text-slate-400">Pay</span></> : <>C<span className="text-slate-400">P</span></>}
      </div>
    </div>
    <nav className="flex-1 px-2 py-4 space-y-2">
      <NavLink to="/dashboard" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <LayoutGrid className="h-5 w-5 flex-shrink-0" />{(isExpanded || isPinned) && <span className="ml-3">Dashboard</span>}
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <ArrowRightLeft className="h-5 w-5 flex-shrink-0" />{(isExpanded || isPinned) && <span className="ml-3">Transactions</span>}
      </NavLink>
      <NavLink to="/buy-sell" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <ArrowUp className="h-5 w-5 flex-shrink-0" />{(isExpanded || isPinned) && <span className="ml-3">Buy / Sell</span>}
      </NavLink>
      <NavLink to="/contacts" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Users className="h-5 w-5 flex-shrink-0" />{(isExpanded || isPinned) && <span className="ml-3">Contacts</span>}
      </NavLink>
      <NavLink to="/wallet" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Wallet className="h-5 w-5 flex-shrink-0" />{(isExpanded || isPinned) && <span className="ml-3">Wallet</span>}
      </NavLink>
      <NavLink to="/blockchain" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Database className="h-5 w-5 flex-shrink-0" />{(isExpanded || isPinned) && <span className="ml-3">Blockchain</span>}
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Settings className="h-5 w-5 flex-shrink-0" />{(isExpanded || isPinned) && <span className="ml-3">Settings</span>}
      </NavLink>
    </nav>
    <div className="px-2 py-4 border-t border-white/[0.06]">
      <button onClick={onTogglePin} className="w-full text-left px-4 text-slate-400 hover:text-white mb-2 flex items-center">
        {isPinned ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
        {(isExpanded || isPinned) && <span className="ml-3">{isPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}</span>}
      </button>
      <button onClick={onLogout} className="w-full text-left px-4 text-slate-400 hover:text-white flex items-center"><LogOut className="h-5 w-5" />{(isExpanded || isPinned) && <span className="ml-3">Log Out</span>}</button>
    </div>
  </aside>
);

export default Sidebar;
