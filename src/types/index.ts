// Data models and types adhering strictly to Section 5 of the MaapSetu Spec

export type UserRole = 'owner' | 'lmo' | 'gatc' | 'admin';

export type InstrumentType =
  | 'weighing_scale'
  | 'fuel_dispenser'
  | 'water_meter'
  | 'taxi_meter'
  | 'other';

export type ApplicationType = 'initial_verification' | 're_verification';

export type ApplicationStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'rejected';

export type CertificateStatus =
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'revoked';

export type InspectionResult = 'pass' | 'fail';

export type OfficerAuthMethod = 'otp' | 'digital_signature';

export interface User {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  password_hash?: string;
  jurisdiction_id?: string | null;
  gatc_approval_categories?: InstrumentType[] | null;
  business_id?: string | null; // GSTIN-style ID for owner
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Jurisdiction {
  id: string;
  name: string;
  state: string;
  district_code: string;
  created_at: string;
  updated_at: string;
}

export interface Instrument {
  id: string;
  owner_id: string;
  instrument_type: InstrumentType;
  make: string;
  model: string;
  serial_number: string;
  capacity: string;
  accuracy_class: string;
  installation_site_address: string;
  jurisdiction_id: string;
  created_at: string;
  updated_at: string;
  // Computed / joined fields for display
  current_certificate?: Certificate | null;
  latest_application?: Application | null;
}

export interface Application {
  id: string;
  instrument_id: string;
  application_type: ApplicationType;
  status: ApplicationStatus;
  assigned_to_user_id: string | null;
  assigned_at: string | null;
  fee_paid: boolean;
  rejection_reason: string | null;
  previous_application_id: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields for display
  instrument?: Instrument;
  assigned_officer?: User;
  inspection?: Inspection;
  certificate?: Certificate;
}

export interface Inspection {
  id: string;
  application_id: string;
  officer_id: string;
  readings_json: Record<string, any>;
  result: InspectionResult;
  photo_url: string;
  gps_lat: number | null;
  gps_lng: number | null;
  officer_auth_method: OfficerAuthMethod;
  inspected_at: string;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  application_id: string;
  certificate_number: string;
  instrument_id: string;
  issued_by_user_id: string;
  issue_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  status: CertificateStatus;
  qr_payload_url: string;
  signed_pdf_url: string;
  revoked_reason?: string | null;
  revoked_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  instrument?: Instrument;
  issuer?: User;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null; // null for anonymous public verify lookup
  actor_role: string;
  jurisdiction_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  device_info: string;
  metadata_json?: Record<string, any> | null;
  created_at: string;
}

export interface RulesConfig {
  id: string;
  state: string;
  fee_schedule_json: Record<InstrumentType, number>;
  jurisdiction_boundaries_json: Record<string, string[]>;
  escalation_rules_json: {
    max_days_to_assign: number;
    max_days_to_inspect: number;
  };
  validity_period_by_category_json: Record<InstrumentType, number>; // in months
  alert_threshold_days: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: 'info' | 'warning' | 'alert' | 'success';
  created_at: string;
}
