import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, ArrowRightLeft, Users, Settings, PanelLeftClose, PanelRightClose, ArrowUp, Wallet, Database, Leaf, QrCode, Gift, History } from 'lucide-react';
import LogoutButton from '../components/LogoutButton';
import PinSidebarToggle from './PinSidebarToggle';

type SidebarProps = {
  isExpanded?: boolean;
  isPinned?: boolean;
  onTogglePin: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onLogout?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, isPinned: externalIsPinned, onTogglePin: externalOnTogglePin, onMouseEnter, onMouseLeave, onLogout }) => {
  const [isPinned, setIsPinned] = useState(false);

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
    if (externalOnTogglePin) {
      externalOnTogglePin();
    }
  };

  const pinState = externalIsPinned !== undefined ? externalIsPinned : isPinned;

  return (
  <aside
    className={`fixed top-0 left-0 h-full bg-slate-900/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-all duration-300 ease-in-out z-50 ${isExpanded || pinState ? 'w-64' : 'w-20'}`}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <div className="h-16 flex items-center justify-center border-b border-white/[0.06] px-2 text-xl font-bold tracking-tighter">
      {isExpanded ? <>Cryo<span className="text-slate-400">Pay</span></> : <>C<span className="text-slate-400">P</span></>}
    </div>

    <nav className="flex-1 px-2 py-4 space-y-2">
      <NavLink to="/dashboard" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <LayoutGrid className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Dashboard</span>}
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <ArrowRightLeft className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Transactions</span>}
      </NavLink>
      <NavLink to="/buy-sell" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <ArrowUp className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Buy / Sell</span>}
      </NavLink>
      <NavLink to="/contacts" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Users className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Contacts</span>}
      </NavLink>
      <NavLink to="/wallet" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Wallet className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Wallet</span>}
      </NavLink>
      <NavLink to="/blockchain" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Database className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Blockchain</span>}
      </NavLink>
      {/* Recycle section */}
      {(isExpanded || pinState) && (
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Recycle</p>
      )}
      {!(isExpanded || pinState) && <div className="mx-4 my-2 border-t border-white/[0.06]" />}
      <NavLink to="/recycle/wallet" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Leaf className="h-5 w-5 flex-shrink-0 text-green-500" />{(isExpanded || pinState) && <span className="ml-3">GRN Wallet</span>}
      </NavLink>
      <NavLink to="/recycle/scan" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <QrCode className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Scan Bin</span>}
      </NavLink>
      <NavLink to="/recycle/history" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <History className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Recycle History</span>}
      </NavLink>
      <NavLink to="/recycle/redeem" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Gift className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Redeem</span>}
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-white/[0.06] text-emerald-400 rounded-lg' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-lg'}`}>
        <Settings className="h-5 w-5 flex-shrink-0" />{(isExpanded || pinState) && <span className="ml-3">Settings</span>}
      </NavLink>
    </nav>
    <div className="px-2 py-4 border-t border-white/[0.06]">
      <div className={`flex flex-col gap-3 ${(isExpanded || pinState) ? 'pl-4' : 'items-center'}`}>
        <PinSidebarToggle isPinned={pinState} onToggle={handleTogglePin} />
        <LogoutButton onClick={onLogout} />
      </div>
    </div>
  </aside>
);
};

export default Sidebar;
