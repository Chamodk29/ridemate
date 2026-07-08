'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  suspendedUsers: number;
  totalPosts: number;
  activePosts: number;
  openReports: number;
  newUsersToday: number;
  newPostsToday: number;
}

interface RecentUser {
  id: string;
  name: string;
  avatar: string;
  verification_status: string;
  created_at: string;
}

interface RecentPost {
  id: string;
  profile: { name: string } | null;
  from_location: string;
  to_location: string;
  type: string;
  created_at: string;
}

const STAT_CARDS = [
  { key: 'totalUsers',     label: 'Total Users',       icon: '👥', color: 'from-blue-500 to-indigo-500',   suffix: '' },
  { key: 'verifiedUsers',  label: 'Verified',          icon: '✅', color: 'from-emerald-500 to-teal-500',  suffix: '' },
  { key: 'totalPosts',     label: 'Total Posts',       icon: '🚗', color: 'from-violet-500 to-purple-500', suffix: '' },
  { key: 'openReports',    label: 'Open Reports',      icon: '🚩', color: 'from-rose-500 to-pink-500',    suffix: '' },
  { key: 'activePosts',    label: 'Active Posts',      icon: '📅', color: 'from-amber-500 to-orange-500', suffix: '' },
  { key: 'suspendedUsers', label: 'Suspended',         icon: '🚫', color: 'from-slate-500 to-slate-600',  suffix: '' },
  { key: 'newUsersToday',  label: 'New Users Today',   icon: '🆕', color: 'from-cyan-500 to-blue-500',    suffix: '' },
  { key: 'newPostsToday',  label: 'New Posts Today',   icon: '✨', color: 'from-fuchsia-500 to-violet-500', suffix: '' },
] as const;

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const db = createClient();
      const today = new Date().toISOString().split('T')[0];

      const [
        { count: totalUsers },
        { count: verifiedUsers },
        { count: suspendedUsers },
        { count: totalPosts },
        { count: activePosts },
        { count: openReports },
        { count: newUsersToday },
        { count: newPostsToday },
        { data: latestUsers },
        { data: latestPosts },
      ] = await Promise.all([
        db.from('profiles').select('*', { count: 'exact', head: true }),
        db.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        db.from('profiles').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
        db.from('posts').select('*', { count: 'exact', head: true }),
        db.from('posts').select('*', { count: 'exact', head: true }).gte('date', today),
        db.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
        db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today),
        db.from('profiles').select('id, name, avatar, verification_status, created_at').order('created_at', { ascending: false }).limit(5),
        db.from('posts').select('id, from_location, to_location, type, created_at, profile:profiles!posts_user_id_fkey(name)').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalUsers: totalUsers ?? 0,
        verifiedUsers: verifiedUsers ?? 0,
        suspendedUsers: suspendedUsers ?? 0,
        totalPosts: totalPosts ?? 0,
        activePosts: activePosts ?? 0,
        openReports: openReports ?? 0,
        newUsersToday: newUsersToday ?? 0,
        newPostsToday: newPostsToday ?? 0,
      });
      setRecentUsers(latestUsers ?? []);
      setRecentPosts((latestPosts ?? []) as any);
      setLoading(false);
    })();
  }, []);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-0.5">Platform health at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
            <div className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} items-center justify-center text-lg mb-3 shadow-lg`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {stats?.[card.key as keyof Stats]?.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Recent Signups</h2>
            <a href="/admin/users" className="text-xs text-violet-400 hover:text-violet-300">View all →</a>
          </div>
          <div className="divide-y divide-slate-800">
            {recentUsers.length === 0 && (
              <p className="text-sm text-slate-500 px-5 py-8 text-center">No users yet</p>
            )}
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                  alt={u.name} className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate capitalize">{u.verification_status}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    u.verification_status === 'verified'
                      ? 'bg-emerald-900/50 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {u.verification_status === 'verified' ? 'Verified' : 'Pending'}
                  </span>
                  <span className="text-[10px] text-slate-600">{timeAgo(u.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent posts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Recent Posts</h2>
            <a href="/admin/posts" className="text-xs text-violet-400 hover:text-violet-300">View all →</a>
          </div>
          <div className="divide-y divide-slate-800">
            {recentPosts.length === 0 && (
              <p className="text-sm text-slate-500 px-5 py-8 text-center">No posts yet</p>
            )}
            {recentPosts.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${
                  p.type === 'offering' ? 'bg-violet-900/50 text-violet-400' : 'bg-blue-900/50 text-blue-400'
                }`}>
                  {p.type === 'offering' ? '🚗' : '🙋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{p.from_location} → {p.to_location}</p>
                  <p className="text-xs text-slate-500 truncate">by {(p.profile as any)?.name ?? 'Unknown'}</p>
                </div>
                <span className="text-[10px] text-slate-600 flex-shrink-0">{timeAgo(p.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick ratios */}
      {stats && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Platform Health</h2>
          <div className="space-y-4">
            {[
              {
                label: 'Verification rate',
                value: stats.totalUsers ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0,
                color: 'bg-emerald-500',
              },
              {
                label: 'Active posts ratio',
                value: stats.totalPosts ? Math.round((stats.activePosts / stats.totalPosts) * 100) : 0,
                color: 'bg-violet-500',
              },
              {
                label: 'Suspension rate',
                value: stats.totalUsers ? Math.round((stats.suspendedUsers / stats.totalUsers) * 100) : 0,
                color: 'bg-rose-500',
              },
            ].map(bar => (
              <div key={bar.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">{bar.label}</span>
                  <span className="text-slate-300 font-semibold">{bar.value}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${bar.color} rounded-full transition-all duration-700`} style={{ width: `${bar.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
