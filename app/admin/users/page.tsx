'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateUserReportPDF } from '@/lib/generateUserReport';

interface AdminUser {
  id: string;
  name: string;
  avatar: string;
  verification_status: string;
  is_suspended: boolean;
  is_admin: boolean;
  total_rides: number;
  rating: number;
  bio: string;
  created_at: string;
}

const FILTERS = ['All', 'Verified', 'Pending', 'Suspended'] as const;
type Filter = typeof FILTERS[number];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleReport = async () => {
    setReportLoading(true);
    const db = createClient();
    const { data } = await db
      .from('profiles')
      .select('name, verification_status, is_suspended, is_admin, total_rides, rating, bio, created_at')
      .order('created_at', { ascending: false });
    generateUserReportPDF(data ?? []);
    setReportLoading(false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const db = createClient();
    let q = db.from('profiles')
      .select('id, name, avatar, verification_status, is_suspended, is_admin, total_rides, rating, bio, created_at')
      .order('created_at', { ascending: false });

    if (filter === 'Verified') q = q.eq('verification_status', 'verified');
    if (filter === 'Pending') q = q.eq('verification_status', 'pending');
    if (filter === 'Suspended') q = q.eq('is_suspended', true);
    if (search.trim()) q = q.ilike('name', `%${search.trim()}%`);

    const { data } = await q.limit(50);
    setUsers(data ?? []);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  const updateUser = async (id: string, patch: Partial<AdminUser>, msg: string) => {
    setActionLoading(id + Object.keys(patch)[0]);
    const db = createClient();
    await db.from('profiles').update(patch).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
    showToast(msg);
    setActionLoading(null);
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return `${d}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">{users.length} result{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleReport}
          disabled={reportLoading}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
        >
          {reportLoading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          )}
          {reportLoading ? 'Generating…' : 'Download Report'}
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex gap-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-16">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3 uppercase tracking-wide">User</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-3 py-3 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-3 py-3 uppercase tracking-wide hidden md:table-cell">Rides</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-3 py-3 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                  <th className="text-right text-xs font-semibold text-slate-400 px-5 py-3 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* User */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                          alt={u.name} className="w-9 h-9 rounded-full bg-slate-700 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-200 truncate">{u.name}</p>
                            {u.is_admin && <span className="text-[10px] bg-violet-900/60 text-violet-300 px-1.5 py-0.5 rounded font-medium">Admin</span>}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{u.bio || 'No bio'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 hidden sm:table-cell">
                      {u.is_suspended ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-rose-900/40 text-rose-400 px-2 py-1 rounded-full font-medium">
                          🚫 Suspended
                        </span>
                      ) : u.verification_status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-900/40 text-emerald-400 px-2 py-1 rounded-full font-medium">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full font-medium">
                          ○ Pending
                        </span>
                      )}
                    </td>

                    {/* Rides */}
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-300 tabular-nums">{u.total_rides ?? 0}</span>
                    </td>

                    {/* Joined */}
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{timeAgo(u.created_at)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Verify / Unverify */}
                        {u.verification_status !== 'verified' ? (
                          <button
                            onClick={() => updateUser(u.id, { verification_status: 'verified' }, `${u.name} verified`)}
                            disabled={actionLoading === u.id + 'verification_status'}
                            className="px-3 py-1.5 bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                          >
                            {actionLoading === u.id + 'verification_status' ? '…' : 'Verify'}
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUser(u.id, { verification_status: 'pending' }, `${u.name} unverified`)}
                            disabled={actionLoading === u.id + 'verification_status'}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                          >
                            {actionLoading === u.id + 'verification_status' ? '…' : 'Unverify'}
                          </button>
                        )}

                        {/* Suspend / Unsuspend */}
                        {!u.is_suspended ? (
                          <button
                            onClick={() => updateUser(u.id, { is_suspended: true }, `${u.name} suspended`)}
                            disabled={u.is_admin || actionLoading === u.id + 'is_suspended'}
                            title={u.is_admin ? 'Cannot suspend admins' : ''}
                            className="px-3 py-1.5 bg-rose-900/30 hover:bg-rose-900/60 text-rose-400 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {actionLoading === u.id + 'is_suspended' ? '…' : 'Suspend'}
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUser(u.id, { is_suspended: false }, `${u.name} reinstated`)}
                            disabled={actionLoading === u.id + 'is_suspended'}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                          >
                            {actionLoading === u.id + 'is_suspended' ? '…' : 'Reinstate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
