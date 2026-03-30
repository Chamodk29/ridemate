'use client';

import { useApp } from '@/context/AppContext';

export default function PaywallOverlay() {
  const { toggleSubscription } = useApp();

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

      {/* Card */}
      <div className="relative mx-4 w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-100 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mb-5 shadow-lg shadow-violet-200">
            <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              <path d="M17 8H7v8h2v-6h6v6h2V8z" opacity="0" />
            </svg>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mb-5 shadow-lg shadow-violet-200 -mt-16">
            <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Unlock the Community
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Subscribe to access the full ride feed, connect with verified drivers and passengers, and post your rides.
          </p>

          {/* Features */}
          <div className="space-y-2 mb-6 text-left">
            {[
              'Unlimited ride posts',
              'Connect with verified members',
              'Priority visibility for your posts',
              'Advanced filters & search',
            ].map(feature => (
              <div key={feature} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-violet-600">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-slate-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-5">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-3xl font-bold text-slate-900">$4.99</span>
              <span className="text-sm text-slate-400">/month</span>
            </div>
            <p className="text-xs text-slate-400">Cancel anytime · No hidden fees</p>
          </div>

          <button
            onClick={toggleSubscription}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200 transition-all active:scale-[0.98]"
          >
            Subscribe Now
          </button>
          <p className="text-xs text-slate-400 mt-3">7-day free trial included</p>
        </div>
      </div>
    </div>
  );
}
