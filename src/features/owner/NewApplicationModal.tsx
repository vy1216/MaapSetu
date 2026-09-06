import React, { useState } from 'react';
import { Instrument } from '../../types';
import { store } from '../../services/store';
import { Button } from '../../design-system/Button';
import { useToast } from '../../design-system/Toast';
import { X, CreditCard, ShieldCheck, CheckCircle, Clock } from 'lucide-react';

export interface NewApplicationModalProps {
  instrument: Instrument | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  instrument,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [photoInput, setPhotoInput] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState<'review' | 'paying' | 'assigned'>('review');
  const [assignmentInfo, setAssignmentInfo] = useState<{ name: string; reason: string } | null>(null);

  if (!isOpen || !instrument) return null;

  const state = store.getState();
  const feeAmount = state.rulesConfig.fee_schedule_json[instrument.instrument_type] || 500;

  // Auto-detect whether this is initial verification or re-verification
  const priorCert = state.certificates.find((c) => c.instrument_id === instrument.id);
  const priorRejected = state.applications.find(
    (a) => a.instrument_id === instrument.id && a.status === 'rejected'
  );
  const isReverification = Boolean(priorCert || priorRejected);
  const applicationType = isReverification ? 're_verification' : 'initial_verification';

  const handlePayAndSubmit = () => {
    setPaymentStep('paying');

    // Simulate BharatKosh / UPI payment gateway 1.2s spinner
    setTimeout(() => {
      try {
        // 1. Submit application
        const newApp = store.submitApplication({
          instrumentId: instrument.id,
          applicationType,
        });

        // 2. Trigger pure deterministic scheduling engine per Feature 5!
        const assignRes = store.assignApplication(newApp.id);

        if (assignRes.assignedTo) {
          setAssignmentInfo({
            name: assignRes.assignedTo.full_name,
            reason: assignRes.reason,
          });
        } else {
          setAssignmentInfo({
            name: 'Unassigned Pool',
            reason: assignRes.reason,
          });
        }

        setPaymentStep('assigned');
        showToast(
          'success',
          'Application Submitted & Scheduled',
          assignRes.assignedTo
            ? `Assigned to ${assignRes.assignedTo.full_name} (${assignRes.assignedTo.role.toUpperCase()})`
            : 'Submitted to jurisdiction queue.'
        );
      } catch (err: any) {
        showToast('error', 'Submission Failed', err.message);
        setPaymentStep('review');
      }
    }, 1200);
  };

  const handleFinish = () => {
    setPaymentStep('review');
    onSuccess();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F2A4A]/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border border-[#DCE3ED] shadow-xl max-w-lg w-full my-auto overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#DCE3ED] bg-[#FAFBFD] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#0F2A4A]">
            Apply for Legal Verification
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8A93A3] hover:text-[#1A1F29] hover:bg-[#DCE3ED]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {paymentStep === 'paying' ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#0F2A4A]/20 border-t-[#0F2A4A] rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-sm font-semibold text-[#1A1F29]">
                  Connecting to BharatKosh Gateway...
                </p>
                <p className="text-xs text-[#5B6472] mt-1">
                  Processing statutory government fee payment of ₹{feeAmount}.00
                </p>
              </div>
            </div>
          ) : paymentStep === 'assigned' ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-[#F0FDF4] text-[#16A34A] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1F29]">
                  Verification Application Scheduled!
                </h3>
                <p className="text-xs text-[#5B6472] mt-1">
                  Statutory fee of ₹{feeAmount} has been acknowledged under BharatKosh Ref #BK-{Math.floor(100000 + Math.random() * 900000)}.
                </p>
              </div>

              <div className="p-4 bg-[#FAFBFD] border border-[#DCE3ED] rounded-lg text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6472]">Assigned Officer / Testing Lab:</span>
                  <span className="font-semibold text-[#0F2A4A]">{assignmentInfo?.name}</span>
                </div>
                <div className="text-[11px] text-[#5B6472] border-t border-[#DCE3ED] pt-2">
                  <strong>Assignment Logic:</strong> {assignmentInfo?.reason}
                </div>
              </div>

              <Button variant="primary" size="md" onClick={handleFinish} className="w-full">
                View My Applications
              </Button>
            </div>
          ) : (
            <>
              {/* Instrument Summary */}
              <div className="p-4 bg-[#FAFBFD] border border-[#DCE3ED] rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#5B6472]">Selected Instrument:</span>
                  <span className="font-semibold text-[#1A1F29]">
                    {instrument.make} {instrument.model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6472]">Serial Number:</span>
                  <span className="font-mono text-[#0F2A4A] font-semibold">
                    {instrument.serial_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6472]">Application Type:</span>
                  <span className="capitalize font-semibold text-[#1A1F29]">
                    {applicationType.replace('_', ' ')}
                    {priorRejected && (
                      <span className="text-[#DC2626] ml-1 text-[11px]">(Re-submission after correction)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Statutory Fee Schedule Breakdown */}
              <div className="p-4 border border-[#DCE3ED] rounded-lg bg-white space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE3ED]">
                  <span className="font-medium text-[#1A1F29]">Statutory Verification Fee</span>
                  <span className="font-bold text-sm text-[#0F2A4A]">₹{feeAmount}.00</span>
                </div>
                <div className="flex justify-between text-[#5B6472] text-[11px]">
                  <span>Legal Metrology (General) Rules 2011 Schedule</span>
                  <span>Rule 14 Annexure C</span>
                </div>
                <div className="flex justify-between text-[#5B6472] text-[11px]">
                  <span>Payment Gateway (e-Treasury / BharatKosh)</span>
                  <span>₹0.00 (Zero Surcharge)</span>
                </div>
              </div>

              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded flex items-center gap-2 text-xs text-[#166534]">
                <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>
                  Automatic deterministic assignment will route this request to the optimal on-duty LMO or accredited GATC.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE3ED]">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handlePayAndSubmit}
                  icon={<CreditCard className="w-4 h-4" />}
                >
                  Pay ₹{feeAmount}.00 & Submit
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
