/**
 * Resilient In-Memory Data Store for Next.js (Vercel Serverless / Edge compatible)
 *
 * Provides a dynamic, reactive state layer that supports real-time operations
 * for caller profiles, bank transactions, escalations, manager approvals,
 * call metrics, and threat monitoring.
 */

export interface CallerProfile {
  user_id: string;
  name: string;
  phone: string;
  language_preference: string;
  account_active: boolean;
  safe_key?: string;
  balance_inr: number;
  kyc_status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  facts: Record<string, any>;
  last_interaction: string;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  transaction_id: string;
  user_id: string;
  requester_name: string;
  transaction_type: 'TRANSFER' | 'SCHEME_DEBIT' | 'OVERDRAFT_WITHDRAWAL';
  amount_inr: number;
  recipient_account?: string;
  recipient_name?: string;
  safe_key_used?: string;
  status: 'COMPLETED' | 'PENDING_MANAGER_APPROVAL' | 'REJECTED';
  manager_request_id?: string;
  notes?: string;
  created_at: string;
}

export interface EscalationTicket {
  reference_id: string;
  user_id: string;
  requester_name: string;
  contact_hint: string;
  issue_description: string;
  category: string;
  trigger_type: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  status: 'open' | 'in_progress' | 'resolved';
  preferred_language: string;
  nodal_officer: string;
  created_at: string;
  updated_at: string;
}

export interface ManagerRequestItem {
  request_id: string;
  request_type: 'ACCOUNT_ACTIVATION' | 'TRANSACTION_TRANSFER' | 'OVERDRAFT_REQUEST';
  requester_name: string;
  user_id: string;
  safe_key?: string;
  details: Record<string, any>;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CallRecord {
  call_id: string;
  channel: 'browser' | 'sip';
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  outcome: 'success' | 'failed' | null;
  failure_type: string | null;
  eligibility_completed: boolean;
  document_list_delivered: boolean;
  escalation_created: boolean;
  scheme_codes: string[];
  user_turns: number;
  first_reply_latency_ms: number | null;
  last_reply_latency_ms: number | null;
  connected: boolean;
}

export interface SecurityEvent {
  event_id: string;
  fingerprint: string;
  threat_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'BANNED' | 'RESOLVED';
  reason: string;
  detected_at: string;
}

interface ServerStore {
  profiles: Map<string, CallerProfile>;
  transactions: BankTransaction[];
  escalations: EscalationTicket[];
  managerRequests: ManagerRequestItem[];
  calls: CallRecord[];
  bannedFingerprints: Set<string>;
  securityEvents: SecurityEvent[];
}

// Global singleton across hot reloads and serverless function instances in same lambda
const globalStore = global as unknown as { __JAN_SAHAY_STORE__?: ServerStore };

function initStore(): ServerStore {
  const initialProfiles = new Map<string, CallerProfile>();

  const seedProfiles: CallerProfile[] = [
    {
      user_id: 'raj_verma',
      name: 'Raj Verma',
      phone: '+91 98765 43210',
      language_preference: 'hi',
      account_active: true,
      safe_key: 'RAJ-2026',
      balance_inr: 45200,
      kyc_status: 'VERIFIED',
      facts: {
        last_topic: 'PMSBY accident cover inquiry',
        last_eligibility_scheme: 'PMSBY',
        last_eligibility_status: 'likely_eligible',
      },
      last_interaction: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      user_id: 'priya_sharma',
      name: 'Priya Sharma',
      phone: '+91 91234 56789',
      language_preference: 'en',
      account_active: true,
      safe_key: 'PRIYA-8812',
      balance_inr: 89400,
      kyc_status: 'VERIFIED',
      facts: {
        last_topic: 'APY pension scheme auto-debit',
        last_eligibility_scheme: 'APY',
        last_eligibility_status: 'likely_eligible',
      },
      last_interaction: new Date(Date.now() - 7200000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      user_id: 'amit_kumar',
      name: 'Amit Kumar',
      phone: '+91 97890 12345',
      language_preference: 'hi',
      account_active: false,
      safe_key: 'AMIT-4491',
      balance_inr: 12000,
      kyc_status: 'PENDING',
      facts: {
        last_topic: 'Account registration and document verification',
      },
      last_interaction: new Date(Date.now() - 1800000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      user_id: 'sunita_devi',
      name: 'Sunita Devi',
      phone: '+91 94567 89012',
      language_preference: 'hi',
      account_active: true,
      safe_key: 'SUNITA-9021',
      balance_inr: 27500,
      kyc_status: 'VERIFIED',
      facts: {
        last_topic: 'PMJDY zero-balance savings account and RuPay insurance',
        last_eligibility_scheme: 'PMJDY',
        last_eligibility_status: 'likely_eligible',
      },
      last_interaction: new Date(Date.now() - 10800000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      updated_at: new Date(Date.now() - 10800000).toISOString(),
    },
  ];

  seedProfiles.forEach((p) => initialProfiles.set(p.user_id, p));

  const initialEscalations: EscalationTicket[] = [
    {
      reference_id: 'ESC-2026-8819',
      user_id: 'amit_kumar',
      requester_name: 'Amit Kumar',
      contact_hint: '+91 97890 12345',
      issue_description:
        'Aadhaar KYC document mismatch during PMJDY account registration verification.',
      category: 'Scheme Eligibility',
      trigger_type: 'complex_decision',
      urgency: 'medium',
      status: 'in_progress',
      preferred_language: 'hi',
      nodal_officer: 'S. K. Verma (Lead Investigator)',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      reference_id: 'ESC-2026-5120',
      user_id: 'anita_singh',
      requester_name: 'Anita Singh',
      contact_hint: '+91 98112 34567',
      issue_description:
        'Reported suspect phishing SMS claiming bank account freeze with malicious link.',
      category: 'Fraud Report',
      trigger_type: 'fraud_suspected',
      urgency: 'high',
      status: 'open',
      preferred_language: 'en',
      nodal_officer: 'Sunil Nair (Cyber Cell Analyst)',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
  ];

  const initialManagerRequests: ManagerRequestItem[] = [
    {
      request_id: 'MR-ACT-9912',
      request_type: 'ACCOUNT_ACTIVATION',
      requester_name: 'Amit Kumar',
      user_id: 'amit_kumar',
      safe_key: 'AMIT-4491',
      details: {
        intent: 'New account activation request with PMJDY zero balance link',
        initial_deposit: 12000,
        phone: '+91 97890 12345',
      },
      status: 'PENDING_APPROVAL',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      request_id: 'MR-TX-3341',
      request_type: 'TRANSACTION_TRANSFER',
      requester_name: 'Raj Verma',
      user_id: 'raj_verma',
      safe_key: 'RAJ-2026',
      details: {
        intent: 'Inter-bank fund transfer to verified beneficiary',
        amount_inr: 15000,
        recipient: 'Priya Sharma (PRIYA-8812)',
        status: 'CREDENTIALS_VERIFIED',
      },
      status: 'PENDING_APPROVAL',
      created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    },
    {
      request_id: 'MR-OD-7721',
      request_type: 'OVERDRAFT_REQUEST',
      requester_name: 'Sunita Devi',
      user_id: 'sunita_devi',
      safe_key: 'SUNITA-9021',
      details: {
        intent: 'PMJDY Overdraft facility limit request of ₹10,000',
        amount_inr: 10000,
        scheme: 'PMJDY',
      },
      status: 'APPROVED',
      resolution_notes: 'Approved by Senior Manager based on 6-month satisfactory transaction history.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString(),
    },
  ];

  const initialTransactions: BankTransaction[] = [
    {
      transaction_id: 'TXN-908123',
      user_id: 'priya_sharma',
      requester_name: 'Priya Sharma',
      transaction_type: 'SCHEME_DEBIT',
      amount_inr: 436,
      recipient_name: 'PMJJBY Life Insurance Premium Pool',
      safe_key_used: 'PRIYA-8812',
      status: 'COMPLETED',
      notes: 'Annual auto-debit premium for PMJJBY life cover',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      transaction_id: 'TXN-774102',
      user_id: 'raj_verma',
      requester_name: 'Raj Verma',
      transaction_type: 'TRANSFER',
      amount_inr: 15000,
      recipient_name: 'Priya Sharma',
      recipient_account: 'ACC-8812-PRIYA',
      safe_key_used: 'RAJ-2026',
      status: 'PENDING_MANAGER_APPROVAL',
      manager_request_id: 'MR-TX-3341',
      notes: 'Transfer awaiting Senior Manager approval',
      created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    },
  ];

  const initialCalls: CallRecord[] = [
    {
      call_id: 'c_9a8b7c6d',
      channel: 'browser',
      started_at: new Date(Date.now() - 1800000).toISOString(),
      ended_at: new Date(Date.now() - 1650000).toISOString(),
      duration_seconds: 150,
      outcome: 'success',
      failure_type: null,
      eligibility_completed: true,
      document_list_delivered: true,
      escalation_created: false,
      scheme_codes: ['pmsby', 'pmjjby'],
      user_turns: 8,
      first_reply_latency_ms: 380,
      last_reply_latency_ms: 410,
      connected: true,
    },
    {
      call_id: 'c_4e5f6a7b',
      channel: 'browser',
      started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      ended_at: new Date(Date.now() - 3600000 * 2 + 95000).toISOString(),
      duration_seconds: 95,
      outcome: 'success',
      failure_type: null,
      eligibility_completed: true,
      document_list_delivered: false,
      escalation_created: true,
      scheme_codes: ['pmjdy'],
      user_turns: 5,
      first_reply_latency_ms: 420,
      last_reply_latency_ms: 395,
      connected: true,
    },
    {
      call_id: 'c_11223344',
      channel: 'sip',
      started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      ended_at: new Date(Date.now() - 3600000 * 5 + 180000).toISOString(),
      duration_seconds: 180,
      outcome: 'success',
      failure_type: null,
      eligibility_completed: true,
      document_list_delivered: true,
      escalation_created: false,
      scheme_codes: ['apy'],
      user_turns: 11,
      first_reply_latency_ms: 350,
      last_reply_latency_ms: 370,
      connected: true,
    },
    {
      call_id: 'c_deadbeef',
      channel: 'browser',
      started_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      ended_at: new Date(Date.now() - 3600000 * 8 + 12000).toISOString(),
      duration_seconds: 12,
      outcome: 'failed',
      failure_type: 'cancelled_before_connect',
      eligibility_completed: false,
      document_list_delivered: false,
      escalation_created: false,
      scheme_codes: [],
      user_turns: 1,
      first_reply_latency_ms: null,
      last_reply_latency_ms: null,
      connected: false,
    },
  ];

  const initialSecurityEvents: SecurityEvent[] = [
    {
      event_id: 'EVT-SEC-1092',
      fingerprint: 'fp_ip_203_0_113_45',
      threat_type: 'Aggressive Credential Probing',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      reason: 'Repeated unauthorized safe key attempts mitigated.',
      detected_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ];

  return {
    profiles: initialProfiles,
    transactions: initialTransactions,
    escalations: initialEscalations,
    managerRequests: initialManagerRequests,
    calls: initialCalls,
    bannedFingerprints: new Set<string>(),
    securityEvents: initialSecurityEvents,
  };
}

if (!globalStore.__JAN_SAHAY_STORE__) {
  globalStore.__JAN_SAHAY_STORE__ = initStore();
}

const store = globalStore.__JAN_SAHAY_STORE__;

// ============================================================================
// PROFILES API
// ============================================================================
export function getProfiles(search?: string): CallerProfile[] {
  let list = Array.from(store.profiles.values());
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.user_id.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.safe_key && p.safe_key.toLowerCase().includes(q)),
    );
  }
  return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function getProfile(userIdOrName: string): CallerProfile | null {
  const uid = userIdOrName.trim().toLowerCase().replace(/\s+/g, '_');
  if (store.profiles.has(uid)) return store.profiles.get(uid)!;

  for (const p of store.profiles.values()) {
    if (p.name.toLowerCase() === userIdOrName.trim().toLowerCase()) {
      return p;
    }
  }
  return null;
}

export function createProfile(data: {
  name: string;
  phone?: string;
  language_preference?: string;
  balance_inr?: number;
  safe_key?: string;
  kyc_status?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  facts?: Record<string, any>;
}): CallerProfile {
  const nameClean = data.name.trim();
  const userId = nameClean.toLowerCase().replace(/\s+/g, '_');
  const now = new Date().toISOString();

  const profile: CallerProfile = {
    user_id: userId,
    name: nameClean,
    phone: data.phone || '+91 9' + Math.floor(100000000 + Math.random() * 900000000),
    language_preference: data.language_preference || 'hi',
    account_active: data.kyc_status === 'VERIFIED',
    safe_key: data.safe_key || `${nameClean.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
    balance_inr: data.balance_inr ?? 25000,
    kyc_status: data.kyc_status || 'VERIFIED',
    facts: data.facts || { notes: 'Registered via Jan Sahay Web Portal' },
    last_interaction: now,
    created_at: now,
    updated_at: now,
  };

  store.profiles.set(userId, profile);
  return profile;
}

export function updateProfile(
  userId: string,
  updates: Partial<CallerProfile>,
): CallerProfile | null {
  const existing = store.profiles.get(userId);
  if (!existing) return null;

  const updated: CallerProfile = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  store.profiles.set(userId, updated);
  return updated;
}

// ============================================================================
// TRANSACTIONS API
// ============================================================================
export function getTransactions(): BankTransaction[] {
  return [...store.transactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function createTransaction(data: {
  user_id: string;
  requester_name: string;
  transaction_type: 'TRANSFER' | 'SCHEME_DEBIT' | 'OVERDRAFT_WITHDRAWAL';
  amount_inr: number;
  recipient_account?: string;
  recipient_name?: string;
  safe_key?: string;
  requires_approval?: boolean;
  notes?: string;
}): BankTransaction {
  const txId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();
  const requiresApproval =
    data.requires_approval ?? (data.amount_inr > 5000 || data.transaction_type === 'OVERDRAFT_WITHDRAWAL');

  let managerReqId: string | undefined;

  if (requiresApproval) {
    const managerReq = createManagerRequest({
      request_type:
        data.transaction_type === 'OVERDRAFT_WITHDRAWAL'
          ? 'OVERDRAFT_REQUEST'
          : 'TRANSACTION_TRANSFER',
      requester_name: data.requester_name,
      user_id: data.user_id,
      safe_key: data.safe_key,
      details: {
        transaction_id: txId,
        amount_inr: data.amount_inr,
        recipient: data.recipient_name || data.recipient_account || 'Beneficiary',
        notes: data.notes,
      },
    });
    managerReqId = managerReq.request_id;
  }

  const tx: BankTransaction = {
    transaction_id: txId,
    user_id: data.user_id,
    requester_name: data.requester_name,
    transaction_type: data.transaction_type,
    amount_inr: data.amount_inr,
    recipient_account: data.recipient_account,
    recipient_name: data.recipient_name,
    safe_key_used: data.safe_key,
    status: requiresApproval ? 'PENDING_MANAGER_APPROVAL' : 'COMPLETED',
    manager_request_id: managerReqId,
    notes: data.notes,
    created_at: now,
  };

  store.transactions.unshift(tx);

  // If immediately completed, adjust sender balance if profile exists
  if (!requiresApproval) {
    const profile = store.profiles.get(data.user_id);
    if (profile && profile.balance_inr >= data.amount_inr) {
      updateProfile(data.user_id, {
        balance_inr: profile.balance_inr - data.amount_inr,
      });
    }
  }

  return tx;
}

// ============================================================================
// ESCALATIONS API
// ============================================================================
export function getEscalations(): EscalationTicket[] {
  return [...store.escalations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function createEscalation(data: {
  user_id?: string;
  requester_name?: string;
  contact_hint?: string;
  issue_description: string;
  category?: string;
  trigger_type?: string;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  preferred_language?: string;
}): EscalationTicket {
  const refId = `ESC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  let nodalOfficer = 'S. K. Verma (Lead Investigator)';
  if (data.trigger_type === 'fraud_suspected' || data.category === 'Fraud Report') {
    nodalOfficer = 'Sunil Nair (Cyber Cell Analyst)';
  } else if (data.urgency === 'emergency') {
    nodalOfficer = 'Emergency Incident Response Desk';
  }

  const ticket: EscalationTicket = {
    reference_id: refId,
    user_id: data.user_id || 'web_user_' + Math.floor(Math.random() * 1000),
    requester_name: data.requester_name || 'Anonymous Caller',
    contact_hint: data.contact_hint || 'Web Portal',
    issue_description: data.issue_description,
    category: data.category || 'General Escalation',
    trigger_type: data.trigger_type || 'user_requested',
    urgency: data.urgency || 'medium',
    status: 'open',
    preferred_language: data.preferred_language || 'hi',
    nodal_officer: nodalOfficer,
    created_at: now,
    updated_at: now,
  };

  store.escalations.unshift(ticket);
  return ticket;
}

// ============================================================================
// MANAGER APPROVALS API
// ============================================================================
export function getManagerRequests(status?: string, type?: string): ManagerRequestItem[] {
  let list = [...store.managerRequests];
  if (status && status !== 'ALL') {
    list = list.filter((r) => r.status === status);
  }
  if (type && type !== 'ALL') {
    list = list.filter((r) => r.request_type === type);
  }
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function createManagerRequest(data: {
  request_type: 'ACCOUNT_ACTIVATION' | 'TRANSACTION_TRANSFER' | 'OVERDRAFT_REQUEST';
  requester_name: string;
  user_id?: string;
  safe_key?: string;
  details?: Record<string, any>;
}): ManagerRequestItem {
  const reqId = `MR-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const item: ManagerRequestItem = {
    request_id: reqId,
    request_type: data.request_type,
    requester_name: data.requester_name,
    user_id: data.user_id || data.requester_name.toLowerCase().replace(/\s+/g, '_'),
    safe_key: data.safe_key,
    details: data.details || {},
    status: 'PENDING_APPROVAL',
    created_at: now,
    updated_at: now,
  };

  store.managerRequests.unshift(item);
  return item;
}

export function approveManagerRequest(
  requestId: string,
  notes?: string,
): { ok: boolean; message: string } {
  const req = store.managerRequests.find((r) => r.request_id === requestId);
  if (!req) return { ok: false, message: 'Request not found' };

  req.status = 'APPROVED';
  req.resolution_notes = notes || 'Approved by Senior Manager';
  req.updated_at = new Date().toISOString();

  // If this was an account activation, activate user profile
  if (req.request_type === 'ACCOUNT_ACTIVATION') {
    const profile = store.profiles.get(req.user_id);
    if (profile) {
      updateProfile(req.user_id, {
        account_active: true,
        kyc_status: 'VERIFIED',
      });
    }
  }

  // If this was a transaction, complete the transaction and deduct balance
  if (req.request_type === 'TRANSACTION_TRANSFER' || req.request_type === 'OVERDRAFT_REQUEST') {
    const tx = store.transactions.find((t) => t.manager_request_id === requestId);
    if (tx) {
      tx.status = 'COMPLETED';
      const sender = store.profiles.get(tx.user_id);
      if (sender && sender.balance_inr >= tx.amount_inr) {
        updateProfile(tx.user_id, {
          balance_inr: sender.balance_inr - tx.amount_inr,
        });
      }
    }
  }

  return { ok: true, message: `Request ${requestId} approved successfully.` };
}

export function rejectManagerRequest(
  requestId: string,
  notes?: string,
): { ok: boolean; message: string } {
  const req = store.managerRequests.find((r) => r.request_id === requestId);
  if (!req) return { ok: false, message: 'Request not found' };

  req.status = 'REJECTED';
  req.resolution_notes = notes || 'Rejected by Senior Manager';
  req.updated_at = new Date().toISOString();

  // If this was a transaction, mark it rejected
  const tx = store.transactions.find((t) => t.manager_request_id === requestId);
  if (tx) {
    tx.status = 'REJECTED';
  }

  return { ok: true, message: `Request ${requestId} rejected.` };
}

// ============================================================================
// METRICS & CALL OUTCOMES API
// ============================================================================
export function getMetrics(channel?: string, sinceIso?: string) {
  let list = [...store.calls];
  if (channel && channel !== 'all') {
    list = list.filter((c) => c.channel === channel);
  }
  if (sinceIso) {
    const sinceTime = new Date(sinceIso).getTime();
    list = list.filter((c) => new Date(c.started_at).getTime() >= sinceTime);
  }

  const totalCalls = list.length;
  const successfulCalls = list.filter((c) => c.outcome === 'success').length;
  const failedCalls = list.filter((c) => c.outcome === 'failed').length;
  const successRate = totalCalls ? Math.round((successfulCalls / totalCalls) * 100) : 0;

  const eligibilityChecks = list.filter((c) => c.eligibility_completed).length;
  const documentLists = list.filter((c) => c.document_list_delivered).length;
  const escalations = list.filter((c) => c.escalation_created).length + store.escalations.length;

  const latencies = list
    .map((c) => c.first_reply_latency_ms)
    .filter((l): l is number => l !== null && l > 0);
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : null;

  const failureTypes: Record<string, number> = {};
  list.forEach((c) => {
    if (c.outcome === 'failed' && c.failure_type) {
      failureTypes[c.failure_type] = (failureTypes[c.failure_type] || 0) + 1;
    }
  });

  return {
    total_calls: totalCalls,
    successful_calls: successfulCalls,
    failed_calls: failedCalls,
    success_rate: successRate,
    eligibility_checks: eligibilityChecks,
    document_lists: documentLists,
    escalations: escalations,
    avg_first_reply_latency_ms: avgLatency,
    failure_types: failureTypes,
    recent_calls: list.slice(0, 20),
    specialist_handoffs: {
      total: eligibilityChecks + documentLists + escalations,
      government_schemes: eligibilityChecks + documentLists,
      digital_safety: escalations,
      account_support: store.managerRequests.length,
    },
  };
}

export function recordCallOutcome(data: Partial<CallRecord>): CallRecord {
  const record: CallRecord = {
    call_id: data.call_id || `c_${Math.random().toString(16).substring(2, 10)}`,
    channel: data.channel || 'browser',
    started_at: data.started_at || new Date().toISOString(),
    ended_at: data.ended_at || new Date().toISOString(),
    duration_seconds: data.duration_seconds ?? Math.floor(20 + Math.random() * 120),
    outcome: data.outcome ?? 'success',
    failure_type: data.failure_type ?? null,
    eligibility_completed: data.eligibility_completed ?? false,
    document_list_delivered: data.document_list_delivered ?? false,
    escalation_created: data.escalation_created ?? false,
    scheme_codes: data.scheme_codes ?? [],
    user_turns: data.user_turns ?? 4,
    first_reply_latency_ms: data.first_reply_latency_ms ?? Math.floor(320 + Math.random() * 120),
    last_reply_latency_ms: data.last_reply_latency_ms ?? Math.floor(340 + Math.random() * 140),
    connected: data.connected ?? true,
  };

  store.calls.unshift(record);
  return record;
}

export function clearCalls() {
  store.calls = [];
}

// ============================================================================
// SECURITY & THREAT ENGINE API
// ============================================================================
export function getSecurityPayload() {
  const activeThreats = store.securityEvents.filter((e) => e.status === 'ACTIVE').length;
  const bannedCount = store.bannedFingerprints.size;

  return {
    threat_level: bannedCount > 0 ? 'RESTRICTED' : activeThreats > 0 ? 'ELEVATED' : 'NOMINAL',
    threat_score: bannedCount * 30 + activeThreats * 15,
    active_threat_events: store.securityEvents.slice(0, 15),
    banned_fingerprints: Array.from(store.bannedFingerprints),
    total_mitigations: store.securityEvents.length + bannedCount,
    specialist_activity: {
      government_schemes: 18,
      digital_safety: 12,
      account_support: 14,
      security_interceptions: bannedCount + activeThreats,
    },
  };
}

export function banFingerprint(fingerprint: string, reason?: string) {
  store.bannedFingerprints.add(fingerprint);
  store.securityEvents.unshift({
    event_id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
    fingerprint,
    threat_type: 'Manual Administrator Ban',
    severity: 'CRITICAL',
    status: 'BANNED',
    reason: reason || 'Banned via Security Dashboard',
    detected_at: new Date().toISOString(),
  });
  return { ok: true, fingerprint, status: 'BANNED' };
}

export function unbanFingerprint(fingerprint: string) {
  store.bannedFingerprints.delete(fingerprint);
  return { ok: true, fingerprint, status: 'UNBANNED' };
}
