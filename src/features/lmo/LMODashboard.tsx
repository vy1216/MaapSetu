import React, { useState } from 'react';
import { Application, Certificate } from '../../types';
import { store } from '../../services/store';
import { Card } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { StatusPill } from '../../design-system/StatusPill';
import { EmptyState } from '../../design-system/EmptyState';
import { FieldVerificationForm } from './FieldVerificationForm';
import { CertificateModal } from '../certificate/CertificateModal';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export interface LMODashboardProps {
  onNavigatePublicVerify?: (certNumber: string) => void;
}

export const LMODashboard: React.FC<LMODashboardProps> = ({ onNavigatePublicVerify }) => {
  const state = store.getState();
  const currentUser = state.currentUser;

  // LMO Jurisdiction Scoping (Golden Rule #2 & #3):
  // Filter instruments and applications strictly within LMO's assigned jurisdiction
  const jurisdiction = state.jurisdictions.find((j) => j.id === currentUser?.jurisdiction_id);

  const jurisdictionInstruments = state.instruments.filter(
    (i) => i.jurisdiction_id === currentUser?.jurisdiction_id
  );

  const jurisdictionApplications = state.applications.filter((a) =>
    jurisdictionInstruments.some((i) => i.id === a.instrument_id)
  );

  // Queue assigned to this specific LMO
  const myQueue = jurisdictionApplications.filter(
    (a) =>
      a.assigned_to_user_id === currentUser?.id &&
      (a.status === 'assigned' || a.status === 'in_progress')
  );

  // Sort queue oldest-first per Section 11.3
  myQueue.sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );

  // Completed inspections by this LMO
  const myCompletedApps = jurisdictionApplications.filter(
    (a) =>
      a.assigned_to_user_id === currentUser?.id &&
      (a.status === 'completed' || a.status === 'rejected')
  );

  // KPI Calculations
  const pendingCount = myQueue.length;

  // Compliance rate = pass count / total inspected
  const myInspections = state.inspections.filter((ins) => ins.officer_id === currentUser?.id);
  const passCount = myInspections.filter((ins) => ins.result === 'pass').length;
  const complianceRate =
    myInspections.length > 0 ? Math.round((passCount / myInspections.length) * 100) : 100;

  // Average TAT calculation (days between submitted and completed)
  let totalTatDays = 0;
  let completedCountWithTat = 0;
  myCompletedApps.forEach((app) => {
    if (app.status === 'completed') {
      const diffMs = new Date(app.updated_at).getTime() - new Date(app.submitted_at).getTime();
      const days = diffMs / (1000 * 60 * 60 * 24);
      totalTatDays += days;
      completedCountWithTat++;
    }
  });
  const avgTatDays =
    completedCountWithTat > 0 ? (totalTatDays / completedCountWithTat).toFixed(1) : '2.1';

  // State for active field verification
  const [activeInspectionApp, setActiveInspectionApp] = useState<Application | null>(null);
  const [selectedCertForModal, setSelectedCertForModal] = useState<Certificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Helper to calculate days pending and badge style
  const getPendingBadge = (submittedAt: string) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days >= 7) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
          Overdue ({days}d)
        </span>
      );
    }
    if (days >= 3) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
          {days}d Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#F3F4F6] text-[#5B6472]">
        {days === 0 ? 'Today' : `${days}d ago`}
      </span>
    );
  };

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
      {/* Header with Jurisdiction Guard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE3ED]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#0F2A4A]/10 text-[#0F2A4A]">
              <Building2 className="w-3.5 h-3.5" />
              {jurisdiction?.name || 'District Jurisdiction'} ({jurisdiction?.district_code || 'DL'})
            </span>
            <span className="text-xs text-[#5B6472]">Enforcement Officer Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2A4A]">
            Legal Metrology Officer Inspection Desk
          </h1>
          <p className="text-xs text-[#5B6472] mt-0.5">
            Officer: <strong>{currentUser?.full_name}</strong> • Jurisdiction DL-Code: {jurisdiction?.district_code}
          </p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-sm">
          <p className="text-xs font-bold text-[#5B6472] uppercase tracking-wider mb-1">
            Pending Assignments
          </p>
          <p className="text-3xl font-light text-[#0F2A4A]">{pendingCount}</p>
          <div className="mt-2 flex items-center text-[10px] text-amber-600 font-bold">
            <span className="bg-amber-100 px-1.5 py-0.5 rounded">Requires Action</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-sm">
          <p className="text-xs font-bold text-[#5B6472] uppercase tracking-wider mb-1">
            Avg Turnaround Time
          </p>
          <p className="text-3xl font-light text-[#0F2A4A]">
            {avgTatDays} <span className="text-sm text-[#8A93A3]">Days</span>
          </p>
          <div className="mt-2 flex items-center text-[10px] text-green-600 font-bold">
            <span className="bg-green-100 px-1.5 py-0.5 rounded">Within 15-Day SLA</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-sm">
          <p className="text-xs font-bold text-[#5B6472] uppercase tracking-wider mb-1">
            Compliance Pass Rate
          </p>
          <p className="text-3xl font-light text-[#0F2A4A]">{complianceRate}%</p>
          <div className="mt-2 flex items-center text-[10px] text-blue-700 font-bold">
            <span className="bg-blue-50 px-1.5 py-0.5 rounded">Standard Accuracy</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-sm">
          <p className="text-xs font-bold text-[#5B6472] uppercase tracking-wider mb-1">
            Jurisdiction Instruments
          </p>
          <p className="text-3xl font-light text-[#0F2A4A]">
            {jurisdictionInstruments.length}
          </p>
          <div className="mt-2 flex items-center text-[10px] text-[#5B6472] font-bold">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{jurisdiction?.district_code || 'DL-01'} Active</span>
          </div>
        </div>
      </div>

      {/* Main Inspection Area: 68/32 Asymmetric Split (Table on Left, Persistent Inspector on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (68% - 8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#E4E0D6] rounded-[10px] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E4E0D6] bg-[#FAF8F3] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#171A21] font-fraunces">
                  Assigned Field Verification Queue (Oldest First)
                </h2>
                <p className="text-[11px] text-[#5B5F6B] mt-0.5">
                  Deterministic allocation by jurisdiction circle & workload.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#A6772E] bg-[#A6772E]/10 border border-[#A6772E]/20 px-2 py-0.5 rounded">
                {myQueue.length} Active Cases
              </span>
            </div>

            {myQueue.length === 0 ? (
              <EmptyState
                title="Inspection queue is clear"
                description="All assigned applications in your jurisdiction have been inspected or no new applications are pending."
                icon={<CheckCircle2 className="w-8 h-8 text-[#1F8A54]" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E0D6] bg-[#FAF8F3] text-[#5B5F6B] text-[11px] font-mono uppercase sticky top-0">
                      <th className="py-2.5 px-4">Aging (SLA)</th>
                      <th className="py-2.5 px-4">Instrument</th>
                      <th className="py-2.5 px-4">Serial & Specs</th>
                      <th className="py-2.5 px-4">Custodian</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E0D6]">
                    {myQueue.map((app) => {
                      const inst = state.instruments.find((i) => i.id === app.instrument_id);
                      const owner = state.users.find((u) => u.id === inst?.owner_id);
                      const days = Math.floor(
                        (new Date().getTime() - new Date(app.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const isOverdue = days >= 7;
                      const isWarning = days >= 3 && days < 7;

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-[#FAF8F3] transition-colors group cursor-pointer"
                          onClick={() => setActiveInspectionApp(app)}
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono text-xs font-bold ${
                                isOverdue
                                  ? 'text-[#C4291C]'
                                  : isWarning
                                  ? 'text-[#B76E00]'
                                  : 'text-[#5B5F6B]'
                              }`}
                            >
                              {days === 0 ? 'Today' : `${days}d`}
                            </span>
                            <span className="block text-[10px] text-[#8A8D96] font-mono">
                              {isOverdue ? 'Overdue SLA' : isWarning ? 'Approaching' : 'Within SLA'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#171A21] block">
                              {inst?.make} {inst?.model}
                            </span>
                            <span className="capitalize text-[#5B5F6B] text-[11px]">
                              {inst?.instrument_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-medium text-[#171A21] block">
                              {inst?.serial_number}
                            </span>
                            <span className="text-[11px] text-[#8A8D96]">
                              {inst?.capacity} ({inst?.accuracy_class})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-[#171A21] block">
                              {owner?.full_name}
                            </span>
                            <span className="text-[11px] text-[#8A8D96] line-clamp-1">
                              {inst?.installation_site_address}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center text-xs font-medium text-[#A6772E] opacity-0 group-hover:opacity-100 transition-opacity">
                              Open →
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Persistent Inspector Panel (32% - 4 cols on lg) */}
        <div className="lg:col-span-4 bg-white border border-[#E4E0D6] rounded-[10px] p-5 shadow-xs sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8D96] font-bold">
              Case Inspector Preview
            </h3>
            <span className="text-[10px] font-mono text-[#A6772E] bg-[#A6772E]/10 px-1.5 py-0.5 rounded">
              Rule 14 Verified
            </span>
          </div>

          {myQueue.length > 0 ? (
            (() => {
              const headApp = myQueue[0];
              const headInst = state.instruments.find((i) => i.id === headApp.instrument_id);
              const headOwner = state.users.find((u) => u.id === headInst?.owner_id);

              return (
                <div className="mt-4 space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8A8D96] block">Next in Queue</span>
                    <h4 className="text-base font-fraunces font-semibold text-[#171A21] mt-0.5">
                      {headInst?.make} {headInst?.model}
                    </h4>
                    <p className="text-[11px] font-mono text-[#A6772E]">{headInst?.serial_number}</p>
                  </div>

                  <div className="p-3 bg-[#FAF8F3] rounded-[6px] border border-[#E4E0D6] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#5B5F6B]">Accuracy Class:</span>
                      <span className="font-mono font-bold text-[#171A21]">{headInst?.accuracy_class}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B5F6B]">Max Capacity:</span>
                      <span className="font-mono font-bold text-[#171A21]">{headInst?.capacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B5F6B]">Verification Type:</span>
                      <span className="capitalize font-mono text-[#171A21]">
                        {headApp.application_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8A8D96] block">Custodian & Site</span>
                    <p className="font-medium text-[#171A21]">{headOwner?.full_name}</p>
                    <p className="text-[11px] text-[#5B5F6B] mt-0.5">{headInst?.installation_site_address}</p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center !bg-[#0D111A] hover:!bg-[#171D2B] !text-white !rounded-[6px]"
                    onClick={() => setActiveInspectionApp(headApp)}
                    icon={<ArrowRight className="w-3.5 h-3.5 text-[#A6772E]" />}
                  >
                    Conduct Inspection
                  </Button>
                </div>
              );
            })()
          ) : (
            <div className="p-6 text-center text-[#8A8D96] text-xs">
              No pending cases to inspect.
            </div>
          )}
        </div>
      </div>

      {/* Completed Verification History */}
      <Card
        header={
          <h2 className="text-sm font-semibold text-[#0F2A4A]">
            Recent Verified & Concluded Cases (Jurisdiction DL-01)
          </h2>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DCE3ED] bg-[#FAFBFD] text-[#5B6472] font-semibold">
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Verification Result</th>
                <th className="py-2.5 px-3">Certificate Issued</th>
                <th className="py-2.5 px-3">Concluded On</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE3ED]">
              {myCompletedApps.map((app) => {
                const inst = state.instruments.find((i) => i.id === app.instrument_id);
                const cert = state.certificates.find((c) => c.application_id === app.id);
                const insp = state.inspections.find((ins) => ins.application_id === app.id);

                return (
                  <tr key={app.id} className="hover:bg-[#FAFBFD] transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-[#0F2A4A]">
                      {app.id}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#1A1F29]">{inst?.make} {inst?.model}</span>
                      <span className="font-mono text-[10px] text-[#5B6472] block">{inst?.serial_number}</span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusPill status={app.status} size="sm" />
                      {app.rejection_reason && (
                        <span className="text-[10px] text-[#DC2626] line-clamp-1 block mt-0.5">
                          {app.rejection_reason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {cert ? (
                        <span className="font-mono font-medium text-[#166534]">
                          {cert.certificate_number}
                        </span>
                      ) : (
                        <span className="text-[#8A93A3] italic">None (Rejected)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#5B6472]">
                      {app.updated_at.split('T')[0]}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {cert && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCertForModal(cert);
                            setIsCertModalOpen(true);
                          }}
                        >
                          View Certificate
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
