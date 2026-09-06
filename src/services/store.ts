// Core business logic, scheduling engine, state machines, and persistent repository
import QRCode from 'qrcode';
import {
  User,
  Jurisdiction,
  Instrument,
  Application,
  Inspection,
  Certificate,
  AuditLog,
  RulesConfig,
  Notification,
  UserRole,
  InstrumentType,
  ApplicationStatus,
  CertificateStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_JURISDICTIONS,
  INITIAL_INSTRUMENTS,
  INITIAL_APPLICATIONS,
  INITIAL_INSPECTIONS,
  INITIAL_CERTIFICATES,
  INITIAL_AUDIT_LOGS,
  INITIAL_RULES_CONFIG,
  INITIAL_NOTIFICATIONS,
} from './seedData';

const STORAGE_KEY = 'maapsetu_store_v1';
const OFFLINE_QUEUE_KEY = 'maapsetu_offline_inspections_v1';

export interface MaapSetuState {
  currentUser: User | null;
  users: User[];
  jurisdictions: Jurisdiction[];
  instruments: Instrument[];
  applications: Application[];
  inspections: Inspection[];
  certificates: Certificate[];
  auditLogs: AuditLog[];
  rulesConfig: RulesConfig;
  notifications: Notification[];
}

class Store {
  private state: MaapSetuState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = this.loadInitialState();
    // Default logged in as Owner 1 for immediate live preview, can switch anytime
    if (!this.state.currentUser) {
      this.state.currentUser = this.state.users.find((u) => u.role === 'owner') || null;
    }
  }

  private loadInitialState(): MaapSetuState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback to initial
    }
    return {
      currentUser: INITIAL_USERS[7], // Rajesh Agrawal (Owner)
      users: INITIAL_USERS,
      jurisdictions: INITIAL_JURISDICTIONS,
      instruments: INITIAL_INSTRUMENTS,
      applications: INITIAL_APPLICATIONS,
      inspections: INITIAL_INSPECTIONS,
      certificates: INITIAL_CERTIFICATES,
      auditLogs: INITIAL_AUDIT_LOGS,
      rulesConfig: INITIAL_RULES_CONFIG,
      notifications: INITIAL_NOTIFICATIONS,
    };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist state', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getState(): MaapSetuState {
    return this.state;
  }

  // =================== IMMUTABLE AUDIT LOG HELPER (Golden Rule #4) ===================
  public recordAudit(
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
    explicitActor?: User | null
  ) {
    const actor = explicitActor !== undefined ? explicitActor : this.state.currentUser;
    const newLog: AuditLog = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      actor_user_id: actor ? actor.id : null,
      actor_role: actor ? actor.role : 'anonymous',
      jurisdiction_id: actor?.jurisdiction_id || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      ip_address: '103.24.188.' + Math.floor(Math.random() * 250 + 1),
      device_info: navigator.userAgent.substring(0, 80),
      metadata_json: metadata || null,
      created_at: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(newLog);
  }

  // =================== AUTHENTICATION & RBAC (Feature 1, 2) ===================
  public switchUser(userId: string) {
    const user = this.state.users.find((u) => u.id === userId);
    if (user) {
      this.state.currentUser = user;
      this.recordAudit('auth.switch_role', 'user', user.id, {
        role: user.role,
        name: user.full_name,
      });
      this.saveState();
    }
  }

  public loginWithOtp(emailOrPhone: string, otp: string): { success: boolean; error?: string } {
    let user = this.state.users.find(
      (u) =>
        u.email.toLowerCase() === emailOrPhone.toLowerCase() ||
        u.phone.replace(/\s+/g, '') === emailOrPhone.replace(/\s+/g, '')
    );
    if (!user) {
      const name = emailOrPhone.includes('@')
        ? emailOrPhone.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Registered Owner';
      user = {
        id: 'user-owner-' + Math.random().toString(36).substring(2, 7),
        role: 'owner',
        full_name: name,
        email: emailOrPhone.includes('@') ? emailOrPhone : `${emailOrPhone}@citizen.in`,
        phone: emailOrPhone.match(/^\+?[0-9\s]+$/) ? emailOrPhone : '+91 98000 00000',
        business_id: 'GSTIN-' + Math.floor(10000000 + Math.random() * 90000000),
        jurisdiction_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.users.push(user);
    }
    if (!user.is_active) {
      return { success: false, error: 'This account has been deactivated by the Administrator.' };
    }
    this.state.currentUser = user;
    this.recordAudit('auth.login_success', 'user', user.id, {
      method: 'otp_2fa',
      jurisdiction: user.jurisdiction_id,
    });
    this.saveState();
    return { success: true };
  }

  public logout() {
    if (this.state.currentUser) {
      this.recordAudit('auth.logout', 'user', this.state.currentUser.id);
    }
    this.state.currentUser = null;
    this.saveState();
  }

  public registerOwner(data: {
    fullName: string;
    email: string;
    phone: string;
    businessId?: string;
  }): User {
    const newUser: User = {
      id: 'user-owner-' + Math.random().toString(36).substring(2, 7),
      role: 'owner',
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      business_id: data.businessId || null,
      jurisdiction_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.users.push(newUser);
    this.state.currentUser = newUser;
    this.recordAudit('user.registered_owner', 'user', newUser.id, {
      businessId: newUser.business_id,
    });
    this.saveState();
    return newUser;
  }

  // =================== JURISDICTION RESOLUTION HELPER ===================
  public resolveJurisdictionFromAddress(address: string): Jurisdiction {
    const text = address.toLowerCase();
    if (text.includes('110006') || text.includes('chandni') || text.includes('north') || text.includes('wazirpur')) {
      return this.state.jurisdictions.find((j) => j.id === 'jur-dl-north') || this.state.jurisdictions[0];
    }
    if (text.includes('110024') || text.includes('lajpat') || text.includes('south') || text.includes('hauz')) {
      return this.state.jurisdictions.find((j) => j.id === 'jur-dl-south') || this.state.jurisdictions[1];
    }
    if (text.includes('gurugram') || text.includes('haryana') || text.includes('122001')) {
      return this.state.jurisdictions.find((j) => j.id === 'jur-hr-gurugram') || this.state.jurisdictions[2];
    }
    // Default fallback to first jurisdiction
    return this.state.jurisdictions[0];
  }

  // =================== INSTRUMENT REGISTRY (Feature 3) ===================
  public registerInstrument(data: {
    instrumentType: InstrumentType;
    make: string;
    model: string;
    serialNumber: string;
    capacity: string;
    accuracyClass: string;
    installationSiteAddress: string;
  }): { success: boolean; error?: string; instrument?: Instrument } {
    if (!this.state.currentUser || this.state.currentUser.role !== 'owner') {
      return { success: false, error: 'Only registered instrument owners can register instruments.' };
    }

    // Serial number uniqueness check
    const existing = this.state.instruments.find(
      (i) => i.serial_number.trim().toLowerCase() === data.serialNumber.trim().toLowerCase()
    );
    if (existing) {
      return {
        success: false,
        error: `Instrument with serial number "${data.serialNumber}" is already registered in the national database.`,
      };
    }

    const jurisdiction = this.resolveJurisdictionFromAddress(data.installationSiteAddress);

    const newInstrument: Instrument = {
      id: 'inst-' + Math.random().toString(36).substring(2, 8),
      owner_id: this.state.currentUser.id,
      instrument_type: data.instrumentType,
      make: data.make,
      model: data.model,
      serial_number: data.serialNumber.trim(),
      capacity: data.capacity,
      accuracy_class: data.accuracyClass,
      installation_site_address: data.installationSiteAddress,
      jurisdiction_id: jurisdiction.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.instruments.push(newInstrument);
    this.recordAudit('instrument.registered', 'instrument', newInstrument.id, {
      type: newInstrument.instrument_type,
      serial: newInstrument.serial_number,
      jurisdiction: jurisdiction.name,
    });
    this.saveState();
    return { success: true, instrument: newInstrument };
  }

  // =================== SCHEDULING ENGINE (Feature 5 - Core Novelty) ===================
  /**
   * Deterministic, explainable, workload-aware scheduling algorithm per Section 10, Feature 5
   * 1. Filter candidates to jurisdiction match (LMO) or category match (GATC)
   * 2. Exclude inactive accounts
   * 3. Among remaining candidates, pick the one with FEWEST currently open applications (status in {"assigned","in_progress"})
   * 4. Tie-break by whichever candidate has gone longest without a new assignment (fairness)
   * 5. If no eligible candidate exists, leave status = "submitted" and alert Admin
   */
  public assignApplication(applicationId: string): {
    assignedTo: User | null;
    reason: string;
  } {
    const app = this.state.applications.find((a) => a.id === applicationId);
    if (!app) return { assignedTo: null, reason: 'Application not found' };

    const instrument = this.state.instruments.find((i) => i.id === app.instrument_id);
    if (!instrument) return { assignedTo: null, reason: 'Instrument not found' };

    // Step 1 & 2: Candidates filter
    const activeUsers = this.state.users.filter((u) => u.is_active);

    const eligibleLMOs = activeUsers.filter(
      (u) => u.role === 'lmo' && u.jurisdiction_id === instrument.jurisdiction_id
    );

    const eligibleGATCs = activeUsers.filter(
      (u) =>
        u.role === 'gatc' &&
        u.gatc_approval_categories &&
        u.gatc_approval_categories.includes(instrument.instrument_type)
    );

    const candidates = [...eligibleLMOs, ...eligibleGATCs];

    if (candidates.length === 0) {
      // Step 5: No eligible officer found
      this.recordAudit('scheduling.no_eligible_candidate', 'application', app.id, {
        jurisdiction_id: instrument.jurisdiction_id,
        instrument_type: instrument.instrument_type,
      });
      return {
        assignedTo: null,
        reason: 'No active LMO or accredited GATC available for this jurisdiction/category. Placed in Admin unassigned queue.',
      };
    }

    // Step 3: Workload calculation (open cases = assigned or in_progress)
    const candidateWorkloads = candidates.map((cand) => {
      const openApps = this.state.applications.filter(
        (a) =>
          a.assigned_to_user_id === cand.id &&
          (a.status === 'assigned' || a.status === 'in_progress')
      );

      // Step 4: Tie-break metric (last assigned time)
      const assignedApps = this.state.applications.filter(
        (a) => a.assigned_to_user_id === cand.id && a.assigned_at
      );
      const latestAssignedTime = assignedApps.reduce((latest, a) => {
        const t = new Date(a.assigned_at!).getTime();
        return t > latest ? t : latest;
      }, 0);

      return {
        candidate: cand,
        openCount: openApps.length,
        lastAssignedTime: latestAssignedTime,
      };
    });

    // Sort by openCount ASC, then by lastAssignedTime ASC (longest without an assignment)
    candidateWorkloads.sort((a, b) => {
      if (a.openCount !== b.openCount) {
        return a.openCount - b.openCount;
      }
      return a.lastAssignedTime - b.lastAssignedTime;
    });

    const chosen = candidateWorkloads[0].candidate;
    const openCount = candidateWorkloads[0].openCount;

    // Mutate application
    app.status = 'assigned';
    app.assigned_to_user_id = chosen.id;
    app.assigned_at = new Date().toISOString();
    app.updated_at = new Date().toISOString();

    // Golden Rule #4: Audit log written in same transaction
    this.recordAudit('application.assigned', 'application', app.id, {
      assigned_to_user_id: chosen.id,
      assigned_to_name: chosen.full_name,
      role: chosen.role,
      active_workload: openCount,
      jurisdiction: instrument.jurisdiction_id,
    });

    // Notify the officer
    this.state.notifications.unshift({
      id: 'notif-' + Math.random().toString(36).substring(2, 7),
      user_id: chosen.id,
      title: 'New Verification Assigned',
      message: `Application ${app.id} for ${instrument.make} ${instrument.model} has been auto-assigned to your queue.`,
      is_read: false,
      type: 'info',
      created_at: new Date().toISOString(),
    });

    this.saveState();

    return {
      assignedTo: chosen,
      reason: `Assigned to ${chosen.full_name} (${chosen.role.toUpperCase()}) based on least open cases (${openCount}) in ${instrument.jurisdiction_id}.`,
    };
  }

  // =================== APPLICATION SUBMISSION (Feature 4) ===================
  public submitApplication(data: {
    instrumentId: string;
    applicationType: 'initial_verification' | 're_verification';
    photos?: string[];
  }): Application {
    const instrument = this.state.instruments.find((i) => i.id === data.instrumentId);
    if (!instrument) throw new Error('Instrument not found');

    // Check if there was a previous rejected application for this instrument
    const priorRejected = this.state.applications
      .filter((a) => a.instrument_id === data.instrumentId && a.status === 'rejected')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const newApp: Application = {
      id: 'app-' + Math.random().toString(36).substring(2, 9),
      instrument_id: data.instrumentId,
      application_type: data.applicationType,
      status: 'submitted',
      assigned_to_user_id: null,
      assigned_at: null,
      fee_paid: true, // Mock payment flag per spec
      rejection_reason: null,
      previous_application_id: priorRejected ? priorRejected.id : null,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.applications.unshift(newApp);

    this.recordAudit('application.submitted', 'application', newApp.id, {
      instrument_id: instrument.id,
      type: newApp.application_type,
      fee_paid: true,
      previous_application_id: newApp.previous_application_id,
    });

    this.saveState();
    return newApp;
  }

  // =================== FIELD VERIFICATION & CERTIFICATE ISSUANCE (Feature 6, 7) ===================
  public async submitInspection(data: {
    applicationId: string;
    readings: Record<string, any>;
    result: 'pass' | 'fail';
    rejectionReason?: string;
    photoUrl: string;
    gpsLat: number | null;
    gpsLng: number | null;
    officerAuthMethod: 'otp' | 'digital_signature';
  }): Promise<{ inspection: Inspection; certificate?: Certificate }> {
    const officer = this.state.currentUser;
    if (!officer || (officer.role !== 'lmo' && officer.role !== 'gatc')) {
      throw new Error('Unauthorized: Only an authenticated LMO or GATC can submit inspection records.');
    }

    const app = this.state.applications.find((a) => a.id === data.applicationId);
    if (!app) throw new Error('Application not found');

    // Jurisdiction / Category RBAC enforcement (Golden Rule #2 & #3)
    const instrument = this.state.instruments.find((i) => i.id === app.instrument_id);
    if (!instrument) throw new Error('Instrument not found');

    if (officer.role === 'lmo' && officer.jurisdiction_id !== instrument.jurisdiction_id) {
      throw new Error('Forbidden: LMO cannot inspect instruments outside assigned jurisdiction.');
    }

    if (
      officer.role === 'gatc' &&
      (!officer.gatc_approval_categories ||
        !officer.gatc_approval_categories.includes(instrument.instrument_type))
    ) {
      throw new Error('Forbidden: GATC is not approved for this instrument category.');
    }

    if (data.result === 'fail' && !data.rejectionReason) {
      throw new Error('Mandatory rejection reason required for failed verification.');
    }

    // Record Inspection
    const newInspection: Inspection = {
      id: 'insp-' + Math.random().toString(36).substring(2, 8),
      application_id: app.id,
      officer_id: officer.id,
      readings_json: data.readings,
      result: data.result,
      photo_url: data.photoUrl,
      gps_lat: data.gpsLat,
      gps_lng: data.gpsLng,
      officer_auth_method: data.officerAuthMethod,
      inspected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.inspections.unshift(newInspection);

    this.recordAudit('inspection.recorded', 'inspection', newInspection.id, {
      application_id: app.id,
      result: data.result,
      gps_lat: data.gpsLat,
      gps_lng: data.gpsLng,
      auth_method: data.officerAuthMethod,
    });

    let newCertificate: Certificate | undefined;

    if (data.result === 'pass') {
      app.status = 'completed';
      app.updated_at = new Date().toISOString();

      // Certificate Service (Feature 7)
      const validityMonths =
        this.state.rulesConfig.validity_period_by_category_json[instrument.instrument_type] || 12;

      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

      const year = issueDate.getFullYear();
      const stateCode = 'DL';
      const seq = Math.floor(100000 + Math.random() * 900000);
      const certificateNumber = `MS-${year}-${stateCode}-${seq}`;

      const origin = window.location.origin;
      const qrPayloadUrl = `${origin}/verify/${certificateNumber}`;

      newCertificate = {
        id: 'cert-' + Math.random().toString(36).substring(2, 8),
        application_id: app.id,
        certificate_number: certificateNumber,
        instrument_id: instrument.id,
        issued_by_user_id: officer.id,
        issue_date: issueDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'active',
        qr_payload_url: qrPayloadUrl,
        signed_pdf_url: `/storage/certificates/${certificateNumber}.pdf`,
        revoked_reason: null,
        revoked_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.state.certificates.unshift(newCertificate);

      this.recordAudit('certificate.issued', 'certificate', newCertificate.id, {
        certificate_number: certificateNumber,
        validity_months: validityMonths,
        qr_payload: qrPayloadUrl,
      });

      // Notify owner
      this.state.notifications.unshift({
        id: 'notif-' + Math.random().toString(36).substring(2, 7),
        user_id: instrument.owner_id,
        title: 'Verification Certificate Issued',
        message: `Certificate ${certificateNumber} has been issued for ${instrument.make} ${instrument.model}. It is now valid and publicly verifiable.`,
        is_read: false,
        type: 'success',
        created_at: new Date().toISOString(),
      });
    } else {
      // Rejection
      app.status = 'rejected';
      app.rejection_reason = data.rejectionReason || 'Inspection failed permissible error tolerances.';
      app.updated_at = new Date().toISOString();

      this.recordAudit('application.rejected', 'application', app.id, {
        reason: app.rejection_reason,
      });

      // Notify owner of rejection
      this.state.notifications.unshift({
        id: 'notif-' + Math.random().toString(36).substring(2, 7),
        user_id: instrument.owner_id,
        title: 'Verification Rejected',
        message: `Application ${app.id} for ${instrument.make} ${instrument.model} was rejected: "${app.rejection_reason}". You may address the issues and re-apply.`,
        is_read: false,
        type: 'alert',
        created_at: new Date().toISOString(),
      });
    }

    this.saveState();
    return { inspection: newInspection, certificate: newCertificate };
  }

  // =================== REVOCATION SUPPORT (Feature 12) ===================
  public revokeCertificate(certificateId: string, reason: string): { success: boolean; error?: string } {
    const actor = this.state.currentUser;
    if (!actor || (actor.role !== 'admin' && actor.role !== 'lmo')) {
      return { success: false, error: 'Unauthorized: Only Admin or LMO can revoke certificates.' };
    }
    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'A mandatory, detailed reason is required for certificate revocation.' };
    }

    const cert = this.state.certificates.find((c) => c.id === certificateId);
    if (!cert) return { success: false, error: 'Certificate not found.' };

    const instrument = this.state.instruments.find((i) => i.id === cert.instrument_id);
    if (actor.role === 'lmo' && instrument && instrument.jurisdiction_id !== actor.jurisdiction_id) {
      return { success: false, error: 'LMO cannot revoke certificates outside assigned jurisdiction.' };
    }

    cert.status = 'revoked';
    cert.revoked_reason = reason;
    cert.revoked_at = new Date().toISOString();
    cert.updated_at = new Date().toISOString();

    this.recordAudit('certificate.revoked', 'certificate', cert.id, {
      certificate_number: cert.certificate_number,
      reason,
      actor: actor.full_name,
    });

    if (instrument) {
      this.state.notifications.unshift({
        id: 'notif-' + Math.random().toString(36).substring(2, 7),
        user_id: instrument.owner_id,
        title: 'Certificate Revoked',
        message: `Certificate ${cert.certificate_number} has been revoked by Legal Metrology Department: ${reason}`,
        is_read: false,
        type: 'alert',
        created_at: new Date().toISOString(),
      });
    }

    this.saveState();
    return { success: true };
  }

  // =================== NIGHTLY LIFECYCLE SCANNER (Feature 9) ===================
  public runLifecycleScan(): { scanned: number; expiringSoon: number; expired: number } {
    const today = new Date();
    const thresholdDays = this.state.rulesConfig.alert_threshold_days || 30;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    this.state.certificates.forEach((cert) => {
      if (cert.status === 'revoked') return;

      const expDate = new Date(cert.expiry_date);
      const diffMs = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0 && cert.status !== 'expired') {
        cert.status = 'expired';
        cert.updated_at = new Date().toISOString();
        expiredCount++;
        this.recordAudit('certificate.expired', 'certificate', cert.id, {
          certificate_number: cert.certificate_number,
          expired_on: cert.expiry_date,
        }, null);
      } else if (diffDays > 0 && diffDays <= thresholdDays && cert.status === 'active') {
        cert.status = 'expiring_soon';
        cert.updated_at = new Date().toISOString();
        expiringSoonCount++;
        this.recordAudit('certificate.expiring_soon', 'certificate', cert.id, {
          certificate_number: cert.certificate_number,
          days_remaining: diffDays,
        }, null);
      }
    });

    this.saveState();
    return {
      scanned: this.state.certificates.length,
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
    };
  }

  // =================== OFFLINE INSPECTION QUEUE (Feature 6 & Part I) ===================
  public saveOfflineInspection(data: any) {
    try {
      const existing = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      existing.push({ ...data, queued_at: new Date().toISOString() });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
      return true;
    } catch {
      return false;
    }
  }

  public getOfflineInspections() {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  public clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  // =================== QR CODE GENERATOR ===================
  public async generateQrCodeDataUrl(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 260,
        margin: 1.5,
        color: {
          dark: '#0F2A4A',
          light: '#FFFFFF',
        },
      });
    } catch (e) {
      console.error('QR code generation error', e);
      return '';
    }
  }

  // Reset database to initial seed
  public resetToSeed() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      currentUser: INITIAL_USERS[7],
      users: INITIAL_USERS,
      jurisdictions: INITIAL_JURISDICTIONS,
      instruments: INITIAL_INSTRUMENTS,
      applications: INITIAL_APPLICATIONS,
      inspections: INITIAL_INSPECTIONS,
      certificates: INITIAL_CERTIFICATES,
      auditLogs: INITIAL_AUDIT_LOGS,
      rulesConfig: INITIAL_RULES_CONFIG,
      notifications: INITIAL_NOTIFICATIONS,
    };
    this.saveState();
  }
}

export const store = new Store();
