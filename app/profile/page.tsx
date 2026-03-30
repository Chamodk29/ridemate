'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import VerificationBadge from '@/components/VerificationBadge';

export default function ProfilePage() {
  const { isLoggedIn, currentUser, posts, subscriptionActive, toggleSubscription } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  if (!mounted || !currentUser) return null;

  const userPosts = posts.filter(p => p.userId === currentUser.id);

  const verificationConfig = {
    verified: {
      label: 'Verified Member',
      description: 'Identity confirmed. Trusted by the community.',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
    },
    pending: {
      label: 'Verification Pending',
      description: 'Your documents are under review.',
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      dot: 'bg-amber-400',
    },
    not_verified: {
      label: 'Not Verified',
      description: 'Complete verification to build trust.',
      color: 'bg-slate-50 border-slate-200 text-slate-600',
      dot: 'bg-slate-400',
    },
  };

  const vc = verificationConfig[currentUser.verificationStatus];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24 sm:pt-24">
        {/* Profile card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-24 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 relative">
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,50 C100,0 200,100 300,50 C350,25 375,75 400,50 L400,100 L0,100 Z" fill="white"/>
              </svg>
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-8 mb-4">
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-2xl bg-white ring-4 ring-white shadow-lg"
                />
                {currentUser.verificationStatus === 'verified' && (
                  <span className="absolute -bottom-1 -right-1 text-emerald-500 bg-white rounded-full p-0.5 shadow">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                )}
              </div>

              <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Edit Profile
              </button>
            </div>

            {/* Name & details */}
            <h1 className="text-xl font-bold text-slate-900 mb-0.5">{currentUser.name}</h1>
            <p className="text-sm text-slate-400 mb-3">{currentUser.email}</p>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{currentUser.bio}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Rides', value: currentUser.totalRides },
                { label: 'Rating', value: `${currentUser.rating} ★` },
                { label: 'Since', value: currentUser.memberSince.split(' ')[1] },
              ].map(stat => (
                <div key={stat.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Verification status */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${vc.color} mb-3`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${vc.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{vc.label}</p>
                <p className="text-xs opacity-70">{vc.description}</p>
              </div>
              <VerificationBadge status={currentUser.verificationStatus} size="md" />
            </div>

            {/* Subscription status */}
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                subscriptionActive
                  ? 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              onClick={toggleSubscription}
              title="Click to toggle subscription (demo)"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                subscriptionActive ? 'bg-violet-100' : 'bg-slate-100'
              }`}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                  <path fillRule="evenodd" d="M13 8h-2v8h2V8zm-4 0H7v8h2V8z" opacity="0"/>
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {subscriptionActive ? 'Pro Subscription' : 'Free Plan'}
                </p>
                <p className="text-xs opacity-70">
                  {subscriptionActive ? 'Active · Full community access' : 'Upgrade to unlock the feed'}
                </p>
              </div>
              <div className={`flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${subscriptionActive ? 'bg-violet-600' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${subscriptionActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-slate-100 p-1 mb-4 shadow-sm">
          {([
            { key: 'posts', label: `My Posts (${userPosts.length})` },
            { key: 'about', label: 'About' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <div className="text-3xl mb-2">🚗</div>
                <p className="text-slate-500 font-medium">No posts yet</p>
                <p className="text-slate-400 text-sm mt-1">Post your first ride from the feed!</p>
              </div>
            ) : (
              userPosts.map(post => <PostCard key={post.id} post={post} />)
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Member since</p>
              <p className="text-sm text-slate-700">{currentUser.memberSince}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bio</p>
              <p className="text-sm text-slate-700 leading-relaxed">{currentUser.bio}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Verification</p>
              <VerificationBadge status={currentUser.verificationStatus} showLabel size="md" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Community stats</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-slate-900">{currentUser.totalRides}</p>
                  <p className="text-xs text-slate-400">Total rides</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-slate-900">{currentUser.rating}</p>
                  <p className="text-xs text-slate-400">Average rating</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
