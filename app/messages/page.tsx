'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import DMPanel from '@/components/DMPanel';
import VerificationBadge from '@/components/VerificationBadge';

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function MessagesPage() {
  const { isLoggedIn, currentUser, conversations, openDM, activeDMConversationId, markAsRead, posts } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  if (!mounted || !currentUser) return null;

  const myConversations = conversations.filter(c =>
    c.participantIds.includes(currentUser.id)
  );

  const handleOpen = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    markAsRead(convId);
    // Find the matching post to re-open via openDM context
    const post = posts.find(p => p.id === conv.postId);
    if (post) openDM(post);
    else {
      // Fallback: set active directly via a workaround — just mark as read
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <DMPanel />

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24 sm:pt-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Messages</h1>
          <p className="text-sm text-slate-400">
            {myConversations.length === 0
              ? 'No conversations yet'
              : `${myConversations.length} conversation${myConversations.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {myConversations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-violet-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-600 font-semibold">No messages yet</p>
            <p className="text-slate-400 text-sm mt-1">Message someone from a ride post to get started</p>
            <button
              onClick={() => router.push('/feed')}
              className="mt-5 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              Browse Rides
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {myConversations.map(conv => {
              const otherIdx = conv.participantIds[0] === currentUser.id ? 1 : 0;
              const otherName = conv.participantNames[otherIdx];
              const otherAvatar = conv.participantAvatars[otherIdx];
              const otherVerification = conv.participantVerifications[otherIdx];
              const lastMsg = conv.messages[conv.messages.length - 1];
              const unread = conv.messages.filter(m => m.senderId !== currentUser.id && !m.read).length;
              const isActive = activeDMConversationId === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleOpen(conv.id)}
                  className={`w-full flex items-center gap-3 p-4 bg-white rounded-2xl border transition-all text-left hover:shadow-sm ${
                    isActive
                      ? 'border-violet-300 ring-2 ring-violet-100'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img src={otherAvatar} alt={otherName} className="w-12 h-12 rounded-full bg-slate-100" />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-sm font-semibold truncate ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                        {otherName}
                      </span>
                      <VerificationBadge status={otherVerification} />
                    </div>

                    {/* Ride context */}
                    {conv.postSnapshot && (
                      <p className="text-xs text-slate-400 truncate mb-1">
                        {conv.postSnapshot.type === 'offering' ? '🚗' : '🔍'}{' '}
                        {conv.postSnapshot.from} → {conv.postSnapshot.to} · {conv.postSnapshot.city}
                      </p>
                    )}

                    {/* Last message */}
                    <p className={`text-xs truncate ${unread > 0 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                      {lastMsg
                        ? `${lastMsg.senderId === currentUser.id ? 'You: ' : ''}${lastMsg.content}`
                        : 'No messages yet — say hi!'}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-slate-400">
                      {lastMsg ? timeAgo(lastMsg.timestamp) : timeAgo(conv.createdAt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
