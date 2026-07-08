'use client';

import { useState } from 'react';

const MOCK_GROUPS = [
  { id: 'g1', emoji: '🏙️', name: 'Colombo Daily Commuters', members: 847, category: 'Commuters', isPublic: true, createdAt: '2026-06-01' },
  { id: 'g2', emoji: '🌿', name: 'Kandy–Colombo Corridor',  members: 523, category: 'Commuters', isPublic: true, createdAt: '2026-06-05' },
  { id: 'g3', emoji: '🌊', name: 'Galle Coastal Riders',    members: 312, category: 'Leisure',   isPublic: true, createdAt: '2026-06-10' },
  { id: 'g4', emoji: '✈️', name: 'Airport Transfer Network', members: 1204, category: 'Airport', isPublic: true, createdAt: '2026-05-20' },
  { id: 'g5', emoji: '🏔️', name: 'Hill Country Explorers',  members: 289, category: 'Leisure',   isPublic: false, createdAt: '2026-06-15' },
  { id: 'g6', emoji: '🎓', name: 'University Carpools LK',  members: 672, category: 'Students',  isPublic: true, createdAt: '2026-06-08' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Commuters: 'bg-blue-900/40 text-blue-400',
  Leisure:   'bg-emerald-900/40 text-emerald-400',
  Airport:   'bg-amber-900/40 text-amber-400',
  Students:  'bg-violet-900/40 text-violet-400',
};

export default function AdminCommunityPage() {
  const [groups, setGroups] = useState(MOCK_GROUPS);
  const [confirmDelete, setConfirmDelete] = useState<typeof MOCK_GROUPS[0] | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    setConfirmDelete(null);
    showToast('Group removed');
  };

  const toggleVisibility = (id: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, isPublic: !g.isPublic } : g));
    const g = groups.find(g => g.id === id);
    showToast(g?.isPublic ? 'Group set to private' : 'Group set to public');
  };

  const totalMembers = groups.reduce((sum, g) => sum + g.members, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Community</h1>
        <p className="text-slate-400 text-sm mt-0.5">{groups.length} groups · {totalMembers.toLocaleString()} total members</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Groups', value: groups.length, icon: '🌍' },
          { label: 'Public', value: groups.filter(g => g.isPublic).length, icon: '🔓' },
          { label: 'Private', value: groups.filter(g => !g.isPublic).length, icon: '🔒' },
          { label: 'Total Members', value: totalMembers.toLocaleString(), icon: '👥' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="text-xl font-bold text-white tabular-nums">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Groups table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">All Groups</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {groups.map(g => (
            <div key={g.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/40 transition-colors">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {g.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-200">{g.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[g.category]}`}>
                    {g.category}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    g.isPublic ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {g.isPublic ? '🌍 Public' : '🔒 Private'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{g.members.toLocaleString()} members</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => toggleVisibility(g.id)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition-all"
                >
                  {g.isPublic ? 'Make Private' : 'Make Public'}
                </button>
                <button
                  onClick={() => setConfirmDelete(g)}
                  className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Remove group?</h3>
            <p className="text-sm text-slate-400 mb-5">
              Permanently remove <span className="text-slate-200 font-medium">{confirmDelete.emoji} {confirmDelete.name}</span> and its {confirmDelete.members.toLocaleString()} members. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button onClick={() => deleteGroup(confirmDelete.id)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition-colors">Remove</button>
            </div>
          </div>
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
