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
import SearchFilters, { FilterState } from '@/components/SearchFilters';
import { CityResult } from '@/types';

function getTimeOfDay(time: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const [h] = time.split(':').map(Number);
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export default function FeedPage() {
  const { isLoggedIn, posts, showOnboarding, subscriptionActive, selectedCity, setSelectedCity } = useApp();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    rideType: 'all',
    gender: 'all',
    timeOfDay: 'all',
  });

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  const handleCitySelect = (city: CityResult) => {
    setSelectedCity(city);
    setShowFilters(true);
  };

  const handleClearCity = () => {
    setSelectedCity(null);
    setShowFilters(false);
    setFilters({ rideType: 'all', gender: 'all', timeOfDay: 'all' });
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // City filter
      if (selectedCity) {
        const cityMatch = post.city.toLowerCase() === selectedCity.name.toLowerCase();
        const countryMatch = post.country.toLowerCase() === selectedCity.country.toLowerCase();
        if (!cityMatch || !countryMatch) return false;
      }

      // Ride type
      if (filters.rideType !== 'all' && post.type !== filters.rideType) return false;

      // Gender preference
      if (filters.gender !== 'all' && post.genderPreference !== filters.gender) return false;

      // Time of day
      if (filters.timeOfDay !== 'all') {
        const tod = getTimeOfDay(post.time);
        if (tod !== filters.timeOfDay) return false;
      }

      return true;
    });
  }, [posts, selectedCity, filters]);

  if (!mounted || !isLoggedIn) return null;

  const isSearching = !!selectedCity;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {showOnboarding && <OnboardingModal />}
      {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} />}

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24 sm:pt-24">
        {/* Hero search bar */}
        <div className="mb-6">
          {!isSearching ? (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Find a Ride</h1>
              <p className="text-sm text-slate-400 mb-4">Search any city in the world to find available rides</p>
              <CitySearch
                value=""
                onChange={handleCitySelect}
                onClear={handleClearCity}
                placeholder="Search city — e.g. Colombo, London, Mumbai..."
                size="lg"
              />
            </div>
          ) : (
            <div>
              {/* Active city search header */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleClearCity}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl border border-slate-200 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {selectedCity.countryCode
                        ? String.fromCodePoint(...selectedCity.countryCode.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
                        : '🌍'}
                    </span>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900">{selectedCity.name}</h1>
                      <p className="text-xs text-slate-400">{selectedCity.country}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    showFilters
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {(filters.rideType !== 'all' || filters.gender !== 'all' || filters.timeOfDay !== 'all') && (
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                  )}
                </button>
              </div>

              {/* Change city */}
              <CitySearch
                value={selectedCity.displayName}
                onChange={handleCitySelect}
                onClear={handleClearCity}
                placeholder="Change city..."
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Filters panel */}
        {isSearching && showFilters && (
          <div className="mb-4">
            <SearchFilters
              filters={filters}
              onChange={setFilters}
              resultCount={filteredPosts.length}
              cityName={selectedCity?.name}
            />
          </div>
        )}

        {/* Browse all label when not searching */}
        {!isSearching && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-700">Community Feed</h2>
            <span className="text-xs text-slate-400">{posts.length} ride{posts.length !== 1 ? 's' : ''} posted</span>
          </div>
        )}

        {/* Feed */}
        <div className="relative">
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <div className="text-4xl mb-3">{isSearching ? '🔍' : '🚗'}</div>
                <p className="text-slate-600 font-semibold">
                  {isSearching ? `No rides found in ${selectedCity?.name}` : 'No rides posted yet'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {isSearching ? 'Try adjusting your filters or search another city' : 'Be the first to post a ride!'}
                </p>
                {isSearching && (
                  <button
                    onClick={() => setFilters({ rideType: 'all', gender: 'all', timeOfDay: 'all' })}
                    className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
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
