import React, { useState } from 'react';
import { store } from '../services/store';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Scale,
  ClipboardCheck,
  Award,
  Search,
  Pin,
  PinOff,
} from 'lucide-react';
import { SealMark } from '../design-system/SealMark';

export interface SidebarProps {
  role: UserRole;
  currentSection: string;
  onSelectSection: (section: string) => void;
  onOpenPublicVerify: () => void;
  isPublicMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentSection,
  onSelectSection,
  onOpenPublicVerify,
  isPublicMode,
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const state = store.getState();
  const currentUser = state.currentUser;
  const jurisdiction = state.jurisdictions.find((j) => j.id === currentUser?.jurisdiction_id);

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'MS';

  const roleTitle =
    role === 'lmo'
      ? `LMO ${jurisdiction?.district_code || 'District'}`
      : role === 'gatc'
      ? 'GATC Lab'
      : role === 'owner'
      ? 'Custodian'
      : 'Regulatory Admin';

  const isExpanded = isPinned || isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-[#0D111A] text-[#F3F1EA] border-r border-[#2A3142] flex flex-col h-full shrink-0 select-none z-30 transition-all duration-200 ease-out relative ${
        isExpanded ? 'w-60 shadow-xl' : 'w-16'
      }`}
    >
      {/* Brand & Seal Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#2A3142] shrink-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <SealMark size={28} color="#A6772E" />
          {isExpanded && (
            <div className="animate-in fade-in duration-150">
              <h1 className="text-white text-sm font-semibold tracking-tight font-fraunces leading-none">
                MaapSetu
              </h1>
              <p className="text-[#9AA0AF] text-[9px] uppercase font-mono tracking-widest mt-1">
                Legal Metrology
              </p>
            </div>
          )}
        </div>
        {isExpanded && (
          <button
            onClick={() => setIsPinned(!isPinned)}
            className="p-1 text-[#9AA0AF] hover:text-white rounded transition-colors"
            title={isPinned ? 'Unpin Rail' : 'Pin Rail Expanded'}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5 text-[#A6772E]" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Navigation Desks */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {/* Role-Specific Navigation Buttons */}
        {role === 'owner' && (
          <button
            onClick={() => onSelectSection('dashboard')}
            title="My Instruments"
            className={`w-full flex items-center h-11 px-4 text-xs transition-colors text-left relative group ${
              currentSection === 'dashboard' && !isPublicMode
                ? 'bg-[#171D2B] text-white font-medium'
                : 'text-[#9AA0AF] hover:bg-[#171D2B]/50 hover:text-white'
            }`}
          >
            {/* 2px Seal Gold Active Indicator Bar on Left Edge */}
            {currentSection === 'dashboard' && !isPublicMode && (
              <span className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-[#A6772E] rounded-r" />
            )}
            <Scale className="w-5 h-5 shrink-0" />
            {isExpanded && <span className="ml-3 truncate font-medium">My Instruments</span>}
          </button>
        )}

        {role === 'lmo' && (
          <button
            onClick={() => onSelectSection('lmo-queue')}
            title="Inspection Queue"
            className={`w-full flex items-center h-11 px-4 text-xs transition-colors text-left relative group ${
              currentSection === 'lmo-queue' && !isPublicMode
                ? 'bg-[#171D2B] text-white font-medium'
                : 'text-[#9AA0AF] hover:bg-[#171D2B]/50 hover:text-white'
            }`}
          >
            {currentSection === 'lmo-queue' && !isPublicMode && (
              <span className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-[#A6772E] rounded-r" />
            )}
            <ClipboardCheck className="w-5 h-5 shrink-0" />
            {isExpanded && <span className="ml-3 truncate font-medium">LMO Inspection Desk</span>}
          </button>
        )}

        {role === 'gatc' && (
          <button
            onClick={() => onSelectSection('gatc-queue')}
            title="Calibration Queue"
            className={`w-full flex items-center h-11 px-4 text-xs transition-colors text-left relative group ${
              currentSection === 'gatc-queue' && !isPublicMode
                ? 'bg-[#171D2B] text-white font-medium'
                : 'text-[#9AA0AF] hover:bg-[#171D2B]/50 hover:text-white'
            }`}
          >
            {currentSection === 'gatc-queue' && !isPublicMode && (
              <span className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-[#A6772E] rounded-r" />
            )}
            <Award className="w-5 h-5 shrink-0" />
            {isExpanded && <span className="ml-3 truncate font-medium">Calibration Desk</span>}
          </button>
        )}

        {role === 'admin' && (
          <button
            onClick={() => onSelectSection('admin-console')}
            title="Control Center"
            className={`w-full flex items-center h-11 px-4 text-xs transition-colors text-left relative group ${
              currentSection === 'admin-console' && !isPublicMode
                ? 'bg-[#171D2B] text-white font-medium'
                : 'text-[#9AA0AF] hover:bg-[#171D2B]/50 hover:text-white'
            }`}
          >
            {currentSection === 'admin-console' && !isPublicMode && (
              <span className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-[#A6772E] rounded-r" />
            )}
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {isExpanded && <span className="ml-3 truncate font-medium">Control Center</span>}
          </button>
        )}

        {/* Public Portal Link */}
        <div className="pt-3 my-2 border-t border-[#2A3142]">
          <button
            onClick={onOpenPublicVerify}
            title="Public Verify Portal"
            className={`w-full flex items-center h-11 px-4 text-xs transition-colors text-left relative group ${
              isPublicMode
                ? 'bg-[#171D2B] text-white font-medium'
                : 'text-[#9AA0AF] hover:bg-[#171D2B]/50 hover:text-white'
            }`}
          >
            {isPublicMode && (
              <span className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-[#A6772E] rounded-r" />
            )}
            <Search className="w-5 h-5 shrink-0 text-[#A6772E]" />
            {isExpanded && <span className="ml-3 truncate font-medium">Public Verify Portal</span>}
          </button>
        </div>
      </nav>

      {/* User Profile Pill at Bottom */}
      <div className="p-3 border-t border-[#2A3142] shrink-0 bg-[#0D111A]">
        <div className="flex items-center gap-2.5 p-1.5 rounded-lg bg-[#171D2B]/60 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-[#A6772E]/20 text-[#A6772E] border border-[#A6772E]/40 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
            {initials}
          </div>
          {isExpanded && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-white truncate">{currentUser?.full_name}</p>
              <p className="text-[10px] font-mono text-[#9AA0AF] truncate capitalize">{roleTitle}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
