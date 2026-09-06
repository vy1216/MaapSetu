import React, { useState, useEffect, useRef } from 'react';
import { store } from '../services/store';
import { Search, Scale, FileCheck, Shield, ArrowRight, X } from 'lucide-react';
import { SealMark } from '../design-system/SealMark';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigatePublicVerify?: (certNumber?: string) => void;
  onSelectSection?: (section: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigatePublicVerify,
  onSelectSection,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const state = store.getState();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          const event = new CustomEvent('open-command-palette');
          window.dispatchEvent(event);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items
  const cleanQ = query.trim().toLowerCase();

  const certificates = state.certificates
    .filter(
      (c) =>
        c.certificate_number.toLowerCase().includes(cleanQ) ||
        c.qr_payload_url.toLowerCase().includes(cleanQ)
    )
    .slice(0, 4);

  const instruments = state.instruments
    .filter(
      (i) =>
        i.serial_number.toLowerCase().includes(cleanQ) ||
        `${i.make} ${i.model}`.toLowerCase().includes(cleanQ) ||
        i.instrument_type.toLowerCase().includes(cleanQ)
    )
    .slice(0, 4);

  const applications = state.applications
    .filter(
      (a) =>
        a.id.toLowerCase().includes(cleanQ) ||
        a.status.toLowerCase().includes(cleanQ) ||
        a.assigned_to_user_id?.toLowerCase().includes(cleanQ)
    )
    .slice(0, 4);

  const totalResults = certificates.length + instruments.length + applications.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[#0D111A]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white border border-[#E4E0D6] rounded-[10px] shadow-2xl overflow-hidden text-[#171A21]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#E4E0D6] bg-[#FAF8F3]">
          <Search className="w-4 h-4 text-[#8A8D96] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to certificate, serial number, application or case... (ESC to exit)"
            className="w-full bg-transparent text-sm font-sans placeholder-[#8A8D96] focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-[#8A8D96] hover:text-[#171A21]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="ml-2 text-[10px] font-mono text-[#8A8D96] border border-[#E4E0D6] bg-white px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto p-2 text-xs divide-y divide-[#E4E0D6]/40">
          {totalResults === 0 && query && (
            <div className="p-6 text-center text-[#8A8D96]">
              No records found matching <span className="font-mono text-[#171A21]">"{query}"</span>
            </div>
          )}

          {totalResults === 0 && !query && (
            <div className="p-4 text-center text-[#8A8D96]">
              <p className="text-xs">Type a certificate number, instrument serial, or application ID.</p>
              <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-mono">
                <span className="bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E4E0D6]">DL-01-2025</span>
                <span className="bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E4E0D6]">APP-2026</span>
                <span className="bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E4E0D6]">W-8819</span>
              </div>
            </div>
          )}

          {/* Certificates */}
          {certificates.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#A6772E] flex items-center gap-1.5">
                <SealMark size={14} color="#A6772E" />
                <span>Statutory Certificates</span>
              </div>
              {certificates.map((cert) => (
                <button
                  key={cert.id}
                  onClick={() => {
                    onNavigatePublicVerify?.(cert.certificate_number);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#FAF8F3] text-left transition-colors group"
                >
                  <div>
                    <span className="font-mono font-bold text-[#A6772E] block">
                      {cert.certificate_number}
                    </span>
                    <span className="text-[11px] text-[#5B5F6B]">
                      Issued: {cert.issue_date.split('T')[0]} • Expires: {cert.expiry_date.split('T')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 uppercase">
                      {cert.status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8A8D96] group-hover:text-[#171A21]" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Instruments */}
          {instruments.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B5F6B] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Registered Instruments</span>
              </div>
              {instruments.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => {
                    onSelectSection?.('dashboard');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#FAF8F3] text-left transition-colors group"
                >
                  <div>
                    <span className="font-medium text-[#171A21] block">
                      {inst.make} {inst.model} ({inst.instrument_type.replace('_', ' ')})
                    </span>
                    <span className="text-[11px] font-mono text-[#8A8D96]">
                      S/N: {inst.serial_number} • Capacity: {inst.capacity}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8A8D96] group-hover:text-[#171A21]" />
                </button>
              ))}
            </div>
          )}

          {/* Applications */}
          {applications.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B5F6B] flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Verification Applications</span>
              </div>
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    onSelectSection?.('lmo-queue');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#FAF8F3] text-left transition-colors group"
                >
                  <div>
                    <span className="font-mono font-bold text-[#171A21] block">{app.id}</span>
                    <span className="text-[11px] text-[#5B5F6B]">
                      Submitted: {app.submitted_at.split('T')[0]} • Type: {app.application_type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {app.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#FAF8F3] border-t border-[#E4E0D6] flex items-center justify-between text-[11px] text-[#8A8D96]">
          <div className="flex items-center gap-2">
            <span className="font-mono">MaapSetu Spotlight</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white px-1 border border-[#E4E0D6] rounded">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono bg-white px-1 border border-[#E4E0D6] rounded">↵</kbd> select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
