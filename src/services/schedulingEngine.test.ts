import { assignApplicationPure } from './schedulingEngine';
import { User, Instrument, Application } from '../types';

// Standalone self-verifying test suite for Section 10 Feature 5
export function runSchedulingEngineTests(): {
  name: string;
  passed: boolean;
  message: string;
}[] {
  const results: { name: string; passed: boolean; message: string }[] = [];

  const mockUsers: User[] = [
    {
      id: 'lmo-1',
      role: 'lmo',
      full_name: 'Officer Alpha',
      email: 'alpha@gov.in',
      phone: '1111111111',
      jurisdiction_id: 'jur-north',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'lmo-2',
      role: 'lmo',
      full_name: 'Officer Beta',
      email: 'beta@gov.in',
      phone: '2222222222',
      jurisdiction_id: 'jur-north',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'lmo-inactive',
      role: 'lmo',
      full_name: 'Officer Gamma (Inactive)',
      email: 'gamma@gov.in',
      phone: '3333333333',
      jurisdiction_id: 'jur-north',
      is_active: false,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'gatc-fuel',
      role: 'gatc',
      full_name: 'GATC Fuel Testing Hub',
      email: 'fuel@gatc.org',
      phone: '4444444444',
      jurisdiction_id: null,
      gatc_approval_categories: ['fuel_dispenser'],
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  const scaleInst: Pick<Instrument, 'id' | 'instrument_type' | 'jurisdiction_id'> = {
    id: 'inst-test-1',
    instrument_type: 'weighing_scale',
    jurisdiction_id: 'jur-north',
  };

  // Test 1: (a) Picks the least-loaded officer
  {
    const currentApps: Pick<Application, 'assigned_to_user_id' | 'status' | 'assigned_at'>[] = [
      { assigned_to_user_id: 'lmo-1', status: 'assigned', assigned_at: '2026-01-05T10:00:00Z' },
      { assigned_to_user_id: 'lmo-1', status: 'in_progress', assigned_at: '2026-01-05T11:00:00Z' },
      { assigned_to_user_id: 'lmo-2', status: 'assigned', assigned_at: '2026-01-05T12:00:00Z' },
    ];
    // Officer Alpha has 2 open cases, Officer Beta has 1 open case.
    const res = assignApplicationPure({ id: 'app-new', instrument_id: 'inst-test-1' }, scaleInst, mockUsers, currentApps);
    const passed = res.candidate?.id === 'lmo-2' && res.status === 'assigned';
    results.push({
      name: 'Test (a): Picks the least-loaded officer',
      passed,
      message: passed
        ? 'Successfully assigned to Officer Beta (1 open case vs Alpha with 2).'
        : `Failed: Expected lmo-2, got ${res.candidate?.id}`,
    });
  }

  // Test 2: (b) Breaks a tie correctly (whichever went longest without assignment)
  {
    const currentApps: Pick<Application, 'assigned_to_user_id' | 'status' | 'assigned_at'>[] = [
      { assigned_to_user_id: 'lmo-1', status: 'assigned', assigned_at: '2026-01-01T10:00:00Z' }, // older
      { assigned_to_user_id: 'lmo-2', status: 'assigned', assigned_at: '2026-01-04T10:00:00Z' }, // newer
    ];
    // Both have 1 open case. lmo-1 was assigned longer ago.
    const res = assignApplicationPure({ id: 'app-tie', instrument_id: 'inst-test-1' }, scaleInst, mockUsers, currentApps);
    const passed = res.candidate?.id === 'lmo-1' && res.status === 'assigned';
    results.push({
      name: 'Test (b): Breaks a tie by assignment fairness/recency',
      passed,
      message: passed
        ? 'Successfully selected Officer Alpha who waited longer since last assignment.'
        : `Failed: Expected lmo-1, got ${res.candidate?.id}`,
    });
  }

  // Test 3: (c) Handles "no eligible officer" gracefully without crashing
  {
    const southInst: Pick<Instrument, 'id' | 'instrument_type' | 'jurisdiction_id'> = {
      id: 'inst-south',
      instrument_type: 'water_meter',
      jurisdiction_id: 'jur-south-remote',
    };
    const res = assignApplicationPure({ id: 'app-no-officer', instrument_id: 'inst-south' }, southInst, mockUsers, []);
    const passed = res.candidate === null && res.status === 'submitted';
    results.push({
      name: 'Test (c): Handles no eligible officer gracefully (leaves status submitted)',
      passed,
      message: passed
        ? 'Safely flagged as unassigned submitted application with clear reason.'
        : `Failed: Expected null candidate, got ${res.candidate?.id}`,
    });
  }

  return results;
}
