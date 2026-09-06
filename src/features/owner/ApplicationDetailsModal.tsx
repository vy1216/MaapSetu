import React from 'react';
import { Application, Instrument, Certificate, User, Inspection } from '../../types';
import { store } from '../../services/store';
import { StatusPill } from '../../design-system/StatusPill';
import { Button } from '../../design-system/Button';
import { X, Check, AlertCircle, Clock, Award, ShieldCheck, ArrowRight } from 'lucide-react';

export interface ApplicationDetailsModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onViewCertificate?: (cert: Certificate) => void;
  onReapply?: (instrument: Instrument) => void;
}

export const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  application,
  isOpen,
  onClose,
  onViewCertificate,
  onReapply,
}) => {
  if (!isOpen || !application) return null;

  const state = store.getState();
  const instrument = state.instruments.find((i) => i.id === application.instrument_id);
  const assignedOfficer = state.users.find((u) => u.id === application.assigned_to_user_id);
  const inspection = state.inspections.find((ins) => ins.application_id === application.id);
  const certificate = state.certificates.find((c) => c.application_id === application.id);
  const previousApp = application.previous_application_id
    ? state.applications.find((a) => a.id === application.previous_application_id)
    : null;

  // Stepper steps
  const steps = [
    { key: 'submitted', label: 'Submitted', time: application.submitted_at },
    { key: 'assigned', label: 'Assigned', time: application.assigned_at },
    { key: 'in_progress', label: 'Inspection', time: inspection?.inspected_at || null },
    {
      key: application.status === 'rejected' ? 'rejected' : 'completed',
      label: application.status === 'rejected' ? 'Rejected' : 'Certified',
      time: certificate?.created_at || (application.status === 'rejected' ? application.updated_at : null),
    },
  ];

  const getStepStatus = (stepKey: string) => {
    if (application.status === 'rejected') {
      if (stepKey === 'rejected') return 'failed';
      return 'completed';
    }
    if (application.status === 'completed') return 'completed';
    if (application.status === 'in_progress') {
      if (stepKey === 'completed') return 'upcoming';
      if (stepKey === 'in_progress') return 'current';
      return 'completed';
    }
    if (application.status === 'assigned') {
      if (stepKey === 'submitted') return 'completed';
      if (stepKey === 'assigned') return 'current';
      return 'upcoming';
    }
    // submitted
    if (stepKey === 'submitted') return 'current';
    return 'upcoming';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F2A4A]/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border border-[#DCE3ED] shadow-xl max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#DCE3ED] bg-[#FAFBFD] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#0F2A4A]">
              Verification Lifecycle Track
            </h2>
            <StatusPill status={application.status} size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8A93A3] hover:text-[#1A1F29] hover:bg-[#DCE3ED]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Linked Re-application Banner */}
          {previousApp && (
            <div className="p-3 bg-[#FAFBFD] border border-[#DCE3ED] rounded flex items-center justify-between">
              <span className="text-[#5B6472]">
                Re-submitted after prior rejection (Case {previousApp.id})
              </span>
              <span className="font-mono text-[11px] text-[#4B7BAE]">Audited & Linked</span>
            </div>
          )}

          {/* Horizontal Stepper Timeline */}
          <div className="py-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#DCE3ED] -translate-y-1/2 z-0" />
              {steps.map((step) => {
                const s = getStepStatus(step.key);
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        s === 'completed'
                          ? 'bg-[#0F2A4A] text-white'
                          : s === 'failed'
                          ? 'bg-[#DC2626] text-white'
                          : s === 'current'
                          ? 'border-2 border-[#0F2A4A] bg-white text-[#0F2A4A]'
                          : 'bg-[#F3F4F6] text-[#8A93A3] border border-[#DCE3ED]'
                      }`}
                    >
                      {s === 'completed' ? (
                        <Check className="w-4 h-4" />
                      ) : s === 'failed' ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-[#1A1F29] mt-1.5 whitespace-nowrap">
                      {step.label}
                    </span>
                    {step.time && (
                      <span className="text-[10px] text-[#8A93A3]">
                        {step.time.split('T')[0]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-[#FAFBFD] border border-[#DCE3ED] rounded-lg">
            <div>
              <span className="text-[#5B6472] block">Instrument</span>
              <span className="font-semibold text-sm text-[#1A1F29]">
                {instrument?.make} {instrument?.model}
              </span>
              <span className="block font-mono text-[11px] text-[#0F2A4A]">
                SN: {instrument?.serial_number}
              </span>
            </div>
            <div>
              <span className="text-[#5B6472] block">Assigned Legal Authority</span>
              <span className="font-semibold text-sm text-[#1A1F29]">
                {assignedOfficer?.full_name || 'Awaiting Auto-Scheduler'}
              </span>
              <span className="block text-[11px] text-[#5B6472]">
                {assignedOfficer ? `${assignedOfficer.role.toUpperCase()} • ${assignedOfficer.jurisdiction_id || 'Approved GATC Lab'}` : 'In allocation queue'}
              </span>
            </div>
          </div>

          {/* Rejection Alert Box */}
          {application.status === 'rejected' && (
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg space-y-3">
              <div className="flex items-start gap-2 text-[#991B1B]">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#DC2626]" />
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wide">
                    Verification Failed: Rejection Record
                  </h4>
                  <p className="text-xs mt-1 text-[#1A1F29]">
                    {application.rejection_reason || 'Instrument did not pass the prescribed error tolerance thresholds.'}
                  </p>
                </div>
              </div>
              {onReapply && instrument && (
                <div className="pt-2 border-t border-[#FECACA] flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onReapply(instrument);
                    }}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Rectify & Re-apply for Verification
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Certificate Action Box */}
          {certificate && (
            <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#166534] block flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#16A34A]" />
                  Active Legal Verification Certificate Issued
                </span>
                <span className="font-mono text-xs text-[#0F2A4A] font-bold">
                  {certificate.certificate_number}
                </span>
                <span className="block text-[11px] text-[#5B6472]">
                  Valid until {certificate.expiry_date}
                </span>
              </div>
              {onViewCertificate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onViewCertificate(certificate);
                  }}
                  icon={<ShieldCheck className="w-4 h-4" />}
                >
                  View Certificate
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-[#DCE3ED]">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
