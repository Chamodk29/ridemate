'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';
import { Post } from '@/types';
import Navbar from '@/components/Navbar';
import VerificationBadge from '@/components/VerificationBadge';
import CommentsSection from '@/components/CommentsSection';

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function mapPost(p: any): Post {
  return {
    id: p.id,
    userId: p.user_id,
    userName: p.profile?.name ?? 'Unknown',
    userAvatar: p.profile?.avatar ?? '',
    userVerification: p.profile?.verification_status ?? 'not_verified',
    userGender: p.profile?.gender,
    type: p.type,
    from: p.from_location,
    to: p.to_location,
    city: p.city,
    country: p.country,
    date: p.date,
    time: p.time,
    seats: p.seats,
    genderPreference: p.gender_preference,
    costType: p.cost_type ?? 'split',
    costAmount: p.cost_amount ?? undefined,
    description: p.description ?? '',
    timestamp: p.created_at,
    comments: (p.comments ?? []).map((c: any) => ({
      id: c.id,
      userId: c.user?.id ?? c.user_id,
      userName: c.user?.name ?? 'Unknown',
      userAvatar: c.user?.avatar ?? '',
      userVerification: c.user?.verification_status ?? 'not_verified',
      content: c.content,
      timestamp: c.created_at,
    })),
  };
}

function RideDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-40 bg-slate-200 rounded-2xl" />
      <div className="bg-white rounded-2xl p-5 space-y-3">
        <div className="h-5 w-48 bg-slate-200 rounded-full" />
        <div className="h-4 w-32 bg-slate-100 rounded-full" />
        <div className="h-16 bg-slate-100 rounded-xl" />
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl" />
    </div>
  );
}

export default function RideDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, openDM, isLoggedIn } = useApp();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles!posts_user_id_fkey(name, avatar, verification_status, gender),
          comments(
            id, content, created_at, user_id,
            user:profiles!comments_user_id_fkey(id, name, avatar, verification_status)
          )
        `)
        .eq('id', id)
        .single();

      if (data) {
        setPost(mapPost(data));
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (!mounted || !isLoggedIn) return null;

  const isOffering = post?.type === 'offering';
  const isOwn = currentUser?.id === post?.userId;

  const mapOrigin = post ? encodeURIComponent(`${post.from}, ${post.city}, ${post.country}`) : '';
  const mapDest   = post ? encodeURIComponent(`${post.to}, ${post.city}, ${post.country}`) : '';
  const mapSrc    = `https://maps.google.com/maps?f=d&saddr=${mapOrigin}&daddr=${mapDest}&output=embed&t=m&z=12`;
  const mapLink   = post ? `https://www.google.com/maps/dir/${mapOrigin}/${mapDest}` : '#';

  const GENDER_LABELS = {
    male: { label: 'Male only', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    female: { label: 'Female only', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    any: { label: 'Open to all', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-32 sm:pt-24">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {loading ? (
          <RideDetailSkeleton />
        ) : notFound ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-slate-700 font-semibold">Ride not found</p>
            <p className="text-slate-400 text-sm mt-1">It may have been deleted.</p>
            <button onClick={() => router.push('/feed')} className="mt-4 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
              Browse Feed
            </button>
          </div>
        ) : post ? (
          <div className="space-y-4">
            {/* Hero card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className={`h-1 ${isOffering ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-violet-400 to-indigo-400'}`} />

              <div className="p-5">
                {/* Type badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                    isOffering ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-violet-50 text-violet-700 border border-violet-200'
                  }`}>
                    {isOffering ? '🚗 Offering a Ride' : '🔍 Looking for a Ride'}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">{timeAgo(post.timestamp)}</span>
                </div>

                {/* Route — big */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl mb-5">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${isOffering ? 'bg-emerald-500' : 'bg-violet-500'}`} />
                    <div className="w-px h-8 bg-slate-300" />
                    <div className={`w-3 h-3 rounded-sm rotate-45 ${isOffering ? 'bg-emerald-500' : 'bg-violet-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900">{post.from}</p>
                    <p className="text-xs text-slate-400 my-1.5">to</p>
                    <p className="text-base font-bold text-slate-900">{post.to}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{post.city}</p>
                    <p className="text-xs text-slate-400">{post.country}</p>
                  </div>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Date</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(post.date)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Departure</p>
                    <p className="text-sm font-semibold text-slate-800">{formatTime(post.time)}</p>
                  </div>
                  {post.seats && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-0.5">Seats available</p>
                      <p className="text-sm font-semibold text-slate-800">{post.seats}</p>
                    </div>
                  )}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Preference</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {GENDER_LABELS[post.genderPreference]?.label ?? 'Open to all'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Cost</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {post.costType === 'free' && '🎁 Free'}
                      {post.costType === 'split' && '⛽ Fuel split'}
                      {post.costType === 'fixed' && post.costAmount
                        ? `💵 LKR ${post.costAmount.toLocaleString()}`
                        : post.costType === 'fixed' ? '💵 Fixed' : ''}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {post.description && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{post.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Poster profile */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Posted by</p>
              <div className="flex items-center gap-3">
                <img src={post.userAvatar} alt={post.userName} className="w-12 h-12 rounded-full bg-slate-100 ring-2 ring-white shadow-sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">{post.userName}</span>
                    <VerificationBadge status={post.userVerification} showLabel />
                  </div>
                  {post.userGender && post.userGender !== 'prefer_not_to_say' && (
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{post.userGender}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Google Maps */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Route Map</p>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-violet-600 font-medium hover:text-violet-700 transition-colors"
                >
                  Open in Maps
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <iframe
                src={mapSrc}
                className="w-full h-72 border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Route from ${post.from} to ${post.to}`}
              />
            </div>

            {/* Comments */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Comments ({post.comments.length})
                </p>
              </div>
              <div className="px-5 pb-4">
                <CommentsSection postId={post.id} comments={post.comments} />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Fixed bottom CTA */}
      {post && !isOwn && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-100 p-4 z-30">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => openDM(post)}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message {post.userName.split(' ')[0]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
