'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import PaywallOverlay from '@/components/PaywallOverlay';

type Tab = 'groups' | 'trips' | 'members';

interface Group {
  id: string;
  emoji: string;
  name: string;
  description: string;
  city: string;
  country: string;
  members: number;
  category: string;
  joined: boolean;
  isPublic: boolean;
}

interface PlannedTrip {
  id: string;
  title: string;
  from: string;
  to: string;
  date: string;
  time: string;
  organizer: string;
  organizerAvatar: string;
  totalSpots: number;
  filledSpots: number;
  groupName: string;
  groupEmoji: string;
  description: string;
}

const INITIAL_GROUPS: Group[] = [
  {
    id: 'g1', emoji: '🏙️', name: 'Colombo Daily Commuters',
    description: 'Connect with professionals making the daily Colombo grind. Beat traffic together and share costs.',
    city: 'Colombo', country: 'Sri Lanka', members: 847, category: 'Commuters', joined: false, isPublic: true,
  },
  {
    id: 'g2', emoji: '🌿', name: 'Kandy–Colombo Corridor',
    description: 'Regular commuters on the A1 highway. Morning and evening runs, weekdays and weekends.',
    city: 'Kandy', country: 'Sri Lanka', members: 523, category: 'Commuters', joined: true, isPublic: true,
  },
  {
    id: 'g3', emoji: '🌊', name: 'Galle Coastal Riders',
    description: 'Weekend and daily trips along the southern coastal highway. Great views, even better company.',
    city: 'Galle', country: 'Sri Lanka', members: 312, category: 'Leisure', joined: false, isPublic: true,
  },
  {
    id: 'g4', emoji: '✈️', name: 'Airport Transfer Network',
    description: 'Coordinate early morning and late-night airport runs. Split costs, never overpay for a cab again.',
    city: 'Colombo', country: 'Sri Lanka', members: 1204, category: 'Airport', joined: false, isPublic: true,
  },
  {
    id: 'g5', emoji: '🏔️', name: 'Hill Country Explorers',
    description: 'Scenic drives through Kandy, Nuwara Eliya, Ella, and beyond. For those who love the journey.',
    city: 'Kandy', country: 'Sri Lanka', members: 289, category: 'Leisure', joined: false, isPublic: true,
  },
  {
    id: 'g6', emoji: '🎓', name: 'University Carpools LK',
    description: 'Students sharing rides to Peradeniya, Colombo, Moratuwa, and SLIIT campuses.',
    city: 'Colombo', country: 'Sri Lanka', members: 672, category: 'Students', joined: false, isPublic: true,
  },
];

const PLANNED_TRIPS: PlannedTrip[] = [
  {
    id: 't1', title: 'Weekend Drive to Sigiriya',
    from: 'Colombo', to: 'Sigiriya', date: '2026-07-12', time: '06:00',
    organizer: 'Kasun P.', organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KasunP&backgroundColor=c0aede',
    totalSpots: 4, filledSpots: 2, groupName: 'Hill Country Explorers', groupEmoji: '🏔️',
    description: 'Day trip to Sigiriya rock fortress. Back by evening. Entry fee (LKR 5,000) not included in carpool cost. Comfortable SUV, AC. Stopping for breakfast on the way.',
  },
  {
    id: 't2', title: 'Colombo → Ella Scenic Route',
    from: 'Colombo', to: 'Ella', date: '2026-07-19', time: '05:30',
    organizer: 'Priya F.', organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaF&backgroundColor=ffdfbf',
    totalSpots: 5, filledSpots: 1, groupName: 'Hill Country Explorers', groupEmoji: '🏔️',
    description: 'Overnight trip via the scenic highland route. Stopping at Nuwara Eliya for breakfast and Haputale for lunch. Return trip on Sunday evening — coordinate separately.',
  },
  {
    id: 't3', title: 'Galle Literary Festival Run',
    from: 'Colombo', to: 'Galle Fort', date: '2026-08-02', time: '08:00',
    organizer: 'Dilanka S.', organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DilankaS&backgroundColor=ffd5dc',
    totalSpots: 6, filledSpots: 4, groupName: 'Galle Coastal Riders', groupEmoji: '🌊',
    description: 'Day trip to the Galle Literary Festival. Leaving from Colombo 7. Return same evening around 7 PM. Only 2 spots left — grab them fast!',
  },
  {
    id: 't4', title: 'Early Morning Airport Run',
    from: 'Colombo', to: 'BIA Airport', date: '2026-07-08', time: '03:30',
    organizer: 'Nimal J.', organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NimalJ&backgroundColor=d1d4f9',
    totalSpots: 3, filledSpots: 1, groupName: 'Airport Transfer Network', groupEmoji: '✈️',
    description: 'Sharing a cab to the airport for 6 AM flights. Split 3 ways — approximately LKR 800 each. Pickup from Colombo 3 area.',
  },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Commuters: 'bg-blue-50 text-blue-700 border-blue-200',
  Leisure:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Airport:   'bg-amber-50 text-amber-700 border-amber-200',
  Students:  'bg-violet-50 text-violet-700 border-violet-200',
};

// ── Group Detail Modal ────────────────────────────────────────────────────────

function GroupDetailModal({ group, trips, onClose, onToggleJoin }: {
  group: Group;
  trips: PlannedTrip[];
  onClose: () => void;
  onToggleJoin: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const relatedTrips = trips.filter(t => t.groupName === group.name);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const close = () => { setVisible(false); setTimeout(onClose, 250); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={close} />
      <div className={`relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col transition-all duration-250 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500 sm:rounded-t-3xl rounded-t-3xl" />

        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 flex-shrink-0">
            {group.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{group.name}</h2>
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${group.isPublic ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {group.isPublic ? '🌍 Public' : '🔒 Private'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[group.category] ?? ''}`}>{group.category}</span>
              <span className="text-xs text-slate-400">{group.city}, {group.country}</span>
            </div>
          </div>
          <button onClick={close} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 px-6 mb-4">
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{group.members.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Members</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{relatedTrips.length}</p>
            <p className="text-xs text-slate-400">Trips planned</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{group.isPublic ? 'Open' : 'Invite'}</p>
            <p className="text-xs text-slate-400">Membership</p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-5">
          {/* About */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">About</p>
            <p className="text-sm text-slate-700 leading-relaxed">{group.description}</p>
          </div>

          {/* Upcoming trips from this group */}
          {relatedTrips.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Upcoming Trips</p>
              <div className="space-y-2">
                {relatedTrips.map(trip => (
                  <div key={trip.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{trip.title}</p>
                      <p className="text-xs text-slate-400">{formatDate(trip.date)} · {trip.from} → {trip.to}</p>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {trip.filledSpots}/{trip.totalSpots} going
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Join CTA */}
        <div className="p-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => { onToggleJoin(); close(); }}
            className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
              group.joined
                ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200 hover:from-violet-700 hover:to-indigo-700'
            }`}
          >
            {group.joined ? 'Leave Group' : `Join ${group.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trip Detail Modal ─────────────────────────────────────────────────────────

function TripDetailModal({ trip, isJoined, onClose, onToggleJoin }: {
  trip: PlannedTrip;
  isJoined: boolean;
  onClose: () => void;
  onToggleJoin: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const spotsLeft = trip.totalSpots - trip.filledSpots - (isJoined ? 1 : 0);
  const isFull = spotsLeft <= 0;

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const close = () => { setVisible(false); setTimeout(onClose, 250); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={close} />
      <div className={`relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col transition-all duration-250 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500 sm:rounded-t-3xl rounded-t-3xl" />

        {/* Header */}
        <div className="flex items-start gap-3 p-6 pb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span>{trip.groupEmoji}</span>
              <span className="text-xs text-slate-400">{trip.groupName}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{trip.title}</h2>
          </div>
          <button onClick={close} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-5">
          {/* Route */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="w-px h-6 bg-slate-300" />
              <div className="w-2.5 h-2.5 rotate-45 bg-violet-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">{trip.from}</p>
              <p className="text-xs text-slate-400 my-1">to</p>
              <p className="text-sm font-bold text-slate-900">{trip.to}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{formatDate(trip.date)}</p>
              <p className="text-xs text-slate-400">{formatTime(trip.time)}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">About this trip</p>
            <p className="text-sm text-slate-700 leading-relaxed">{trip.description}</p>
          </div>

          {/* Organiser */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Organiser</p>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <img src={trip.organizerAvatar} alt={trip.organizer} className="w-10 h-10 rounded-full" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{trip.organizer}</p>
                <p className="text-xs text-slate-400">Trip organiser</p>
              </div>
            </div>
          </div>

          {/* Spots */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Availability</p>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-600 font-medium">{trip.filledSpots + (isJoined ? 1 : 0)} people going</span>
                <span className={`font-semibold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isJoined ? "You're in!" : isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${((trip.filledSpots + (isJoined ? 1 : 0)) / trip.totalSpots) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{trip.totalSpots} total spots</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => { onToggleJoin(); close(); }}
            disabled={isFull && !isJoined}
            className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
              isJoined
                ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                : isFull
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200 hover:from-violet-700 hover:to-indigo-700'
            }`}
          >
            {isJoined ? "Leave Trip" : isFull ? "Trip is Full" : "Join This Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const router = useRouter();
  const { isLoggedIn, subscriptionActive, showToast } = useApp();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('groups');
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [joinedTrips, setJoinedTrips] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<PlannedTrip | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showPlanTrip, setShowPlanTrip] = useState(false);

  // Create group form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCity, setNewGroupCity] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Commuters');
  const [newGroupPublic, setNewGroupPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  if (!mounted || !isLoggedIn) return null;

  const handleJoinGroup = (id: string) => {
    setGroups(prev => prev.map(g =>
      g.id === id ? { ...g, joined: !g.joined, members: g.joined ? g.members - 1 : g.members + 1 } : g
    ));
    const group = groups.find(g => g.id === id);
    if (group) showToast(group.joined ? `Left "${group.name}"` : `Joined "${group.name}"!`);
  };

  const handleJoinTrip = (id: string) => {
    setJoinedTrips(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); showToast('Left trip'); }
      else { next.add(id); showToast('Joined trip!'); }
      return next;
    });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !newGroupCity.trim()) return;
    setCreating(true);
    setTimeout(() => {
      const newGroup: Group = {
        id: `g-${Date.now()}`, emoji: '🚗',
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || 'A new carpool group.',
        city: newGroupCity.trim(), country: 'Sri Lanka',
        members: 1, category: newGroupCategory,
        joined: true, isPublic: newGroupPublic,
      };
      setGroups(prev => [newGroup, ...prev]);
      setShowCreateGroup(false);
      setNewGroupName(''); setNewGroupDesc(''); setNewGroupCity('');
      setCreating(false);
      showToast(`Group "${newGroup.name}" created!`);
    }, 700);
  };

  const joinedCount = groups.filter(g => g.joined).length;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'groups', label: 'Groups', icon: '👥' },
    { key: 'trips', label: 'Planned Trips', icon: '🗺️' },
    { key: 'members', label: 'Members', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24 sm:pt-24">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Community</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {joinedCount > 0 ? `You're in ${joinedCount} group${joinedCount !== 1 ? 's' : ''}` : 'Join groups and plan rides together'}
              </p>
            </div>
            {activeTab === 'groups' && (
              <button onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Group
              </button>
            )}
            {activeTab === 'trips' && (
              <button onClick={() => setShowPlanTrip(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Plan a Trip
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-white border border-slate-200 rounded-xl p-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          {/* ── Groups ── */}
          {activeTab === 'groups' && (
            <div className="space-y-3">
              {groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-5 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border border-slate-100">
                      {group.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm leading-tight">{group.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[group.category] ?? ''}`}>
                              {group.category}
                            </span>
                            <span className="text-xs text-slate-400">{group.city}</span>
                            <span className={`text-xs ${group.isPublic ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {group.isPublic ? '🌍 Public' : '🔒 Private'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleJoinGroup(group.id); }}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            group.joined
                              ? 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                              : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                          }`}
                        >
                          {group.joined ? 'Joined ✓' : 'Join'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">{group.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-400">
                          <span className="font-medium text-slate-600">{group.members.toLocaleString()}</span> members
                        </p>
                        <span className="text-xs text-violet-500 font-medium">View details →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Planned Trips ── */}
          {activeTab === 'trips' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-1">Community members planning trips — join to coordinate travel</p>
              {PLANNED_TRIPS.map(trip => {
                const isJoined = joinedTrips.has(trip.id);
                const spotsLeft = trip.totalSpots - trip.filledSpots - (isJoined ? 1 : 0);
                const isFull = spotsLeft <= 0;
                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-5 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{trip.groupEmoji}</span>
                          <span className="text-xs text-slate-400">{trip.groupName}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm">{trip.title}</h3>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleJoinTrip(trip.id); }}
                        disabled={isFull && !isJoined}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isJoined ? 'bg-violet-50 text-violet-700 border border-violet-200'
                          : isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                        }`}
                      >
                        {isJoined ? 'Going ✓' : isFull ? 'Full' : 'Join'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3 p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-xs font-semibold text-slate-700">{trip.from}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-400 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-700">{trip.to}</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{trip.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-400">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {formatDate(trip.date)} · {formatTime(trip.time)}
                      </span>
                      <div className="flex items-center gap-2">
                        <img src={trip.organizerAvatar} alt={trip.organizer} className="w-5 h-5 rounded-full" />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isJoined ? 'bg-violet-50 text-violet-600' : spotsLeft <= 1 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isJoined ? "You're in" : isFull ? 'Full' : `${spotsLeft} left`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${((trip.filledSpots + (isJoined ? 1 : 0)) / trip.totalSpots) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'members' && <MembersTab />}

          {!subscriptionActive && <PaywallOverlay />}
        </div>
      </main>

      {/* ── Group Detail Modal ── */}
      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          trips={PLANNED_TRIPS}
          onClose={() => setSelectedGroup(null)}
          onToggleJoin={() => handleJoinGroup(selectedGroup.id)}
        />
      )}

      {/* ── Trip Detail Modal ── */}
      {selectedTrip && (
        <TripDetailModal
          trip={selectedTrip}
          isJoined={joinedTrips.has(selectedTrip.id)}
          onClose={() => setSelectedTrip(null)}
          onToggleJoin={() => handleJoinTrip(selectedTrip.id)}
        />
      )}

      {/* ── Create Group Modal ── */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateGroup(false)} />
          <div className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Create a Group</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Group Name <span className="text-rose-400">*</span></label>
                  <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                    placeholder="e.g. Colombo South Commuters"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">City <span className="text-rose-400">*</span></label>
                  <input type="text" value={newGroupCity} onChange={e => setNewGroupCity(e.target.value)}
                    placeholder="e.g. Colombo"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Commuters', 'Leisure', 'Airport', 'Students'] as const).map(cat => (
                      <button key={cat} onClick={() => setNewGroupCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                          newGroupCategory === cat ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                  <textarea value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)}
                    placeholder="What's this group about?" rows={2}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none" />
                </div>

                {/* Public / Private toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Visibility</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewGroupPublic(true)}
                      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all ${
                        newGroupPublic ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg">🌍</span>
                      <span>Public</span>
                      <span className={`text-[10px] ${newGroupPublic ? 'text-emerald-500' : 'text-slate-400'}`}>Anyone can join</span>
                    </button>
                    <button
                      onClick={() => setNewGroupPublic(false)}
                      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all ${
                        !newGroupPublic ? 'bg-slate-100 text-slate-700 border-slate-400' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg">🔒</span>
                      <span>Private</span>
                      <span className={`text-[10px] ${!newGroupPublic ? 'text-slate-500' : 'text-slate-400'}`}>Invite only</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCreateGroup(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || !newGroupCity.trim() || creating}
                  className="flex-1 py-3 bg-violet-600 text-white rounded-2xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {creating
                    ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating…</>
                    : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Plan a Trip Modal ── */}
      {showPlanTrip && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPlanTrip(false)} />
          <div className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Plan a Group Trip</h2>
              <p className="text-xs text-slate-400 mb-4">Propose a trip and let community members join</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">From <span className="text-rose-400">*</span></label>
                    <input type="text" placeholder="Departure"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">To <span className="text-rose-400">*</span></label>
                    <input type="text" placeholder="Destination"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date</label>
                    <input type="date" min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Total Spots</label>
                    <input type="number" min={1} max={20} placeholder="e.g. 4"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Post to Group</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                    {groups.filter(g => g.joined).map(g => (
                      <option key={g.id}>{g.emoji} {g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                  <textarea placeholder="Trip details, cost estimate, stops..." rows={2}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowPlanTrip(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={() => { setShowPlanTrip(false); showToast('Trip posted to your group!'); }}
                  className="flex-1 py-3 bg-violet-600 text-white rounded-2xl text-sm font-semibold hover:bg-violet-700 transition-colors">
                  Post Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────

function MembersTab() {
  const { currentUser } = useApp();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient()
        .from('profiles')
        .select('id, name, avatar, verification_status, bio, total_rides, rating')
        .order('total_rides', { ascending: false })
        .limit(20)
        .then(({ data }) => { setMembers(data ?? []); setLoading(false); });
    });
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded-full" />
            <div className="h-3 w-48 bg-slate-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 mb-1">{members.length} member{members.length !== 1 ? 's' : ''} in your community</p>
      {members.map(m => (
        <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
            alt={m.name} className="w-12 h-12 rounded-full bg-slate-100 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-sm">{m.name}</span>
              {m.verification_status === 'verified' && (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-500 flex-shrink-0">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              {m.id === currentUser?.id && <span className="text-xs text-violet-600 font-medium">(you)</span>}
            </div>
            {m.bio && <p className="text-xs text-slate-400 mt-0.5 truncate">{m.bio}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-slate-900">{m.total_rides ?? 0}</p>
            <p className="text-xs text-slate-400">rides</p>
          </div>
        </div>
      ))}
    </div>
  );
}
