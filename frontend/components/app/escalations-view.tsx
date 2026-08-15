'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  ChevronRight,
  FileText,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

interface EscalationTicket {
  ticket_id: string;
  name: string;
  phone: string;
  category: string;
  call_id: string;
  description: string;
  status: string;
  date: string;
  priority?: 'High' | 'Medium' | 'Low';
  nodal_officer?: string;
}

export function EscalationsView() {
  const [tickets, setTickets] = useState<EscalationTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create ticket modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Scheme Eligibility');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/escalations');
      if (response.ok) {
        const data = await response.json();

        // Map database escalations to EscalationTicket structure
        const mapped: EscalationTicket[] = data.map((t: any) => {
          let priority: 'High' | 'Medium' | 'Low' = 'Medium';
          if (t.urgency === 'high' || t.urgency === 'emergency') {
            priority = 'High';
          } else if (t.urgency === 'low') {
            priority = 'Low';
          }

          let nodal_officer = t.nodal_officer || 'S. K. Verma (Lead Investigator)';
          if (t.trigger_type === 'fraud_suspected' || t.category === 'Fraud Report') {
            nodal_officer = 'Sunil Nair (Cyber Cell Analyst)';
          }

          let category = t.category || 'General Escalation';
          if (t.trigger_type === 'fraud_suspected') {
            category = 'Fraud Report';
          } else if (t.trigger_type === 'complex_decision') {
            category = 'Scheme Eligibility';
          } else if (t.trigger_type === 'user_requested') {
            category = 'User Request';
          }

          let status = 'Assigned to Nodal Officer';
          if (t.status === 'resolved') {
            status = 'Investigation Closed';
          } else if (t.status === 'in_progress') {
            status = 'In Progress';
          }

          return {
            ticket_id: t.reference_id || t.ticket_id || 'ESC-2026',
            name: t.requester_name || 'Anonymous Caller',
            phone: t.contact_hint || t.user_id || 'Unknown',
            category: category,
            call_id: t.user_id || 'Unknown',
            description: t.issue_description || '',
            status: status,
            date: t.created_at || new Date().toISOString(),
            priority: priority,
            nodal_officer: nodal_officer,
          };
        });

        setTickets(mapped);
      }
    } catch (err) {
      console.error('Error fetching escalations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert('Please fill in citizen name and issue description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_name: name.trim(),
          contact_hint: phone.trim() || '+91 9XXXX XXXXX',
          category: category,
          urgency: urgency,
          issue_description: description.trim(),
          user_consent: true,
          trigger_type: category === 'Fraud Report' ? 'fraud_suspected' : 'user_requested',
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setName('');
        setPhone('');
        setDescription('');
        await loadTickets();
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (priorityFilter !== 'ALL' && t.priority?.toUpperCase() !== priorityFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.ticket_id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.nodal_officer && t.nodal_officer.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans text-slate-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Title */}
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-[#0f294a] md:text-3xl">
              <span className="rounded-xl bg-blue-50 p-2 text-[#0c538e]">
                <Layers className="size-6 md:size-8" />
              </span>
              Open Escalations & Tickets
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 md:text-base">
              Track active investigations and citizen tickets escalated directly by Jan Sahay AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadTickets}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3.5 py-2 text-sm font-semibold text-blue-600 shadow-sm transition duration-150 hover:border-blue-300 hover:bg-blue-50"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Tickets
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0c538e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#093d69]"
            >
              <Plus className="size-4" />
              Create Escalation
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Priority:
            </span>
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  priorityFilter === p
                    ? 'bg-[#0f4a73] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 md:w-80">
            <Search className="size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket ID, citizen, officer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Tickets Grid list */}
        <div className="space-y-4">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((t) => {
              const dateStr = new Date(t.date).toLocaleString();
              const isClosed = t.status.toLowerCase().includes('closed');

              return (
                <div
                  key={t.ticket_id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md md:flex-row md:items-start md:p-6"
                >
                  <div className="flex-1 space-y-3">
                    {/* Header line of ticket */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 font-mono text-sm font-bold text-[#0c538e] select-all">
                        {t.ticket_id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${
                          t.priority === 'High'
                            ? 'border border-rose-100 bg-rose-50 text-rose-700'
                            : 'border border-amber-100 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {t.priority || 'Medium'} Priority
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {t.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1 text-slate-800">
                        <User className="size-3.5 text-slate-400" />
                        {t.name}
                      </span>
                      <span>•</span>
                      <span>Contact: {t.phone}</span>
                      <span>•</span>
                      <span>Logged: {dateStr}</span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-700">{t.description}</p>

                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-xs font-medium text-slate-600">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      <span>
                        <strong className="text-slate-800">Assigned Nodal Officer:</strong>{' '}
                        {t.nodal_officer}
                      </span>
                    </div>
                  </div>

                  {/* Status column */}
                  <div className="flex flex-col items-end justify-between border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        isClosed
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-50 text-[#0c538e]'
                      }`}
                    >
                      <span className="size-2 rounded-full bg-[#0c538e]" />
                      {t.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <FileText className="mx-auto size-12 text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-slate-700">No escalations found</h3>
              <p className="mt-1 text-sm text-slate-400">
                All citizen grievance inquiries are currently resolved, or none match your filter.
              </p>
            </div>
          )}
        </div>

        {/* MODAL: CREATE ESCALATION */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Create New Escalation Ticket</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Citizen Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anjali Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="Scheme Eligibility">Scheme Eligibility</option>
                      <option value="Fraud Report">Fraud Report</option>
                      <option value="Service Grievance">Service Grievance</option>
                      <option value="Overdraft Dispute">Overdraft Dispute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase">
                      Urgency
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="emergency">Emergency</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Issue Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe citizen issue or fraud pattern..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-[#0c538e] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#093d69]"
                  >
                    {isSubmitting ? 'Submitting...' : 'Create Ticket'}
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
