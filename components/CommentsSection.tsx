'use client';

import { useState } from 'react';
import { Comment } from '@/types';
import { useApp } from '@/context/AppContext';
import VerificationBadge from './VerificationBadge';

interface Props {
  postId: string;
  comments: Comment[];
}

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

export default function CommentsSection({ postId, comments }: Props) {
  const { addComment, currentUser } = useApp();
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!input.trim() || !currentUser) return;
    setSubmitting(true);
    setTimeout(() => {
      const comment: Comment = {
        id: `c-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        userVerification: currentUser.verificationStatus,
        content: input.trim(),
        timestamp: new Date().toISOString(),
      };
      addComment(postId, comment);
      setInput('');
      setSubmitting(false);
    }, 300);
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2.5">
              <img
                src={comment.userAvatar}
                alt={comment.userName}
                className="w-7 h-7 rounded-full bg-slate-100 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="bg-slate-50 rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-slate-800">{comment.userName}</span>
                    <VerificationBadge status={comment.userVerification} />
                    <span className="text-xs text-slate-400 ml-auto flex-shrink-0">{timeAgo(comment.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {currentUser && (
        <div className="flex gap-2.5 items-end">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full bg-slate-100 flex-shrink-0 mb-0.5"
          />
          <div className="flex-1 flex items-end bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all overflow-hidden">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Add a comment..."
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-700 placeholder-slate-400 resize-none outline-none max-h-24 leading-relaxed"
              style={{ minHeight: '36px' }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || submitting}
              className={`p-2 m-1 rounded-xl transition-all ${
                input.trim()
                  ? 'text-violet-600 hover:bg-violet-100 active:scale-95'
                  : 'text-slate-300'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 rotate-90">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
