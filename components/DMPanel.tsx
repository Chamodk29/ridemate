'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import VerificationBadge from './VerificationBadge';

function timeStr(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function dateSeparator(timestamp: string) {
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DMPanel() {
  const { activeDMConversationId, conversations, currentUser, closeDM, sendMessage, markAsRead } = useApp();
  const [input, setInput] = useState('');
  const [visible, setVisible] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const conversation = conversations.find(c => c.id === activeDMConversationId);

  useEffect(() => {
    if (activeDMConversationId) {
      requestAnimationFrame(() => setVisible(true));
      if (activeDMConversationId) markAsRead(activeDMConversationId);
    } else {
      setVisible(false);
    }
  }, [activeDMConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  if (!activeDMConversationId || !conversation || !currentUser) return null;

  const otherIdx = conversation.participantIds[0] === currentUser.id ? 1 : 0;
  const otherName = conversation.participantNames[otherIdx];
  const otherAvatar = conversation.participantAvatars[otherIdx];
  const otherVerification = conversation.participantVerifications[otherIdx];

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(conversation.id, input);
    setInput('');
    inputRef.current?.focus();
  };

  // Group messages by date
  const groups: { date: string; messages: typeof conversation.messages }[] = [];
  conversation.messages.forEach(msg => {
    const date = dateSeparator(msg.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else groups.push({ date, messages: [msg] });
  });

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm sm:hidden transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDM}
      />

      {/* Panel */}
      <div className={`fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-white shadow-2xl shadow-slate-900/20 flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <button onClick={closeDM} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <img src={otherAvatar} alt={otherName} className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-sm truncate">{otherName}</span>
              <VerificationBadge status={otherVerification} />
            </div>
            <p className="text-xs text-slate-400">Direct Message</p>
          </div>
        </div>

        {/* Ride context banner */}
        {conversation.postSnapshot && (
          <div className="mx-3 mt-3 flex-shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
              conversation.postSnapshot.type === 'offering'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-violet-50 border-violet-200 text-violet-700'
            }`}>
              <span>{conversation.postSnapshot.type === 'offering' ? '🚗' : '🔍'}</span>
              <span className="font-medium">
                {conversation.postSnapshot.type === 'offering' ? 'Offering:' : 'Looking:'}{' '}
                {conversation.postSnapshot.from} → {conversation.postSnapshot.to}
              </span>
              <span className="ml-auto text-xs opacity-70">
                {conversation.postSnapshot.city}
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {conversation.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-violet-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">Start the conversation</p>
              <p className="text-xs text-slate-400 mt-1">Say hi to {otherName} about their ride</p>
            </div>
          )}

          {groups.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">{group.date}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="space-y-1.5">
                {group.messages.map((msg, i) => {
                  const isMe = msg.senderId === currentUser.id;
                  const prevMsg = group.messages[i - 1];
                  const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {/* Other user avatar */}
                      {!isMe && (
                        <div className="w-6 flex-shrink-0">
                          {showAvatar && (
                            <img src={otherAvatar} alt={otherName} className="w-6 h-6 rounded-full bg-slate-100" />
                          )}
                        </div>
                      )}

                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-slate-400 mt-0.5 px-1">{timeStr(msg.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all overflow-hidden">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${otherName}...`}
              rows={1}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 resize-none outline-none max-h-28 leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-2 m-1.5 rounded-xl transition-all flex-shrink-0 ${
                input.trim()
                  ? 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95'
                  : 'text-slate-300 bg-slate-100'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 rotate-90">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}
