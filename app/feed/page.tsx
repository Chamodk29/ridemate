'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import OnboardingModal from '@/components/OnboardingModal';
import CreatePostModal from '@/components/CreatePostModal';
import PaywallOverlay from '@/components/PaywallOverlay';
import CitySearch from '@/components/CitySearch';
import { CityResult, GenderPreference } from '@/types';

type RideType = 'all' | 'offering' | 'looking';
type TimeOfDay = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
type GenderFilter = GenderPreference | 'all';

interface Filters {
  rideType: RideType;
  gender: GenderFilter;
  timeOfDay: TimeOfDay;
}

function getTimeOfDay(time: string): TimeOfDay {
  const [h] = time.split(':').map(Number);
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

const TIME_OPTIONS: { key: TimeOfDay; label: string; icon: string; sub?: string }[] = [
  { key: 'all', label: 'Any time', icon: '🕐' },
  { key: 'morning', label: 'Morning', icon: '🌅', sub: '5am–12pm' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️', sub: '12–5pm' },
  { key: 'evening', label: 'Evening', icon: '🌆', sub: '5–9pm' },
  { key: 'night', label: 'Night', icon: '🌙', sub: '9pm–5am' },
];

export default function FeedPage() {
  const { isLoggedIn, posts, showOnboarding, subscriptionActive, selectedCity, setSelectedCity } = useApp();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({ rideType: 'all', gender: 'all', timeOfDay: 'all' });

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  const handleCitySelect = (city: CityResult) => setSelectedCity(city);

  const handleClearCity = () => {
    setSelectedCity(null);
    setFilters({ rideType: 'all', gender: 'all', timeOfDay: 'all' });
  };

  const clearFilters = () => setFilters({ rideType: 'all', gender: 'all', timeOfDay: 'all' });

  const activeFilterCount = [
    filters.rideType !== 'all',
    filters.gender !== 'all',
    filters.timeOfDay !== 'all',
  ].filter(Boolean).length;

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (selectedCity) {
        if (post.city.toLowerCase() !== selectedCity.name.toLowerCase()) return false;
        if (post.country.toLowerCase() !== selectedCity.country.toLowerCase()) return false;
      }
      if (filters.rideType !== 'all' && post.type !== filters.rideType) return false;
      if (filters.gender !== 'all' && post.genderPreference !== filters.gender) return false;
      if (filters.timeOfDay !== 'all' && getTimeOfDay(post.time) !== filters.timeOfDay) return false;
      return true;
    });
  }, [posts, selectedCity, filters]);

  if (!mounted || !isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {showOnboarding && <OnboardingModal />}
      {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} />}

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24 sm:pt-24">

        {/* Search + filter header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1">
              {selectedCity ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {selectedCity.countryCode
                      ? String.fromCodePoint(...selectedCity.countryCode.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
                      : '🌍'}
                  </span>
                  <div>
                    <p className="text-base font-bold text-slate-900 leading-tight">{selectedCity.name}</p>
                    <p className="text-xs text-slate-400">{selectedCity.country}</p>
                  </div>
                  <button onClick={handleClearCity}
                    className="ml-1 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Find a Ride</h1>
                  <p className="text-xs text-slate-400">Search any city or browse all rides below</p>
                </div>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all flex-shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-white text-violet-700 text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* City search bar — always visible */}
          <CitySearch
            value={selectedCity?.displayName || ''}
            onChange={handleCitySelect}
            onClear={handleClearCity}
            placeholder="Search city — e.g. Colombo, London, Mumbai..."
            size="lg"
          />
        </div>

        {/* Filter panel — collapsible, available always */}
        {showFilters && (
          <div className="mb-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">
                Filters
                {selectedCity && <span className="text-slate-400 font-normal"> · {selectedCity.name}</span>}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}</span>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-violet-600 font-medium hover:text-violet-700">
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Ride type */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ride Type</p>
                <div className="flex gap-2">
                  {([
                    { key: 'all', label: 'All rides' },
                    { key: 'offering', label: '🚗 Offering' },
                    { key: 'looking', label: '🔍 Looking' },
                  ] as const).map(opt => (
                    <button key={opt.key}
                      onClick={() => setFilters(f => ({ ...f, rideType: opt.key }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                        filters.rideType === opt.key
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time of day */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Time of Day</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {TIME_OPTIONS.map(opt => (
                    <button key={opt.key}
                      onClick={() => setFilters(f => ({ ...f, timeOfDay: opt.key }))}
                      className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-xs transition-all ${
                        filters.timeOfDay === opt.key
                          ? 'bg-violet-50 border border-violet-300 text-violet-700'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span className="font-medium leading-tight text-center">{opt.label}</span>
                      {opt.sub && <span className="text-slate-400 font-normal leading-tight">{opt.sub}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender preference */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gender Preference</p>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { key: 'all', label: 'Any' },
                    { key: 'any', label: 'Open to all' },
                    { key: 'female', label: '♀ Female only' },
                    { key: 'male', label: '♂ Male only' },
                  ] as const).map(opt => (
                    <button key={opt.key}
                      onClick={() => setFilters(f => ({ ...f, gender: opt.key }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        filters.gender === opt.key
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feed label */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-700">
            {selectedCity ? `Rides in ${selectedCity.name}` : 'All Rides'}
          </p>
          <span className="text-xs text-slate-400">{filteredPosts.length} ride{filteredPosts.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Feed */}
        <div className="relative">
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <div className="text-4xl mb-3">{selectedCity ? '🔍' : '🚗'}</div>
                <p className="text-slate-600 font-semibold">
                  {selectedCity ? `No rides found in ${selectedCity.name}` : 'No rides match your filters'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Try adjusting your filters or search a different city
                </p>
                <button onClick={() => { clearFilters(); setSelectedCity(null); }}
                  className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredPosts.map(post => <PostCard key={post.id} post={post} />)
            )}
          </div>
          {!subscriptionActive && <PaywallOverlay />}
        </div>
      </main>

      {/* FAB */}
      {subscriptionActive && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-violet-300 hover:shadow-violet-400 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-30"
          title="Post a ride"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}
