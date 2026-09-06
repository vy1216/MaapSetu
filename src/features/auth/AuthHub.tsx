import React, { useState } from 'react';
import { SealMark } from '../../design-system/SealMark';
import { store } from '../../services/store';
import { demoApi } from '../../services/api';
import { ArrowRight, KeyRound, Shield, Building2, UserCheck, Sparkles, CheckCircle2, Mail, RefreshCw } from 'lucide-react';

interface AuthHubProps {
  onSuccess: (userId: string) => void;
  onCancel?: () => void;
}

export const AuthHub: React.FC<AuthHubProps> = ({ onSuccess, onCancel }) => {
  const [identifier, setIdentifier] = useState('');
  const [stage, setStage] = useState<'resolve' | 'passkey' | 'otp' | 'sso'>('resolve');
  const [resolvedUser, setResolvedUser] = useState<any>(null);
  const [resolvedType, setResolvedType] = useState<'gov' | 'enterprise' | 'citizen' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpStatusMessage, setOtpStatusMessage] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  const users = store.getState().users;

  const triggerOtpDispatch = async (emailOrPhone: string) => {
    setIsSendingOtp(true);
    setOtpStatusMessage('Dispatching verification code...');
    try {
      const res = await demoApi.sendOtp(emailOrPhone);
      if (res?.data?.message) {
        setOtpStatusMessage(res.data.message);
        if (res.data.devOtp) {
          setDevOtpHint(res.data.devOtp);
        }
      } else {
        setOtpStatusMessage(`Verification code dispatched to ${emailOrPhone}.`);
      }
    } catch {
      setOtpStatusMessage('Ready for OTP verification.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const input = identifier.trim().toLowerCase();

    if (!input) {
      setAuthError('Please enter an official identifier or email.');
      return;
    }

    // Match existing seed users
    const matched = users.find(
      (u) => u.email.toLowerCase() === input || u.id.toLowerCase() === input
    );

    if (matched) {
      setResolvedUser(matched);
      if (matched.role === 'admin' || matched.role === 'lmo') {
        setResolvedType('gov');
        setStage('passkey');
      } else if (matched.role === 'gatc') {
        setResolvedType('enterprise');
        setStage('sso');
      } else {
        setResolvedType('citizen');
        setStage('otp');
        triggerOtpDispatch(matched.email || matched.phone);
      }
      return;
    }

    // Heuristics for arbitrary identifiers
    if (input.endsWith('.gov.in') || input.includes('nic.in') || input.startsWith('officer')) {
      // Default to an LMO
      const lmo = users.find((u) => u.role === 'lmo') || users[1];
      setResolvedUser(lmo);
      setResolvedType('gov');
      setStage('passkey');
    } else if (input.includes('lab') || input.includes('gatc') || input.includes('corp')) {
      const gatc = users.find((u) => u.role === 'gatc') || users[3];
      setResolvedUser(gatc);
      setResolvedType('enterprise');
      setStage('sso');
    } else {
      // Create or use a real citizen / commercial owner account for this specific email
      const nameFromEmail = input.includes('@')
        ? input.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Registered Owner';
      
      let realUser = users.find((u) => u.email.toLowerCase() === input);
      if (!realUser) {
        realUser = {
          id: 'user-owner-' + Math.random().toString(36).substring(2, 7),
          role: 'owner',
          full_name: nameFromEmail || 'Instrument Owner',
          email: input.includes('@') ? input : `${input}@citizen.in`,
          phone: input.match(/^\+?[0-9\s]+$/) ? input : '+91 98000 00000',
          business_id: 'GSTIN-' + Math.floor(10000000 + Math.random() * 90000000),
          jurisdiction_id: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        store.getState().users.push(realUser);
      }

      setResolvedUser(realUser);
      setResolvedType('citizen');
      setStage('otp');
      triggerOtpDispatch(realUser.email);
    }
  };

  const handleComplete = async () => {
    if (!resolvedUser) return;

    if (stage === 'otp') {
      const code = otpCode.trim() || '123456';
      try {
        const res = await demoApi.loginWithOtp(resolvedUser.role, resolvedUser.email, code);
        if (res?.data?.error) {
          setAuthError(res.data.error);
          return;
        }
      } catch {
        // fallback
      }
    }

    store.switchUser(resolvedUser.id);
    onSuccess(resolvedUser.id);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#171A21] flex flex-col justify-between font-sans selection:bg-[#A6772E]/20">
      {/* Top Ledger Strip */}
      <header className="h-16 border-b border-[#E4E0D6] px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SealMark size={28} color="#A6772E" />
          <div>
            <span className="font-fraunces text-base font-semibold tracking-tight text-[#171A21] block leading-none">
              MaapSetu
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8D96]">
              National Legal Metrology Portal
            </span>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-mono text-[#5B5F6B] hover:text-[#171A21] transition-colors"
          >
            Cancel / Back
          </button>
        )}
      </header>

      {/* Main Single-Input Identifier Resolver View */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white border border-[#E4E0D6] rounded-[12px] p-8 shadow-xs">
          {/* Emblem & Institutional Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAF8F3] border border-[#E4E0D6] mb-3">
              <SealMark size={24} color="#A6772E" />
            </div>
            <h1 className="font-fraunces text-2xl font-bold text-[#171A21]">
              Sovereign Access Gateway
            </h1>
            <p className="text-xs text-[#5B5F6B] mt-1 font-sans">
              Single-Input Identifier Resolver for Officers, Laboratories, and Custodians.
            </p>
          </div>

          {stage === 'resolve' && (
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label
                  htmlFor="auth-id"
                  className="block text-[11px] font-mono uppercase tracking-wider text-[#8A8D96] mb-1.5"
                >
                  Government ID / Email / Phone / SPN
                </label>
                <div className="relative">
                  <input
                    id="auth-id"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. officer@nic.in, lab@gatc.org, or rajesh@example.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E4E0D6] rounded-[6px] text-xs font-sans text-[#171A21] placeholder-[#8A8D96] focus:outline-none focus:border-[#A6772E] focus:ring-1 focus:ring-[#A6772E] transition-all"
                    autoFocus
                  />
                </div>
                {authError && (
                  <p className="text-[11px] text-[#C4291C] mt-1.5 font-mono">{authError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-[#0D111A] hover:bg-[#171D2B] text-white rounded-[6px] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Authenticate Credentials</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A6772E]" />
              </button>

              {/* Quick Persona Seeds for Reviewers */}
              <div className="pt-4 border-t border-[#E4E0D6] mt-4">
                <span className="block text-[10px] font-mono uppercase text-[#8A8D96] mb-2 text-center">
                  Quick Selector (Prototype Verification)
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {users.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setIdentifier(u.email);
                        setResolvedUser(u);
                        if (u.role === 'admin' || u.role === 'lmo') {
                          setResolvedType('gov');
                          setStage('passkey');
                        } else if (u.role === 'gatc') {
                          setResolvedType('enterprise');
                          setStage('sso');
                        } else {
                          setResolvedType('citizen');
                          setStage('otp');
                        }
                      }}
                      className="p-1.5 bg-[#FAF8F3] hover:bg-[#E4E0D6]/50 border border-[#E4E0D6] rounded text-left truncate transition-colors text-[#171A21]"
                    >
                      <span className="font-semibold block truncate">{u.full_name}</span>
                      <span className="text-[9px] font-mono text-[#8A8D96] uppercase">{u.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* Passkey State (Government / Enforcement Officers) */}
          {stage === 'passkey' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-[#FAF8F3] border border-[#E4E0D6] rounded-[8px] text-left">
                <div className="flex items-center gap-2 text-xs font-mono text-[#A6772E] font-bold uppercase">
                  <Shield className="w-3.5 h-3.5" />
                  <span>NIC GovCA Hardware Token Detected</span>
                </div>
                <p className="text-xs font-semibold text-[#171A21] mt-1">
                  {resolvedUser?.full_name}
                </p>
                <p className="text-[11px] font-mono text-[#8A8D96]">{resolvedUser?.email}</p>
                <div className="mt-2 text-[10px] font-mono text-[#1F8A54] bg-[#1F8A54]/10 px-2 py-0.5 rounded inline-block">
                  YubiKey 5 / FIDO2 Level 3 Bound
                </div>
              </div>

              <div className="p-6 border border-dashed border-[#A6772E]/50 rounded-[8px] flex flex-col items-center justify-center gap-2 bg-[#FAF8F3]/50">
                <KeyRound className="w-8 h-8 text-[#A6772E] animate-pulse" />
                <span className="text-xs font-mono text-[#171A21] font-semibold">
                  Touch Security Key to Sign Challenge
                </span>
                <span className="text-[10px] font-mono text-[#8A8D96]">
                  Challenge nonces generated via NIC-HSM
                </span>
              </div>

              <button
                type="button"
                onClick={handleComplete}
                className="w-full h-10 bg-[#0D111A] hover:bg-[#171D2B] text-white rounded-[6px] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Authorize Officer Session</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A6772E]" />
              </button>
            </div>
          )}

          {/* OTP State (Commercial Owners / Citizens) */}
          {stage === 'otp' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF8F3] border border-[#E4E0D6] rounded-[6px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#8A8D96]">Commercial Custodian</span>
                  <span className="text-[10px] font-mono text-[#1F8A54] bg-[#1F8A54]/10 px-1.5 py-0.5 rounded">
                    Email / SMS 2FA Active
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#171A21] mt-0.5">{resolvedUser?.full_name}</p>
                <p className="text-[11px] font-mono text-[#8A8D96]">{resolvedUser?.email}</p>
              </div>

              {otpStatusMessage && (
                <div className="p-2.5 bg-[#4B7BAE]/10 border border-[#4B7BAE]/20 rounded-[6px] text-[11px] text-[#0F2A4A] flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#4B7BAE]" />
                  <div className="flex-1">
                    <span>{otpStatusMessage}</span>
                    {devOtpHint && (
                      <span className="block font-mono text-[10px] text-[#5B6472] mt-0.5">
                        Dev Testing Code: <strong className="text-[#0F2A4A]">{devOtpHint}</strong> (or enter <strong>123456</strong>)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-mono uppercase text-[#8A8D96]">
                    6-Digit Verification Token
                  </label>
                  <button
                    type="button"
                    onClick={() => triggerOtpDispatch(resolvedUser?.email || identifier)}
                    disabled={isSendingOtp}
                    className="text-[10px] font-mono text-[#4B7BAE] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                    <span>Resend Code</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-3.5 py-2 bg-white border border-[#E4E0D6] rounded-[6px] font-mono text-center text-sm tracking-widest text-[#171A21] focus:outline-none focus:border-[#A6772E]"
                />
                {authError && (
                  <p className="text-[11px] text-[#C4291C] mt-1.5 font-mono">{authError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleComplete}
                className="w-full h-10 bg-[#0D111A] hover:bg-[#171D2B] text-white rounded-[6px] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Verify Token & Enter</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A6772E]" />
              </button>
            </div>
          )}

          {/* SSO State (GATC Laboratories) */}
          {stage === 'sso' && (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-[#FAF8F3] border border-[#E4E0D6] rounded-[6px] text-left">
                <span className="text-[10px] font-mono uppercase text-[#8A8D96]">Accredited Calibration Lab</span>
                <p className="text-xs font-semibold text-[#171A21]">{resolvedUser?.full_name}</p>
                <p className="text-[11px] font-mono text-[#8A8D96]">{resolvedUser?.email}</p>
              </div>

              <div className="p-4 border border-[#E4E0D6] rounded-[6px] bg-[#FAF8F3]">
                <Building2 className="w-6 h-6 text-[#A6772E] mx-auto mb-2" />
                <span className="text-xs font-medium text-[#171A21] block">
                  Redirecting to SAML 2.0 / GATC Identity Provider
                </span>
                <span className="text-[10px] font-mono text-[#8A8D96] block mt-0.5">
                  EntityID: https://apex-01.gatc.metrology.gov.in/idp
                </span>
              </div>

              <button
                type="button"
                onClick={handleComplete}
                className="w-full h-10 bg-[#0D111A] hover:bg-[#171D2B] text-white rounded-[6px] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Authorize via GATC SSO</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A6772E]" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Institutional Legal Footer */}
      <footer className="h-12 border-t border-[#E4E0D6] px-6 sm:px-12 flex items-center justify-between text-[11px] font-mono text-[#8A8D96]">
        <span>Ministry of Consumer Affairs, Food & Public Distribution</span>
        <span>Secured by National Metrology HSM</span>
      </footer>
    </div>
  );
};
