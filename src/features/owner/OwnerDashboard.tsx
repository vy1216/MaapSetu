import React, { useState } from 'react';
import { Instrument, Application, Certificate } from '../../types';
import { store } from '../../services/store';
import { Card } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { StatusPill } from '../../design-system/StatusPill';
import { EmptyState } from '../../design-system/EmptyState';
import { RegisterInstrumentModal } from './RegisterInstrumentModal';
import { NewApplicationModal } from './NewApplicationModal';
import { ApplicationDetailsModal } from './ApplicationDetailsModal';
import { CertificateModal } from '../certificate/CertificateModal';
import {
  Scale,
  Plus,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

export interface OwnerDashboardProps {
  onNavigatePublicVerify?: (certNumber: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigatePublicVerify }) => {
  const state = store.getState();
  const currentUser = state.currentUser;

  // Filter datasets belonging to this logged in owner
  const myInstruments = state.instruments.filter((i) => i.owner_id === currentUser?.id);
  const myApplications = state.applications.filter((a) =>
    myInstruments.some((i) => i.id === a.instrument_id)
  );
  const myCertificates = state.certificates.filter((c) =>
    myInstruments.some((i) => i.id === c.instrument_id)
  );

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedInstForApp, setSelectedInstForApp] = useState<Instrument | null>(null);
  const [isNewAppOpen, setIsNewAppOpen] = useState(false);
  const [selectedAppForDetails, setSelectedAppForDetails] = useState<Application | null>(null);
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [selectedCertForView, setSelectedCertForView] = useState<Certificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Stats calculation
  const totalInstruments = myInstruments.length;
  const activeAppsCount = myApplications.filter(
    (a) => a.status === 'submitted' || a.status === 'assigned' || a.status === 'in_progress'
  ).length;
  const expiringCount = myCertificates.filter((c) => c.status === 'expiring_soon').length;
  const validCertsCount = myCertificates.filter((c) => c.status === 'active').length;

  const handleApplyForVerification = (inst: Instrument) => {
    setSelectedInstForApp(inst);
    setIsNewAppOpen(true);
  };

  const handleViewCert = (cert: Certificate) => {
    setSelectedCertForView(cert);
    setIsCertModalOpen(true);
  };

  const handleTrackApp = (app: Application) => {
    setSelectedAppForDetails(app);
    setIsAppDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E0D6]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A6772E] bg-[#A6772E]/10 px-2 py-0.5 rounded">
              Commercial Custodian Desk
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-fraunces text-[#171A21]">
            Commercial Instruments Ledger
          </h1>
          <p className="text-xs text-[#5B5F6B] mt-0.5">
            Custodian: <strong className="text-[#171A21]">{currentUser?.full_name}</strong> • Business ID:{' '}
            <span className="font-mono text-[#A6772E]">{currentUser?.business_id || 'IND-DL-COMMERCIAL'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            className="!bg-[#0D111A] hover:!bg-[#171D2B] !text-white !rounded-[6px]"
            onClick={() => setIsRegisterOpen(true)}
            icon={<Plus className="w-4 h-4 text-[#A6772E]" />}
          >
            Register Instrument
          </Button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-[10px] border border-[#E4E0D6] shadow-xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8D96] mb-1">
            Total Custody
          </p>
          <p className="text-3xl font-fraunces font-semibold text-[#171A21]">{totalInstruments}</p>
          <div className="mt-2 flex items-center text-[10px] font-mono text-[#5B5F6B]">
            <span>Registered Units</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-[#E4E0D6] shadow-xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8D96] mb-1">
            Active Applications
          </p>
          <p className="text-3xl font-fraunces font-semibold text-[#A6772E]">{activeAppsCount}</p>
          <div className="mt-2 flex items-center text-[10px] font-mono text-[#A6772E]">
            <span>Pending Inspection</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-[#E4E0D6] shadow-xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8D96] mb-1">
            Expiring &lt;30 Days
          </p>
          <p className="text-3xl font-fraunces font-semibold text-[#C4291C]">{expiringCount}</p>
          <div className="mt-2 flex items-center text-[10px] font-mono text-[#C4291C]">
            <span>Renewal Required</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-[#E4E0D6] shadow-xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8D96] mb-1">
            Certified & Valid
          </p>
          <p className="text-3xl font-fraunces font-semibold text-[#1F8A54]">{validCertsCount}</p>
          <div className="mt-2 flex items-center text-[10px] font-mono text-[#1F8A54]">
            <span>Compliant Stamping</span>
          </div>
        </div>
      </div>

      {/* Instruments Registry Table */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-sm font-bold text-[#0F2A4A] uppercase tracking-wide">
                Commercial Instruments Registry
              </h2>
              <p className="text-xs text-[#5B6472] mt-0.5">
                Weighing scales, dispensers, and flow meters registered under your establishment.
              </p>
            </div>
            <span className="text-xs font-bold text-[#0F2A4A] bg-[#F0F4FA] px-2.5 py-1 rounded-md border border-[#DCE3ED]">
              {myInstruments.length} Units
            </span>
          </div>
        }
      >
        {myInstruments.length === 0 ? (
          <EmptyState
            title="No instruments registered yet"
            description="Register your commercial weighing scale or fuel dispenser to initiate legal verification."
            actionLabel="Register First Instrument"
            onAction={() => setIsRegisterOpen(true)}
            icon={<Scale className="w-8 h-8 text-[#8A93A3]" />}
          />
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3ED] bg-[#F7F9FC] text-[#5B6472] text-[11px] uppercase font-bold sticky top-0">
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-4">Make & Model</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Jurisdiction</th>
                  <th className="py-3 px-4">Certificate Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3ED]">
                {myInstruments.map((inst) => {
                  const cert = state.certificates.find((c) => c.instrument_id === inst.id);
                  const activeApp = state.applications.find(
                    (a) =>
                      a.instrument_id === inst.id &&
                      (a.status === 'submitted' || a.status === 'assigned' || a.status === 'in_progress')
                  );
                  const jur = state.jurisdictions.find((j) => j.id === inst.jurisdiction_id);

                  return (
                    <tr key={inst.id} className="hover:bg-[#FAFBFD] transition-colors">
                      <td className="py-3 px-3 font-medium capitalize text-[#1A1F29]">
                        {inst.instrument_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#1A1F29]">{inst.make}</span>
                        <span className="text-[#5B6472] block">{inst.model}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-[#0F2A4A]">
                        {inst.serial_number}
                      </td>
                      <td className="py-3 px-3 text-[#1A1F29]">
                        {inst.capacity}
                        <span className="text-[10px] text-[#5B6472] block">({inst.accuracy_class})</span>
                      </td>
                      <td className="py-3 px-3 text-[#5B6472]">
                        {jur?.name || 'District Delhi'}
                      </td>
                      <td className="py-3 px-3">
                        {cert ? (
                          <StatusPill status={cert.status} size="sm" />
                        ) : activeApp ? (
                          <StatusPill status={activeApp.status} size="sm" />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F4F6] text-[#5B6472]">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {cert && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCert(cert)}
                              icon={<ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />}
                            >
                              Certificate
                            </Button>
                          )}
                          {!activeApp && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleApplyForVerification(inst)}
                              icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                            >
                              {cert ? 'Re-verify' : 'Apply'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Applications Tracking Table */}
      <Card
        header={
          <h2 className="text-sm font-semibold text-[#0F2A4A]">
            Verification Applications & Lifecycle Status
          </h2>
        }
      >
        {myApplications.length === 0 ? (
          <EmptyState
            title="No applications submitted"
            description="Submit an instrument verification application to engage the automated allocation engine."
            icon={<FileCheck className="w-8 h-8 text-[#8A93A3]" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3ED] bg-[#FAFBFD] text-[#5B6472] font-semibold">
                  <th className="py-2.5 px-3">Application ID</th>
                  <th className="py-2.5 px-3">Instrument</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Assigned Authority</th>
                  <th className="py-2.5 px-3">Submitted Date</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3ED]">
                {myApplications.map((app) => {
                  const inst = state.instruments.find((i) => i.id === app.instrument_id);
                  const officer = state.users.find((u) => u.id === app.assigned_to_user_id);

                  return (
                    <tr key={app.id} className="hover:bg-[#FAFBFD] transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-[#0F2A4A]">
                        {app.id}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#1A1F29]">{inst?.make} {inst?.model}</span>
                        <span className="font-mono text-[10px] text-[#5B6472] block">{inst?.serial_number}</span>
                      </td>
                      <td className="py-3 px-3 capitalize text-[#5B6472]">
                        {app.application_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 text-[#1A1F29]">
                        {officer ? (
                          <>
                            <span className="font-medium block">{officer.full_name}</span>
                            <span className="text-[10px] text-[#5B6472]">{officer.role.toUpperCase()}</span>
                          </>
                        ) : (
                          <span className="text-[#8A93A3] italic">In Allocation Queue</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#5B6472]">
                        {app.submitted_at.split('T')[0]}
                      </td>
                      <td className="py-3 px-3">
                        <StatusPill status={app.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTrackApp(app)}
                          icon={<Clock className="w-3.5 h-3.5 text-[#4B7BAE]" />}
                        >
                          Track Lifecycle
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

      {/* Modals */}
      <RegisterInstrumentModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          // view updates automatically via store subscription
        }}
      />

      <NewApplicationModal
        instrument={selectedInstForApp}
        isOpen={isNewAppOpen}
        onClose={() => {
          setIsNewAppOpen(false);
          setSelectedInstForApp(null);
        }}
        onSuccess={() => {}}
      />

      <ApplicationDetailsModal
        application={selectedAppForDetails}
        isOpen={isAppDetailsOpen}
        onClose={() => {
          setIsAppDetailsOpen(false);
          setSelectedAppForDetails(null);
        }}
        onViewCertificate={(cert) => {
          setSelectedCertForView(cert);
          setIsCertModalOpen(true);
        }}
        onReapply={(inst) => {
          setSelectedInstForApp(inst);
          setIsNewAppOpen(true);
        }}
      />

      <CertificateModal
        certificate={selectedCertForView}
        isOpen={isCertModalOpen}
        onClose={() => {
          setIsCertModalOpen(false);
          setSelectedCertForView(null);
        }}
        onViewPublic={onNavigatePublicVerify}
      />
    </div>
  );
};
