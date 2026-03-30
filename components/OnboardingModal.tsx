'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function OnboardingModal() {
  const { setUserMode, currentUser } = useApp();
  const [selected, setSelected] = useState<'looking' | 'offering' | null>(null);
  const [animating, setAnimating] = useState(false);

  const handleContinue = () => {
    if (!selected) return;
    setAnimating(true);
    setTimeout(() => setUserMode(selected), 400);
  };

  const options = [
    {
      key: 'looking' as const,
      title: 'Looking for a Ride',
      subtitle: 'Find drivers heading your way',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
      gradient: 'from-violet-500 to-indigo-600',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      selectedBorder: 'border-violet-500',
      selectedBg: 'bg-violet-50',
      check: 'bg-violet-600',
    },
    {
      key: 'offering' as const,
      title: 'Offering a Ride',
      subtitle: 'Share your journey, split the cost',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      selectedBorder: 'border-emerald-500',
      selectedBg: 'bg-emerald-50',
      check: 'bg-emerald-600',
    },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${animating ? 'opacity-0 scale-95' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-violet-200">
              <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
                <circle cx="7.5" cy="14.5" r="1.5"/>
                <circle cx="16.5" cy="14.5" r="1.5"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              Welcome{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}!
            </h2>
            <p className="text-slate-500 text-sm">How would you like to use Ridemate today?</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {options.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left group ${
                  selected === opt.key
                    ? `${opt.selectedBorder} ${opt.selectedBg} shadow-sm`
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                {/* Icon container */}
                <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                  selected === opt.key
                    ? `bg-gradient-to-br ${opt.gradient} text-white shadow-lg`
                    : `${opt.bg} text-slate-500 group-hover:text-slate-700`
                }`}>
                  {opt.icon}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">{opt.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{opt.subtitle}</p>
                </div>

                {/* Check */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selected === opt.key
                    ? `${opt.check} border-transparent`
                    : 'border-slate-200'
                }`}>
                  {selected === opt.key && (
                    <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              selected
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200 hover:shadow-violet-300 active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Continue to Feed →
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            You can change this anytime from your profile
          </p>
        </div>
      </div>
    </div>
  );
}
