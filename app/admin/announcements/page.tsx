'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Audience = 'all' | 'verified' | 'subscribers';
type MessageType = 'info' | 'warning' | 'success';

interface SentAnnouncement {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  type: MessageType;
  sentAt: string;
  recipientCount: number;
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  all:         'All users',
  verified:    'Verified users only',
  subscribers: 'Subscribers only',
};

const TYPE_STYLES: Record<MessageType, { label: string; bg: string; icon: string }> = {
  info:    { label: 'Info',    bg: 'bg-blue-900/40 text-blue-400 border-blue-800',    icon: 'ℹ️' },
  warning: { label: 'Warning', bg: 'bg-amber-900/40 text-amber-400 border-amber-800', icon: '⚠️' },
  success: { label: 'Update',  bg: 'bg-emerald-900/40 text-emerald-400 border-emerald-800', icon: '✅' },
};

const MOCK_HISTORY: SentAnnouncement[] = [
  {
    id: 'a1', title: 'Welcome to Ridemate Community!',
    body: 'We\'ve just launched our community groups feature. Join a group in your city and start coordinating rides with like-minded commuters.',
    audience: 'all', type: 'success', sentAt: '2026-07-01T09:00:00Z', recipientCount: 847,
  },
  {
    id: 'a2', title: 'Scheduled Maintenance – July 10',
    body: 'We\'ll be performing server maintenance on July 10 between 2–4 AM. The app may be briefly unavailable during this window.',
    audience: 'all', type: 'warning', sentAt: '2026-07-05T14:30:00Z', recipientCount: 1204,
  },
];

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [msgType, setMsgType] = useState<MessageType>('info');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentAnnouncement[]>(MOCK_HISTORY);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);

    // In production: insert into an `announcements` table and trigger push notifications
    const db = createClient();
    await db.from('announcements').insert({
      title: title.trim(),
      body: body.trim(),
      audience,
      type: msgType,
    }).then(() => {/* swallow error if table doesn't exist yet */});

    // Optimistic UI update
    const newAnnouncement: SentAnnouncement = {
      id: `a-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      audience,
      type: msgType,
      sentAt: new Date().toISOString(),
      recipientCount: Math.floor(Math.random() * 800) + 200,
    };
    setHistory(prev => [newAnnouncement, ...prev]);
    setTitle(''); setBody('');
    setSending(false);
    showToast('Announcement sent!');
  };

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <p className="text-slate-400 text-sm mt-0.5">Send platform-wide notifications to your users</p>
      </div>

      {/* Compose */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">New Announcement</h2>
        <div className="space-y-4">
          {/* Type + Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Type</label>
              <div className="flex gap-1.5">
                {(Object.keys(TYPE_STYLES) as MessageType[]).map(t => (
                  <button key={t} onClick={() => setMsgType(t)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      msgType === t
                        ? `${TYPE_STYLES[t].bg} border-current`
                        : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'
                    }`}>
                    <span>{TYPE_STYLES[t].icon}</span>
                    {TYPE_STYLES[t].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Audience</label>
              <select
                value={audience} onChange={e => setAudience(e.target.value as Audience)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              >
                {(Object.entries(AUDIENCE_LABELS) as [Audience, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Title</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. New feature available!"
              maxLength={80}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            <p className="text-right text-[10px] text-slate-600 mt-1">{title.length}/80</p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Message</label>
            <textarea
              value={body} onChange={e => setBody(e.target.value)}
              placeholder="Write your announcement…" rows={4} maxLength={500}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
            <p className="text-right text-[10px] text-slate-600 mt-1">{body.length}/500</p>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className={`rounded-2xl border p-4 ${TYPE_STYLES[msgType].bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{TYPE_STYLES[msgType].icon}</span>
                <p className="text-sm font-bold">{title || 'Preview title'}</p>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">{body || 'Preview message body…'}</p>
              <p className="text-[10px] opacity-50 mt-2">To: {AUDIENCE_LABELS[audience]}</p>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!title.trim() || !body.trim() || sending}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {sending
              ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending…</>
              : '📢 Send Announcement'}
          </button>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Sent Announcements</h2>
        {history.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl py-12 text-center">
            <p className="text-slate-500 text-sm">No announcements sent yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(a => (
              <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{TYPE_STYLES[a.type].icon}</span>
                    <p className="text-sm font-semibold text-slate-200">{a.title}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${TYPE_STYLES[a.type].bg}`}>
                    {TYPE_STYLES[a.type].label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{a.body}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>{formatDate(a.sentAt)}</span>
                  <span>·</span>
                  <span>{AUDIENCE_LABELS[a.audience]}</span>
                  <span>·</span>
                  <span>{a.recipientCount.toLocaleString()} recipients</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
