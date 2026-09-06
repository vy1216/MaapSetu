import React, { useState } from 'react';
import { store } from '../services/store';
import {
  Bell,
  RotateCcw,
  UserCheck,
  ChevronDown,
  Search,
  Command,
} from 'lucide-react';
import { SealMark } from '../design-system/SealMark';

export interface HeaderProps {
  onOpenPublicVerify: () => void;
  isPublicMode: boolean;
  onOpenCommandPalette?: () => void;
  currentSection?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPublicVerify,
  isPublicMode,
  onOpenCommandPalette,
  currentSection = 'dashboard',
}) => {
  const state = store.getState();
  const currentUser = state.currentUser;
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Unread notifications
  const myNotifs = state.notifications.filter(
    (n) => n.user_id === currentUser?.id || currentUser?.role === 'admin'
  );
  const unreadCount = myNotifs.filter((n) => !n.is_read).length;

  const handleSelectUser = (userId: string) => {
    store.switchUser(userId);
    setShowPersonaMenu(false);
  };

  const handleReset = () => {
    if (confirm('Reset prototype database to initial synthetic seed?')) {
      store.resetToSeed();
    }
  };

  const jurisdiction = state.jurisdictions.find((j) => j.id === currentUser?.jurisdiction_id);
  const jurisdictionLabel = jurisdiction
    ? `${jurisdiction.name} (${jurisdiction.district_code})`
    : currentUser?.role === 'owner'
    ? 'State of Delhi • Commercial Desk'
    : currentUser?.role === 'gatc'
    ? 'GATC Lab Apex-01'
    : 'National Regulatory HQ';

  // Compute breadcrumb label
  const breadcrumb = isPublicMode
    ? 'Citizen Services / Public Certificate Verification'
    : currentSection === 'lmo-queue'
    ? 'Verification Desk / Field Inspection Queue'
    : currentSection === 'gatc-queue'
    ? 'Laboratory Desk / Calibration Queue'
    : currentSection === 'admin-console'
    ? 'National Administration / Allocation & Security'
    : 'Commercial Custodian / Instruments Registry';

  return (
    <header className="h-14 bg-[#FAF8F3] border-b border-[#E4E0D6] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 select-none">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="font-mono text-[11px] text-[#8A8D96] hidden md:inline">
          MaapSetu /
        </span>
        <span className="font-mono text-xs text-[#5B5F6B] font-medium truncate max-w-xs sm:max-w-md">
          {breadcrumb}
        </span>
      </div>

      {/* Right Controls: Command Palette trigger, Jurisdiction Chip, Persona Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette ⌘K Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-white border border-[#E4E0D6] text-[#5B5F6B] hover:text-[#171A21] hover:border-[#8A8D96] transition-colors text-xs shadow-2xs"
          title="Search or jump (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-[#8A8D96]" />
          <span className="hidden sm:inline font-sans text-xs">Search ledger...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-[#8A8D96] bg-[#FAF8F3] px-1 py-0.2 rounded border border-[#E4E0D6]">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Active Jurisdiction Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E4E0D6] rounded-[6px] text-[11px] font-mono text-[#5B5F6B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A6772E]" />
          <span className="truncate max-w-[170px]">{jurisdictionLabel}</span>
        </div>

        {/* Demo Persona Switcher (For Evaluators & Judges) */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 px-2.5 py-1 bg-white hover:bg-[#FAF8F3] border border-[#E4E0D6] rounded-[6px] text-xs transition-colors shadow-2xs"
          >
            <SealMark size={14} color="#A6772E" />
            <span className="font-medium text-[#171A21] text-xs hidden sm:inline truncate max-w-[120px]">
              {currentUser?.full_name}
            </span>
            <span className="text-[10px] font-mono uppercase text-[#A6772E] font-bold bg-[#A6772E]/10 px-1 py-0.2 rounded">
              {currentUser?.role}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8A8D96]" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-[10px] shadow-lg border border-[#E4E0D6] text-[#171A21] py-2 z-50 text-xs">
              <div className="px-3 py-2 font-mono uppercase tracking-wider text-[10px] text-[#8A8D96] border-b border-[#E4E0D6] bg-[#FAF8F3]">
                Switch Test Persona (Judge / Evaluator)
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#E4E0D6]/40">
                {state.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-[#FAF8F3] transition-colors flex items-center justify-between ${
                      u.id === currentUser?.id ? 'bg-[#FAF8F3] font-semibold' : ''
                    }`}
                  >
                    <div>
                      <span className="block font-medium text-[#171A21]">{u.full_name}</span>
                      <span className="text-[11px] font-mono text-[#8A8D96]">
                        {u.email} {u.jurisdiction_id ? `• ${u.jurisdiction_id}` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-[#171A21] border border-[#E4E0D6]">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-1.5 rounded-[6px] bg-white hover:bg-[#FAF8F3] border border-[#E4E0D6] text-[#5B5F6B] relative transition-colors shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#C4291C] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-[10px] shadow-lg border border-[#E4E0D6] text-[#171A21] py-2 z-50 text-xs">
              <div className="px-4 py-2 font-mono uppercase tracking-wider text-[10px] text-[#8A8D96] border-b border-[#E4E0D6] bg-[#FAF8F3] flex items-center justify-between">
                <span>Alerts Ledger</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      myNotifs.forEach((n) => (n.is_read = true));
                      store.getState();
                      setShowNotifMenu(false);
                    }}
                    className="text-[10px] text-[#A6772E] font-medium hover:underline normal-case"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#E4E0D6]/40">
                {myNotifs.length === 0 ? (
                  <div className="p-4 text-center text-[#8A8D96]">No alerts in ledger</div>
                ) : (
                  myNotifs.map((n) => (
                    <div key={n.id} className={`p-3 ${!n.is_read ? 'bg-[#FAF8F3]' : ''}`}>
                      <h4 className="font-semibold text-[#171A21] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A6772E]" />
                        {n.title}
                      </h4>
                      <p className="text-xs text-[#5B5F6B] mt-0.5">{n.message}</p>
                      <span className="text-[10px] font-mono text-[#8A8D96] block mt-1">
                        {n.created_at.split('T')[0]}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Database Seed Reset */}
        <button
          onClick={handleReset}
          title="Reset prototype ledger to initial seed"
          className="p-1.5 rounded-[6px] bg-white hover:bg-[#FAF8F3] border border-[#E4E0D6] text-[#8A8D96] hover:text-[#171A21] transition-colors shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
