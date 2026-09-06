import { User, Instrument, Application, InstrumentType } from '../types';

export interface SchedulingCandidate extends User {
  openCaseCount?: number;
  lastAssignedTime?: number;
}

export interface SchedulingResult {
  candidate: User | null;
  reason: string;
  status: 'assigned' | 'submitted';
}

/**
 * Pure, deterministic, explainable rules-based assignment engine per Section 10, Feature 5.
 * NO MACHINE LEARNING. Completely testable and transparent.
 */
export function assignApplicationPure(
  application: Pick<Application, 'id' | 'instrument_id'>,
  instrument: Pick<Instrument, 'id' | 'instrument_type' | 'jurisdiction_id'>,
  candidates: User[],
  currentApplications: Pick<Application, 'assigned_to_user_id' | 'status' | 'assigned_at'>[]
): SchedulingResult {
  // 1. Filter candidates to jurisdiction match (LMO) or category match (GATC)
  // 2. Exclude inactive/deactivated accounts
  const eligible = candidates.filter((cand) => {
    if (!cand.is_active) return false;

    if (cand.role === 'lmo') {
      return cand.jurisdiction_id === instrument.jurisdiction_id;
    }

    if (cand.role === 'gatc') {
      return (
        cand.gatc_approval_categories &&
        cand.gatc_approval_categories.includes(instrument.instrument_type as InstrumentType)
      );
    }

    return false;
  });

  // 5. If no eligible candidate exists, leave status = "submitted"
  if (eligible.length === 0) {
    return {
      candidate: null,
      reason: `No active LMO in jurisdiction "${instrument.jurisdiction_id}" or accredited GATC for category "${instrument.instrument_type}".`,
      status: 'submitted',
    };
  }

  // 3. Among remaining candidates, pick the one with the FEWEST currently open applications (status in {"assigned", "in_progress"})
  const workloads = eligible.map((cand) => {
    const openApps = currentApplications.filter(
      (a) =>
        a.assigned_to_user_id === cand.id &&
        (a.status === 'assigned' || a.status === 'in_progress')
    );

    // 4. Tie-break by whichever candidate has gone longest without a new assignment (fairness)
    const assignedApps = currentApplications.filter(
      (a) => a.assigned_to_user_id === cand.id && a.assigned_at
    );
    const lastAssignedTime = assignedApps.reduce((latest, a) => {
      const t = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
      return t > latest ? t : latest;
    }, 0);

    return {
      candidate: cand,
      openCount: openApps.length,
      lastAssignedTime,
    };
  });

  workloads.sort((a, b) => {
    if (a.openCount !== b.openCount) {
      return a.openCount - b.openCount;
    }
    // Tie-break: lowest timestamp was assigned longest ago
    return a.lastAssignedTime - b.lastAssignedTime;
  });

  const winner = workloads[0];

  return {
    candidate: winner.candidate,
    reason: `Selected ${winner.candidate.full_name} (${winner.candidate.role.toUpperCase()}) with lowest active workload (${winner.openCount} open cases).`,
    status: 'assigned',
  };
}
