'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';

interface CallerProfile {
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

interface BankTransaction {
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

interface ProfileViewProps {
  onSwitchToTab?: (tab: string) => void;
}

export function ProfileView({ onSwitchToTab }: ProfileViewProps) {
  const [profiles, setProfiles] = useState<CallerProfile[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Sub-tab: 'PROFILES' | 'TRANSACTIONS'
  const [activeSubTab, setActiveSubTab] = useState<'PROFILES' | 'TRANSACTIONS'>('PROFILES');

  // New Profile Modal state
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLang, setNewLang] = useState('hi');
  const [newBalance, setNewBalance] = useState('25000');
  const [newSafeKey, setNewSafeKey] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // New Transaction Modal state
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [txSender, setTxSender] = useState('');
  const [txType, setTxType] = useState<'TRANSFER' | 'SCHEME_DEBIT' | 'OVERDRAFT_WITHDRAWAL'>('TRANSFER');
  const [txAmount, setTxAmount] = useState('');
  const [txRecipient, setTxRecipient] = useState('');
  const [txSafeKey, setTxSafeKey] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, tRes] = await Promise.all([
        fetch('/api/profiles', { cache: 'no-store' }),
        fetch('/api/transactions', { cache: 'no-store' }),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProfiles(Array.isArray(pData) ? pData : []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTransactions(Array.isArray(tData) ? tData : []);
      }
    } catch (err) {
      console.error('Failed to load profile/banking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Please enter caller name.');
      return;
    }

    setIsSubmittingProfile(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim() || undefined,
          language_preference: newLang,
          balance_inr: parseFloat(newBalance) || 25000,
          safe_key: newSafeKey.trim() || undefined,
          kyc_status: 'VERIFIED',
        }),
      });

      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: `Profile for ${newName.trim()} created successfully!`,
        });
        setShowNewProfileModal(false);
        setNewName('');
        setNewPhone('');
        setNewSafeKey('');
        await fetchData();
      } else {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create profile');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating profile');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txSender || !txAmount || Number(txAmount) <= 0) {
      alert('Please select a sender profile and specify a valid amount.');
      return;
    }

    setIsSubmittingTx(true);
    try {
      const senderProfile = profiles.find((p) => p.user_id === txSender);
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: txSender,
          requester_name: senderProfile?.name || txSender,
          transaction_type: txType,
          amount_inr: parseFloat(txAmount),
          recipient_name: txRecipient || 'Beneficiary Account',
          safe_key: txSafeKey || senderProfile?.safe_key,
          notes: txNotes || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setFeedbackMsg({
          type: 'success',
          text: json.message || 'Transaction processed successfully!',
        });
        setShowNewTxModal(false);
        setTxAmount('');
        setTxRecipient('');
        setTxNotes('');
        await fetchData();
      } else {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Transaction failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating transaction');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const toggleRevealKey = (userId: string) => {
    setRevealedKeys((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.user_id.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      (p.safe_key && p.safe_key.toLowerCase().includes(q))
    );
  });

  const totalVaultBalance = profiles.reduce((sum, p) => sum + (p.balance_inr || 0), 0);
  const activeKycCount = profiles.filter((p) => p.kyc_status === 'VERIFIED').length;
  const pendingApprovalsCount = transactions.filter((t) => t.status === 'PENDING_MANAGER_APPROVAL').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans text-slate-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Notification */}
        {feedbackMsg && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl p-4 text-sm font-semibold shadow-sm ${
              feedbackMsg.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-[#0f294a] md:text-3xl">
              <span className="rounded-xl bg-blue-50 p-2 text-[#0c538e]">
                <Users className="size-6 md:size-8" />
              </span>
              Caller Profiles & Banking Hub
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 md:text-base">
              Manage persistent caller memory profiles, Safe Keys, account KYC, and financial transactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowNewTxModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              <ArrowRightLeft className="size-4" />
              New Transaction
            </button>
            <button
              onClick={() => setShowNewProfileModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0c538e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#093d69]"
            >
              <UserPlus className="size-4" />
              Register Profile
            </button>
          </div>
        </div>

        {/* KPI Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Registered Profiles
              </span>
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Users className="size-5" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900">{profiles.length}</div>
            <p className="mt-1 text-xs text-slate-400">Persistent caller memory profiles</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Verified KYC
              </span>
              <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <ShieldCheck className="size-5" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-emerald-600">{activeKycCount}</div>
            <p className="mt-1 text-xs text-slate-400">Compliant with Aadhaar/PAN standards</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Total Vault Balance
              </span>
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Banknote className="size-5" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-indigo-700">
              ₹{totalVaultBalance.toLocaleString('en-IN')}
            </div>
            <p className="mt-1 text-xs text-slate-400">Total simulated deposit funds</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Pending Manager Approvals
              </span>
              <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Clock className="size-5" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-amber-600">{pendingApprovalsCount}</div>
            <p className="mt-1 text-xs text-slate-400">
              {onSwitchToTab ? (
                <button
                  onClick={() => onSwitchToTab('MANAGER_PORTAL')}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  View in Manager Portal &rarr;
                </button>
              ) : (
                'Awaiting Senior Manager verification'
              )}
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="mb-6 flex border-b border-slate-200">
          <button
            onClick={() => setActiveSubTab('PROFILES')}
            className={`border-b-2 px-6 py-3 text-sm font-bold transition ${
              activeSubTab === 'PROFILES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Caller Directory ({profiles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('TRANSACTIONS')}
            className={`border-b-2 px-6 py-3 text-sm font-bold transition ${
              activeSubTab === 'TRANSACTIONS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Transaction History ({transactions.length})
          </button>
        </div>

        {/* TAB 1: PROFILES DIRECTORY */}
        {activeSubTab === 'PROFILES' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <Search className="size-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search profiles by name, phone, safe key, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-700">
                  Clear
                </button>
              )}
            </div>

            {/* Profiles Cards Grid */}
            {filteredProfiles.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <Users className="mx-auto size-12 text-slate-300" />
                <h3 className="mt-3 text-base font-bold text-slate-700">No profiles found</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Try adjusting your search query or click "Register Profile" to add a new caller.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProfiles.map((p) => {
                  const isKeyRevealed = revealedKeys[p.user_id] || false;
                  return (
                    <div
                      key={p.user_id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 font-bold text-[#0c538e]">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{p.name}</h3>
                              <p className="text-xs text-slate-500">{p.phone}</p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              p.account_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.account_active ? 'Active Account' : 'Pending Activation'}
                          </span>
                        </div>

                        {/* Balance & Language */}
                        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                          <div>
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                              Balance
                            </span>
                            <div className="text-base font-extrabold text-slate-900">
                              ₹{(p.balance_inr || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                              Language
                            </span>
                            <div className="text-sm font-bold text-slate-700">
                              {p.language_preference === 'hi' ? 'Hindi (हिंदी)' : 'English'}
                            </div>
                          </div>
                        </div>

                        {/* Safe Key Section */}
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <KeyRound className="size-3.5 text-amber-600" />
                              Safe Key (Voice Auth):
                            </span>
                            <button
                              onClick={() => toggleRevealKey(p.user_id)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {isKeyRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                          <div className="mt-1 font-mono text-xs font-bold text-slate-800">
                            {isKeyRevealed ? p.safe_key || 'No Safe Key' : '••••••••••••'}
                          </div>
                        </div>

                        {/* Last topic / Memory notes */}
                        {p.facts && p.facts.last_topic && (
                          <div className="mt-3 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">Last Context:</span>{' '}
                            {p.facts.last_topic}
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
                        <button
                          onClick={() => {
                            setTxSender(p.user_id);
                            setShowNewTxModal(true);
                          }}
                          className="flex-1 rounded-lg border border-blue-200 bg-blue-50 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          Transfer Money
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(p.safe_key || '');
                            alert(`Copied Safe Key for ${p.name}`);
                          }}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                          title="Copy Safe Key"
                        >
                          <Copy className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRANSACTIONS HISTORY */}
        {activeSubTab === 'TRANSACTIONS' && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Caller / Sender</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        No transactions recorded yet. Click "New Transaction" to create one.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      let statusBadge = (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="size-3" /> Completed
                        </span>
                      );
                      if (tx.status === 'PENDING_MANAGER_APPROVAL') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                            <Clock className="size-3" /> Pending Manager
                          </span>
                        );
                      } else if (tx.status === 'REJECTED') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                            <XCircle className="size-3" /> Rejected
                          </span>
                        );
                      }

                      return (
                        <tr key={tx.transaction_id} className="hover:bg-slate-50/60">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                            {tx.transaction_id}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {tx.requester_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-slate-900">
                            ₹{tx.amount_inr.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {tx.recipient_name || tx.recipient_account || '—'}
                          </td>
                          <td className="px-6 py-4">{statusBadge}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: REGISTER NEW CALLER PROFILE */}
        {showNewProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Register New Caller Profile</h3>
                <button
                  onClick={() => setShowNewProfileModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProfile} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase">
                      Language
                    </label>
                    <select
                      value={newLang}
                      onChange={(e) => setNewLang(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase">
                      Initial Deposit (₹)
                    </label>
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Safe Key (Optional - Auto Generated if blank)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RAMESH-9912"
                    value={newSafeKey}
                    onChange={(e) => setNewSafeKey(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm uppercase focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProfileModal(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="rounded-xl bg-[#0c538e] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#093d69]"
                  >
                    {isSubmittingProfile ? 'Saving...' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: INITIATE NEW BANK TRANSACTION */}
        {showNewTxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Initiate Bank Transaction</h3>
                <button
                  onClick={() => setShowNewTxModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Sender Profile *
                  </label>
                  <select
                    required
                    value={txSender}
                    onChange={(e) => setTxSender(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select caller profile...</option>
                    {profiles.map((p) => (
                      <option key={p.user_id} value={p.user_id}>
                        {p.name} (Balance: ₹{p.balance_inr.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Transaction Type *
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="TRANSFER">Direct Fund Transfer</option>
                    <option value="SCHEME_DEBIT">Scheme Auto-Debit (PMSBY / PMJJBY / APY)</option>
                    <option value="OVERDRAFT_WITHDRAWAL">PMJDY Overdraft Facility Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <div className="mt-2 flex gap-2">
                    {['500', '2000', '5000', '15000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTxAmount(amt)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  {Number(txAmount) > 5000 && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      ⚠️ Amounts &gt; ₹5,000 automatically route to Senior Manager for security verification.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Recipient Name / Beneficiary
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma / PMJJBY Pool"
                    value={txRecipient}
                    onChange={(e) => setTxRecipient(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTxModal(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTx}
                    className="rounded-xl bg-[#0c538e] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#093d69]"
                  >
                    {isSubmittingTx ? 'Processing...' : 'Submit Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
