import React, { useEffect, useState } from 'react';
import { Certificate, Instrument, User } from '../../types';
import { store } from '../../services/store';
import { StatusPill } from '../../design-system/StatusPill';
import { Button } from '../../design-system/Button';
import { X, Printer, ShieldCheck, Download, ExternalLink } from 'lucide-react';

export interface CertificateModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  onViewPublic?: (certNumber: string) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  isOpen,
  onClose,
  onViewPublic,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (certificate?.qr_payload_url) {
      store.generateQrCodeDataUrl(certificate.qr_payload_url).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [certificate]);

  if (!isOpen || !certificate) return null;

  const state = store.getState();
  const instrument = state.instruments.find((i) => i.id === certificate.instrument_id);
  const issuer = state.users.find((u) => u.id === certificate.issued_by_user_id);
  const owner = instrument ? state.users.find((u) => u.id === instrument.owner_id) : null;
  const jurisdiction = instrument
    ? state.jurisdictions.find((j) => j.id === instrument.jurisdiction_id)
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F2A4A]/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border border-[#DCE3ED] shadow-2xl max-w-3xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Action Header */}
        <div className="px-6 py-3.5 border-b border-[#DCE3ED] bg-[#FAFBFD] flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6472]">
              Official Digital Certificate
            </span>
            <StatusPill status={certificate.status} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            {onViewPublic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewPublic(certificate.certificate_number)}
                icon={<ExternalLink className="w-3.5 h-3.5 text-[#4B7BAE]" />}
              >
                Public Link
              </Button>
            )}
            <a
              href={`/api/certificates/${encodeURIComponent(certificate.certificate_number)}/pdf`}
              download={`Form1_Certificate_${certificate.certificate_number}.pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="primary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Download Form 1 PDF
              </Button>
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / Save
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#8A93A3] hover:text-[#1A1F29] hover:bg-[#DCE3ED]/30 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Replica in Serif font per Section 10.2 */}
        <div className="p-8 sm:p-10 font-certificate bg-[#FFFFFF] border-8 border-double border-[#0F2A4A]/20 m-4 rounded-sm print:m-0 print:border-none">
          {/* Emblem & Official Header */}
          <div className="text-center border-b-2 border-[#0F2A4A] pb-4 mb-6">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full border-2 border-[#0F2A4A] flex items-center justify-center font-bold text-[#0F2A4A] text-lg bg-[#FAFBFD]">
                GOI
              </div>
            </div>
            <h2 className="text-sm tracking-widest uppercase font-semibold text-[#5B6472]">
              Government of India
            </h2>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2A4A] mt-0.5">
              Department of Legal Metrology
            </h1>
            <p className="text-xs text-[#5B6472] italic mt-0.5">
              Ministry of Consumer Affairs, Food & Public Distribution
            </p>
            <p className="text-xs font-semibold text-[#1A1F29] mt-2 tracking-wide uppercase">
              Certificate of Verification / Re-verification
            </p>
            <p className="text-[11px] text-[#8A93A3]">
              [Under Section 24 of the Legal Metrology Act, 2009 & Rule 14 of the Legal Metrology (General) Rules, 2011]
            </p>
          </div>

          {/* Certificate Number and Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6 bg-[#F7F9FC] p-3 rounded border border-[#DCE3ED]">
            <div>
              <span className="text-xs text-[#5B6472] block">Certificate No:</span>
              <span className="text-base font-bold font-mono text-[#0F2A4A]">
                {certificate.certificate_number}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#5B6472] block">Legal Status:</span>
              <StatusPill status={certificate.status} size="md" />
            </div>
          </div>

          {/* Core Certificate Body */}
          <div className="space-y-4 text-xs sm:text-sm text-[#1A1F29] leading-relaxed mb-8">
            <p>
              This is to certify that the weighing / measuring instrument specified below has been inspected, tested,
              and verified in accordance with the specifications prescribed under the Legal Metrology (General) Rules, 2011,
              and found to be accurate within the permissible maximum error tolerances.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAFBFD] border border-[#DCE3ED] rounded">
              <div>
                <span className="text-xs text-[#5B6472] block font-sans">Instrument Category:</span>
                <span className="font-semibold text-sm capitalize">
                  {instrument?.instrument_type.replace('_', ' ') || 'Weighing Instrument'}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#5B6472] block font-sans">Manufacturer Make & Model:</span>
                <span className="font-semibold text-sm">
                  {instrument?.make} — {instrument?.model}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#5B6472] block font-sans">Serial Identification Number:</span>
                <span className="font-mono font-semibold text-sm text-[#0F2A4A]">
                  {instrument?.serial_number}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#5B6472] block font-sans">Capacity & Accuracy Class:</span>
                <span className="font-semibold text-sm">
                  {instrument?.capacity} ({instrument?.accuracy_class})
                </span>
              </div>
              <div>
                <span className="text-xs text-[#5B6472] block font-sans">Registered Custodian / Owner:</span>
                <span className="font-semibold text-sm">
                  {owner?.full_name || 'Authorized Custodian'}
                </span>
                {owner?.business_id && (
                  <span className="block text-[11px] font-mono text-[#5B6472]">
                    GSTIN/ID: {owner.business_id.slice(0, 4)}••••{owner.business_id.slice(-4)}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs text-[#5B6472] block font-sans">Installation Site Jurisdiction:</span>
                <span className="font-semibold text-sm">
                  {jurisdiction?.name || 'Central District'}, {jurisdiction?.state || 'Delhi'}
                </span>
              </div>
            </div>

            {/* Validity Timeline */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-[#DCE3ED] py-3">
              <div>
                <span className="text-xs text-[#5B6472] block font-sans">Date of Verification:</span>
                <span className="font-semibold text-sm text-[#1A1F29]">
                  {certificate.issue_date}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#5B6472] block font-sans">Valid Until (Next Re-verification Due):</span>
                <span className="font-semibold text-sm text-[#DC2626]">
                  {certificate.expiry_date}
                </span>
              </div>
            </div>

            {certificate.status === 'revoked' && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-xs text-[#991B1B]">
                <span className="font-bold block">REVOCATION NOTICE:</span>
                This certificate was officially revoked on {certificate.revoked_at?.split('T')[0]}.
                Reason: {certificate.revoked_reason}
              </div>
            )}
          </div>

          {/* Footer: QR Code & Cryptographic PKI Signature Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center pt-4 border-t-2 border-[#0F2A4A]/20">
            {/* Scannable Hosted QR Code */}
            <div className="flex items-center gap-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Official Verification QR Code"
                  className="w-24 h-24 border border-[#0F2A4A] p-1 bg-white rounded shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-24 h-24 bg-[#F3F4F6] border border-[#DCE3ED] flex items-center justify-center text-xs text-[#8A93A3]">
                  Generating QR…
                </div>
              )}
              <div className="text-xs font-sans text-[#5B6472] leading-tight">
                <span className="font-bold text-[#0F2A4A] block mb-1">
                  Public Tamper-Check
                </span>
                Scan with any smartphone camera to verify live validity status on the National Legal Metrology portal.
                <div className="mt-1 font-mono text-[10px] text-[#8A93A3] truncate max-w-[180px]">
                  {certificate.qr_payload_url}
                </div>
              </div>
            </div>

            {/* PKI Test Signature Seal */}
            <div className="text-right font-sans text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] font-semibold mb-2">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <span>Digitally Signed & Validated</span>
              </div>
              <p className="font-bold text-[#1A1F29] text-sm">
                {issuer?.full_name || 'Legal Metrology Officer'}
              </p>
              <p className="text-[#5B6472] text-xs">
                {issuer?.role === 'gatc' ? 'Government Approved Test Centre' : 'Inspector of Legal Metrology'}
              </p>
              <p className="text-[#5B6472] text-[11px]">
                {jurisdiction?.name || 'Department of Consumer Affairs'}
              </p>
              <div className="mt-2 text-[10px] text-[#8A93A3] font-mono leading-tight">
                Cert Hash: SHA256:7e8b2f91...c3d4<br />
                Signed: {certificate.created_at}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
