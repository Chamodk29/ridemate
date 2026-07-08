'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success';
  created_at: string;
}

const STYLES = {
  info:    { bar: 'bg-blue-500',    bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-900',   sub: 'text-blue-700',   icon: 'ℹ️' },
  warning: { bar: 'bg-amber-500',   bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-900',  sub: 'text-amber-700',  icon: '⚠️' },
  success: { bar: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900', sub: 'text-emerald-700', icon: '✅' },
};

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      const db = createClient();
      const { data } = await db
        .from('announcements')
        .select('id, title, body, type, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!data) return;

      // Don't show if user already dismissed this one
      const dismissedId = localStorage.getItem('ridemate_dismissed_announcement');
      if (dismissedId === data.id) return;

      setAnnouncement(data);
    })();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem('ridemate_dismissed_announcement', announcement.id);
    }
    setDismissed(true);
  };

  if (!announcement || dismissed) return null;

  const s = STYLES[announcement.type] ?? STYLES.info;

  return (
    <div className={`relative border rounded-2xl overflow-hidden mb-4 ${s.bg}`}>
      <div className={`absolute left-0 inset-y-0 w-1 ${s.bar}`} />
      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <span className="text-lg flex-shrink-0 mt-0.5">{s.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${s.text}`}>{announcement.title}</p>
          <p className={`text-xs mt-0.5 leading-relaxed ${s.sub}`}>{announcement.body}</p>
        </div>
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors ${s.sub}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
