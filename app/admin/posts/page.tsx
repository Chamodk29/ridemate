'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AdminPost {
  id: string;
  profile: { name: string; avatar: string } | null;
  type: 'offering' | 'looking';
  from_location: string;
  to_location: string;
  date: string;
  seats: number | null;
  cost_type: string;
  cost_amount: number | null;
  description: string;
  created_at: string;
}

const TYPE_FILTERS = ['All', 'Offering', 'Looking'] as const;
type TypeFilter = typeof TYPE_FILTERS[number];

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminPost | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    const db = createClient();
    let q = db.from('posts')
      .select('id, type, from_location, to_location, date, seats, cost_type, cost_amount, description, created_at, profile:profiles!posts_user_id_fkey(name, avatar)')
      .order('created_at', { ascending: false });

    if (typeFilter === 'Offering') q = q.eq('type', 'offering');
    if (typeFilter === 'Looking') q = q.eq('type', 'looking');
    if (search.trim()) {
      q = q.or(`from_location.ilike.%${search.trim()}%,to_location.ilike.%${search.trim()}%`);
    }

    const { data } = await q.limit(50);
    setPosts((data as any) ?? []);
    setLoading(false);
  }, [typeFilter, search]);

  useEffect(() => { load(); }, [load]);

  const deletePost = async (post: AdminPost) => {
    setDeletingId(post.id);
    const db = createClient();
    await db.from('posts').delete().eq('id', post.id);
    setPosts(prev => prev.filter(p => p.id !== post.id));
    setConfirmDelete(null);
    setDeletingId(null);
    showToast('Post deleted');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatCost = (type: string, amount: number | null) => {
    if (type === 'free') return <span className="text-emerald-400">Free</span>;
    if (type === 'split') return <span className="text-blue-400">Split fuel</span>;
    if (type === 'fixed' && amount) return <span className="text-amber-400">LKR {amount.toLocaleString()}</span>;
    return <span className="text-slate-500">—</span>;
  };

  const userName = (post: AdminPost) => post.profile?.name ?? 'Unknown';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Posts</h1>
        <p className="text-slate-400 text-sm mt-0.5">{posts.length} result{posts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by city…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex gap-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1">
          {TYPE_FILTERS.map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === f ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-16">No posts found</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {posts.map(post => (
              <div key={post.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/40 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                  post.type === 'offering' ? 'bg-violet-900/50 text-violet-300' : 'bg-blue-900/50 text-blue-300'
                }`}>
                  {post.type === 'offering' ? '🚗' : '🙋'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200">
                        {post.from_location} → {post.to_location}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-slate-500">by {userName(post)}</span>
                        <span className="text-xs text-slate-600">{formatDate(post.date)}</span>
                        {post.seats != null && (
                          <span className="text-xs text-slate-500">{post.seats} seat{post.seats !== 1 ? 's' : ''}</span>
                        )}
                        <span className="text-xs">{formatCost(post.cost_type, post.cost_amount)}</span>
                      </div>
                      {post.description && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{post.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmDelete(post)}
                      className="flex-shrink-0 p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-all"
                      title="Delete post"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Delete post?</h3>
            <p className="text-sm text-slate-400 mb-5">
              Remove <span className="text-slate-200 font-medium">{confirmDelete.from_location} → {confirmDelete.to_location}</span> by {userName(confirmDelete)}. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={() => deletePost(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {deletingId === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
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
