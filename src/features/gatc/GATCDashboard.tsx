import React, { useState } from 'react';
import { Application, Certificate } from '../../types';
import { store } from '../../services/store';
import { Card } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { StatusPill } from '../../design-system/StatusPill';
import { EmptyState } from '../../design-system/EmptyState';
import { FieldVerificationForm } from '../lmo/FieldVerificationForm';
import { CertificateModal } from '../certificate/CertificateModal';
import {
  Award,
  Clock,
  CheckCircle2,
  Building,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface GATCDashboardProps {
  onNavigatePublicVerify?: (certNumber: string) => void;
}

export const GATCDashboard: React.FC<GATCDashboardProps> = ({ onNavigatePublicVerify }) => {
  const state = store.getState();
  const currentUser = state.currentUser;

  // GATC approved categories
  const approvedCategories = currentUser?.gatc_approval_categories || [];

  // Filter applications assigned to this GATC
  const myQueue = state.applications.filter(
    (a) =>
      a.assigned_to_user_id === currentUser?.id &&
      (a.status === 'assigned' || a.status === 'in_progress')
  );

  const myCompleted = state.applications.filter(
    (a) =>
      a.assigned_to_user_id === currentUser?.id &&
      (a.status === 'completed' || a.status === 'rejected')
  );

  const [activeInspectionApp, setActiveInspectionApp] = useState<Application | null>(null);
  const [selectedCertForModal, setSelectedCertForModal] = useState<Certificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  if (activeInspectionApp) {
    return (
      <FieldVerificationForm
        application={activeInspectionApp}
        onBack={() => setActiveInspectionApp(null)}
        onSuccess={() => setActiveInspectionApp(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E0D6]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A6772E] bg-[#A6772E]/10 px-2 py-0.5 rounded">
              Government Approved Test Centre (GATC) • NABL Accredited
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-fraunces text-[#171A21]">
            {currentUser?.full_name}
          </h1>
          <p className="text-xs text-[#5B5F6B] mt-1 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-[#8A8D96]">Accredited Scope:</span>
            {approvedCategories.map((c) => (
              <span
                key={c}
                className="inline-block bg-[#FAF8F3] text-[#171A21] border border-[#E4E0D6] font-mono px-2 py-0.5 rounded text-[10px] uppercase"
              >
                {c.replace('_', ' ')}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-[10px] border border-[#E4E0D6] shadow-xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8D96] mb-1">
            Pending Lab Verifications
          </p>
          <p className="text-3xl font-fraunces font-semibold text-[#A6772E]">{myQueue.length}</p>
          <div className="mt-2 flex items-center text-[10px] font-mono text-[#A6772E]">
            <span>Engine Allocated</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-[#E4E0D6] shadow-xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8D96] mb-1">
            Completed Calibrations
          </p>
          <p className="text-3xl font-fraunces font-semibold text-[#1F8A54]">{myCompleted.length}</p>
          <div className="mt-2 flex items-center text-[10px] font-mono text-[#1F8A54]">
            <span>Rule 14 Certified</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-[#E4E0D6] shadow-xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8D96] mb-1">
            Accredited Scope
          </p>
          <p className="text-3xl font-fraunces font-semibold text-[#171A21]">{approvedCategories.length}</p>
          <div className="mt-2 flex items-center text-[10px] font-mono text-[#5B5F6B]">
            <span>Categories</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-[#E4E0D6] shadow-xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8D96] mb-1">
            Standard Weight SLA
          </p>
          <p className="text-3xl font-fraunces font-semibold text-[#171A21]">100%</p>
          <div className="mt-2 flex items-center text-[10px] font-mono text-[#1F8A54]">
            <span>NPL India Traceable</span>
          </div>
        </div>
      </div>

      {/* GATC Queue Table */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-sm font-bold text-[#0F2A4A] uppercase tracking-wide">
                GATC Testing & Field Verification Queue
              </h2>
              <p className="text-xs text-[#5B6472] mt-0.5">
                Regulated commercial instruments pending laboratory verification test.
              </p>
            </div>
            <span className="text-xs font-bold text-[#0F2A4A] bg-[#F0F4FA] px-2.5 py-1 rounded-md border border-[#DCE3ED]">
              {myQueue.length} Assigned
            </span>
          </div>
        }
      >
        {myQueue.length === 0 ? (
          <EmptyState
            title="No pending lab tests"
            description="All assigned commercial instruments in your approved categories have been verified."
            icon={<Check className="w-8 h-8 text-[#16A34A]" />}
          />
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3ED] bg-[#F7F9FC] text-[#5B6472] text-[11px] uppercase font-bold sticky top-0">
                  <th className="py-3 px-5">Application ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Instrument Specs</th>
                  <th className="py-3 px-4">Site Location</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3ED]">
                {myQueue.map((app) => {
                  const inst = state.instruments.find((i) => i.id === app.instrument_id);
                  const jur = state.jurisdictions.find((j) => j.id === inst?.jurisdiction_id);

                  return (
                    <tr key={app.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-[#0F2A4A]">
                        {app.id}
                      </td>
                      <td className="py-3 px-3 capitalize font-semibold text-[#1A1F29]">
                        {inst?.instrument_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-[#1A1F29] block">
                          {inst?.make} {inst?.model}
                        </span>
                        <span className="font-mono text-[10px] text-[#5B6472]">
                          SN: {inst?.serial_number}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#5B6472]">
                        {jur?.name || 'District Delhi'}
                      </td>
                      <td className="py-3 px-3 text-[#5B6472]">
                        {app.submitted_at.split('T')[0]}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setActiveInspectionApp(app)}
                          icon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Execute Verification
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CertificateModal
        certificate={selectedCertForModal}
        isOpen={isCertModalOpen}
        onClose={() => {
          setIsCertModalOpen(false);
          setSelectedCertForModal(null);
        }}
        onViewPublic={onNavigatePublicVerify}
      />
    </div>
  );
};
