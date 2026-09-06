import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { StatusPill } from '../../design-system/StatusPill';
import { Button } from '../../design-system/Button';
import { Card } from '../../design-system/Card';
import { Search, ShieldCheck, QrCode, ArrowLeft, Building2, Calendar, Scale, Award } from 'lucide-react';
import { Certificate, Instrument } from '../../types';

export interface PublicVerifyViewProps {
  initialCertNumber?: string;
  onBackToApp?: () => void;
}

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({
  initialCertNumber = '',
  onBackToApp,
}) => {
  const [query, setQuery] = useState(initialCertNumber);
  const [searched, setSearched] = useState(Boolean(initialCertNumber));
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialCertNumber) {
      handleLookup(initialCertNumber);
    }
  }, [initialCertNumber]);

  const handleLookup = (searchTerm: string) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    setHasSearched(true);
    const state = store.getState();

    // Lookup by Certificate Number OR Instrument Serial
    const foundCert = state.certificates.find(
      (c) =>
        c.certificate_number.toLowerCase() === term ||
        state.instruments.find(
          (i) => i.id === c.instrument_id && i.serial_number.toLowerCase() === term
        )
    );

    if (foundCert) {
      setCertificate(foundCert);
      const foundInst = state.instruments.find((i) => i.id === foundCert.instrument_id);
      setInstrument(foundInst || null);

      // Golden Rule #5: Log lookup to audit_log with actor_user_id = null, action = "verify.public_lookup"
      store.recordAudit(
        'verify.public_lookup',
        'certificate',
        foundCert.id,
        { query: searchTerm, result: 'found', cert_status: foundCert.status },
        null // Anonymous
      );
    } else {
      setCertificate(null);
      setInstrument(null);

      store.recordAudit(
        'verify.public_lookup_failed',
        'certificate',
        searchTerm,
        { query: searchTerm, result: 'not_found' },
        null
      );
    }
    setSearched(true);
  };

  const state = store.getState();
  const issuer = certificate ? state.users.find((u) => u.id === certificate.issued_by_user_id) : null;
  const jurisdiction = instrument
    ? state.jurisdictions.find((j) => j.id === instrument.jurisdiction_id)
    : null;

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#1A1F29] flex flex-col justify-between p-4 sm:p-8">
      {/* Top minimal public brand header - NO AUTHENTICATED CHROME per Section 10.3 */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-4 border-b border-[#DCE3ED]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#0F2A4A] text-white flex items-center justify-center font-bold text-sm tracking-wider">
            MS
          </div>
          <div>
            <h1 className="text-base font-bold text-[#0F2A4A] leading-tight">
              MaapSetu Public Verification Portal
            </h1>
            <p className="text-xs text-[#5B6472]">
              Department of Legal Metrology • Ministry of Consumer Affairs, GoI
            </p>
          </div>
        </div>
        {onBackToApp && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToApp}
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to App
          </Button>
        )}
      </header>

      {/* Main Search and Result Section */}
      <main className="max-w-2xl mx-auto w-full my-8 flex-1 flex flex-col justify-center">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0F2A4A]/10 text-[#0F2A4A] mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1F29]">
              Verify Weighing & Measuring Instruments
            </h2>
            <p className="text-sm text-[#5B6472] mt-1 max-w-md mx-auto">
              Confirm that a commercial instrument is legally verified, active, and calibrated under the Legal Metrology Act, 2009.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(query);
            }}
            className="relative flex items-center shadow-xs"
          >
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A93A3]">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter certificate number (e.g. MS-2026-DL-000101) or serial"
              className="w-full pl-11 pr-28 py-3.5 text-sm bg-white border border-[#DCE3ED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 focus:border-[#0F2A4A] text-[#1A1F29] placeholder-[#8A93A3]"
            />
            <div className="absolute right-1.5 inset-y-1.5 flex items-center">
              <Button type="submit" size="sm" className="h-full px-4">
                Verify
              </Button>
            </div>
          </form>
          <p className="text-center text-xs text-[#5B6472] mt-2.5 flex items-center justify-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-[#4B7BAE]" />
            <span>or scan the QR code printed on the instrument's official sticker.</span>
          </p>
        </div>

        {/* Search Result Card */}
        {hasSearched && certificate && (
          <Card className="border-[#0F2A4A]/20 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Minimal Fields Header (Golden Rule #5) */}
            <div className="text-center pb-6 border-b border-[#DCE3ED]">
              <span className="text-xs font-semibold text-[#5B6472] tracking-wider uppercase block mb-1">
                Official Verification Status
              </span>
              <div className="flex justify-center mb-2">
                <StatusPill status={certificate.status} size="lg" />
              </div>
              <p className="font-mono text-sm text-[#0F2A4A] font-bold">
                {certificate.certificate_number}
              </p>
            </div>

            {/* Minimal Fields Grid - ABSOLUTELY ZERO PII (No owner name, No address, No phone) */}
            <div className="py-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded bg-[#F7F9FC]">
                  <Scale className="w-5 h-5 text-[#4B7BAE] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[#5B6472] block">Instrument Category</span>
                    <span className="font-semibold text-sm capitalize text-[#1A1F29]">
                      {instrument?.instrument_type.replace('_', ' ') || 'Commercial Instrument'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded bg-[#F7F9FC]">
                  <Award className="w-5 h-5 text-[#4B7BAE] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[#5B6472] block">Capacity & Accuracy Class</span>
                    <span className="font-semibold text-sm text-[#1A1F29]">
                      {instrument?.capacity} ({instrument?.accuracy_class})
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded bg-[#F7F9FC]">
                  <Building2 className="w-5 h-5 text-[#4B7BAE] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[#5B6472] block">Issuing Authority & Jurisdiction</span>
                    <span className="font-semibold text-sm text-[#1A1F29]">
                      {jurisdiction?.name || 'Department of Legal Metrology'}, {jurisdiction?.state || 'Govt of India'}
                    </span>
                    <span className="text-[11px] text-[#5B6472] block">
                      {issuer?.role === 'gatc' ? 'Government Approved Test Centre' : 'Authorized Legal Metrology Officer'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded bg-[#F7F9FC]">
                  <Calendar className="w-5 h-5 text-[#4B7BAE] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[#5B6472] block">Validity Window</span>
                    <span className="font-semibold text-sm text-[#1A1F29]">
                      Verified: {certificate.issue_date}
                    </span>
                    <span className={`text-xs block font-medium ${certificate.status === 'expired' || certificate.status === 'revoked' ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                      Expires: {certificate.expiry_date}
                    </span>
                  </div>
                </div>
              </div>

              {certificate.status === 'revoked' && (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B]">
                  <span className="font-bold block mb-1">REVOKED INSTRUMENT NOTICE:</span>
                  This certificate was revoked by the enforcement authority on {certificate.revoked_at?.split('T')[0]}.
                  Commercial trade use of this unverified instrument is prohibited under the Legal Metrology Act, 2009.
                </div>
              )}

              {certificate.status === 'expiring_soon' && (
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md text-xs text-[#92400E]">
                  This instrument certificate is nearing its periodic validity limit. Re-verification has been requested.
                </div>
              )}
            </div>

            {/* Privacy note */}
            <div className="pt-4 border-t border-[#DCE3ED] text-center text-xs text-[#8A93A3]">
              To protect commercial privacy, personal custodian identity is not disclosed on the public verification register.
            </div>
          </Card>
        )}

        {/* Not Found State */}
        {hasSearched && !certificate && (
          <Card className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#1A1F29] mb-1">
              No Certificate Record Found
            </h3>
            <p className="text-xs text-[#5B6472] max-w-sm mx-auto mb-4">
              We couldn't find a valid or active certificate with the number "{query}". Please double-check the certificate number or scan the QR code directly.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery('');
                setHasSearched(false);
              }}
            >
              Clear & Search Again
            </Button>
          </Card>
        )}
      </main>

      {/* Minimal Public Footer */}
      <footer className="max-w-2xl mx-auto w-full text-center py-4 border-t border-[#DCE3ED] text-xs text-[#8A93A3]">
        Legal Metrology Act, 2009 • National Weighing and Measuring Verification Trust Infrastructure
      </footer>
    </div>
  );
};
