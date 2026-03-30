'use client';

import { VerificationStatus } from '@/types';

interface Props {
  status: VerificationStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function VerificationBadge({ status, showLabel = false, size = 'sm' }: Props) {
  const config = {
    verified: {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}>
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: 'Verified',
      className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      dotColor: 'bg-emerald-500',
    },
    pending: {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Pending',
      className: 'text-amber-600 bg-amber-50 border-amber-200',
      dotColor: 'bg-amber-400',
    },
    not_verified: {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Not Verified',
      className: 'text-slate-500 bg-slate-50 border-slate-200',
      dotColor: 'bg-slate-400',
    },
  };

  const c = config[status];

  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${c.className}`}>
        {c.icon}
        {c.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${c.className}`} title={c.label}>
      {c.icon}
    </span>
  );
}
