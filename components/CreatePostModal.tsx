'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Post, GenderPreference, CityResult } from '@/types';
import CitySearch from './CitySearch';

interface Props {
  onClose: () => void;
}

export default function CreatePostModal({ onClose }: Props) {
  const { currentUser, addPost, userMode } = useApp();
  const [type, setType] = useState<'offering' | 'looking'>(userMode === 'offering' ? 'offering' : 'looking');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('');
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('any');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleCitySelect = (result: CityResult) => {
    setCity(result.name);
    setCountry(result.country);
  };

  const handleSubmit = () => {
    if (!from || !to || !city || !country || !date || !time || !description || !currentUser) return;
    setSubmitting(true);
    setTimeout(() => {
      const post: Post = {
        id: `post-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        userVerification: currentUser.verificationStatus,
        userGender: currentUser.gender,
        type,
        from,
        to,
        city,
        country,
        date,
        time,
        seats: type === 'offering' && seats ? parseInt(seats) : undefined,
        genderPreference,
        description,
        timestamp: new Date().toISOString(),
        comments: [],
      };
      addPost(post);
      handleClose();
    }, 600);
  };

  const isValid = from && to && city && country && date && time && description;

  const genderOptions: { key: GenderPreference; label: string; icon: string }[] = [
    { key: 'any', label: 'Anyone', icon: '👥' },
    { key: 'female', label: 'Female only', icon: '♀️' },
    { key: 'male', label: 'Male only', icon: '♂️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      <div className={`relative w-full max-w-lg bg-white rounded-3xl shadow-2xl transition-all duration-300 max-h-[92vh] flex flex-col ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Post a Ride</h2>
            <p className="text-xs text-slate-400 mt-0.5">Share your journey with the community</p>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            {(['looking', 'offering'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'offering' ? '🚗 Offering a Ride' : '🔍 Looking for a Ride'}
              </button>
            ))}
          </div>

          {/* City search */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              City <span className="text-rose-400">*</span>
            </label>
            <CitySearch
              value={city ? `${city}, ${country}` : ''}
              onChange={handleCitySelect}
              onClear={() => { setCity(''); setCountry(''); }}
              placeholder="Search city (e.g. Colombo, London...)"
              size="sm"
            />
            {city && (
              <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {city}, {country}
              </p>
            )}
          </div>

          {/* From / To */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">From</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="4" /></svg>
                </div>
                <input
                  type="text" value={from} onChange={e => setFrom(e.target.value)}
                  placeholder="Pickup location"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">To</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text" value={to} onChange={e => setTo(e.target.value)}
                  placeholder="Destination"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
          </div>

          {/* Seats (offering only) */}
          {type === 'offering' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Available Seats</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setSeats(String(n))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                      seats === String(n) ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gender preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Preferred Rider Gender
            </label>
            <div className="flex gap-2">
              {genderOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setGenderPreference(opt.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    genderPreference === opt.key
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Share any additional details — luggage, stops, preferences..."
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              isValid && !submitting
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200 active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Posting...
              </>
            ) : 'Post Ride'}
          </button>
        </div>
      </div>
    </div>
  );
}
