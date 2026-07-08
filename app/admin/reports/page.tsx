'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Report {
  id: string;
  reporter_name: string;
  reporter_avatar: string;
  target_type: 'user' | 'post';
  target_id: string;
  target_name: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open:      'bg-rose-900/40 text-rose-400 border-rose-800',
  resolved:  'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  dismissed: 'bg-slate-800 text-slate-400 border-slate-700',
};

const REASONS = [
  'Spam or fake post',
  'Inappropriate content',
  'Harassment',
  'Wrong information',
  'Safety concern',
  'Other',
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'dismissed'>('open');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const load = async () => {
    setLoading(true);
    const db = createClient();
    let q = db.from('reports')
      .select('id, reporter_name, reporter_avatar, target_type, target_id, target_name, reason, details, status, created_at')
      .order('created_at', { ascending: false });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data } = await q.limit(50);
    setReports(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: string, status: 'resolved' | 'dismissed') => {
    setActionLoading(id + status);
    const db = createClient();
    await db.from('reports').update({ status }).eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showToast(status === 'resolved' ? 'Report resolved' : 'Report dismissed');
    setActionLoading(null);
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const STATUS_TABS = [
    { key: 'open', label: 'Open', dot: 'bg-rose-500' },
    { key: 'resolved', label: 'Resolved', dot: 'bg-emerald-500' },
    { key: 'dismissed', label: 'Dismissed', dot: 'bg-slate-500' },
    { key: 'all', label: 'All', dot: 'bg-slate-600' },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-slate-400 text-sm mt-0.5">User-submitted reports and moderation queue</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1 w-fit">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === t.key ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">✅</span>
          <p className="text-slate-400 text-sm">No {statusFilter === 'all' ? '' : statusFilter} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img src={r.reporter_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.reporter_name}`}
                    alt={r.reporter_name} className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      <span className="text-slate-400">Reported by</span> {r.reporter_name}
                    </p>
                    <p className="text-xs text-slate-500">{timeAgo(r.created_at)}</p>
                  </div>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[r.status]}`}>
                  {r.status}
                </span>
              </div>

              {/* Target */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  r.target_type === 'user' ? 'bg-blue-900/40 text-blue-400' : 'bg-violet-900/40 text-violet-400'
                }`}>
                  {r.target_type === 'user' ? '👤 User' : '🚗 Post'}
                </span>
                <span className="text-sm text-slate-300 font-medium">{r.target_name}</span>
              </div>

              {/* Reason & details */}
              <div className="bg-slate-800/60 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-slate-400 mb-1">Reason: <span className="text-slate-300 font-medium">{r.reason}</span></p>
                {r.details && <p className="text-xs text-slate-400 leading-relaxed">{r.details}</p>}
              </div>

              {/* Actions */}
              {r.status === 'open' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(r.id, 'resolved')}
                    disabled={!!actionLoading}
                    className="flex-1 py-2 bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {actionLoading === r.id + 'resolved' ? '…' : '✓ Mark Resolved'}
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, 'dismissed')}
                    disabled={!!actionLoading}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {actionLoading === r.id + 'dismissed' ? '…' : '✕ Dismiss'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
