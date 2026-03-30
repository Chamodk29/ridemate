'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import OnboardingModal from '@/components/OnboardingModal';
import CreatePostModal from '@/components/CreatePostModal';
import PaywallOverlay from '@/components/PaywallOverlay';

export default function FeedPage() {
  const { isLoggedIn, posts, showOnboarding, subscriptionActive, userMode } = useApp();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'offering' | 'looking'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  if (!mounted || !isLoggedIn) return null;

  const filteredPosts = activeFilter === 'all'
    ? posts
    : posts.filter(p => p.type === activeFilter);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Onboarding */}
      {showOnboarding && <OnboardingModal />}

      {/* Create modal */}
      {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} />}

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24 sm:pt-24">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Community Feed</h1>
          <p className="text-sm text-slate-400">
            {userMode === 'offering'
              ? "You're offering rides — help someone get there!"
              : userMode === 'looking'
              ? "You're looking for rides — find your next journey!"
              : 'Find and share rides with your community'}
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: 'all', label: 'All Rides' },
            { key: 'offering', label: '🚗 Offering' },
            { key: 'looking', label: '🔍 Looking' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key as typeof activeFilter)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === f.key
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="flex-shrink-0 ml-auto text-xs text-slate-400 flex items-center">
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Feed — wrapped in relative for paywall overlay */}
        <div className="relative">
          {/* Posts */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🚗</div>
                <p className="text-slate-500 font-medium">No posts yet</p>
                <p className="text-slate-400 text-sm mt-1">Be the first to post a ride!</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>

          {/* Paywall overlay */}
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
