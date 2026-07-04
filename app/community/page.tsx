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
    id: 'g1',
    emoji: '🏙️',
    name: 'Colombo Daily Commuters',
    description: 'Connect with professionals making the daily Colombo grind. Beat traffic together and share costs.',
    city: 'Colombo', country: 'Sri Lanka',
    members: 847, category: 'Commuters', joined: false,
  },
  {
    id: 'g2',
    emoji: '🌿',
    name: 'Kandy–Colombo Corridor',
    description: 'Regular commuters on the A1 highway. Morning and evening runs, weekdays and weekends.',
    city: 'Kandy', country: 'Sri Lanka',
    members: 523, category: 'Commuters', joined: true,
  },
  {
    id: 'g3',
    emoji: '🌊',
    name: 'Galle Coastal Riders',
    description: 'Weekend and daily trips along the southern coastal highway. Great views, even better company.',
    city: 'Galle', country: 'Sri Lanka',
    members: 312, category: 'Leisure', joined: false,
  },
  {
    id: 'g4',
    emoji: '✈️',
    name: 'Airport Transfer Network',
    description: 'Coordinate early morning and late-night airport runs. Split costs, never overpay for a cab again.',
    city: 'Colombo', country: 'Sri Lanka',
    members: 1204, category: 'Airport', joined: false,
  },
  {
    id: 'g5',
    emoji: '🏔️',
    name: 'Hill Country Explorers',
    description: 'Scenic drives through Kandy, Nuwara Eliya, Ella, and beyond. For those who love the journey.',
    city: 'Kandy', country: 'Sri Lanka',
    members: 289, category: 'Leisure', joined: false,
  },
  {
    id: 'g6',
    emoji: '🎓',
    name: 'University Carpools LK',
    description: 'Students sharing rides to Peradeniya, Colombo, Moratuwa, and SLIIT campuses.',
    city: 'Colombo', country: 'Sri Lanka',
    members: 672, category: 'Students', joined: false,
  },
];

const PLANNED_TRIPS: PlannedTrip[] = [
  {
    id: 't1',
    title: 'Weekend Drive to Sigiriya',
    from: 'Colombo', to: 'Sigiriya',
    date: '2026-07-12', time: '06:00',
    organizer: 'Kasun P.',
    organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KasunP&backgroundColor=c0aede',
    totalSpots: 4, filledSpots: 2,
    groupName: 'Hill Country Explorers', groupEmoji: '🏔️',
    description: 'Day trip to Sigiriya rock fortress. Back by evening. Entry fee not included.',
  },
  {
    id: 't2',
    title: 'Colombo → Ella Scenic Route',
    from: 'Colombo', to: 'Ella',
    date: '2026-07-19', time: '05:30',
    organizer: 'Priya F.',
    organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaF&backgroundColor=ffdfbf',
    totalSpots: 5, filledSpots: 1,
    groupName: 'Hill Country Explorers', groupEmoji: '🏔️',
    description: 'Overnight trip via the scenic highland route. Stopping at Nuwara Eliya for breakfast.',
  },
  {
    id: 't3',
    title: 'Galle Literary Festival Run',
    from: 'Colombo', to: 'Galle Fort',
    date: '2026-08-02', time: '08:00',
    organizer: 'Dilanka S.',
    organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DilankaS&backgroundColor=ffd5dc',
    totalSpots: 6, filledSpots: 4,
    groupName: 'Galle Coastal Riders', groupEmoji: '🌊',
    description: 'Day trip to the Galle Literary Festival. Return same evening. 2 spots left!',
  },
  {
    id: 't4',
    title: 'Early Morning Airport Run',
    from: 'Colombo', to: 'BIA Airport',
    date: '2026-07-08', time: '03:30',
    organizer: 'Nimal J.',
    organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NimalJ&backgroundColor=d1d4f9',
    totalSpots: 3, filledSpots: 1,
    groupName: 'Airport Transfer Network', groupEmoji: '✈️',
    description: 'Sharing a cab to the airport for 6 AM flights. Split 3 ways — LKR 800 each.',
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

export default function CommunityPage() {
  const router = useRouter();
  const { isLoggedIn, subscriptionActive, currentUser, showToast } = useApp();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('groups');
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [joinedTrips, setJoinedTrips] = useState<Set<string>>(new Set());
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showPlanTrip, setShowPlanTrip] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCity, setNewGroupCity] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Commuters');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  if (!mounted || !isLoggedIn) return null;

  const handleJoinGroup = (id: string) => {
    setGroups(prev => prev.map(g =>
      g.id === id
        ? { ...g, joined: !g.joined, members: g.joined ? g.members - 1 : g.members + 1 }
        : g
    ));
    const group = groups.find(g => g.id === id);
    if (group) showToast(group.joined ? `Left ${group.name}` : `Joined ${group.name}!`);
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
        id: `g-${Date.now()}`,
        emoji: '🚗',
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || 'A new carpool group.',
        city: newGroupCity.trim(),
        country: 'Sri Lanka',
        members: 1,
        category: newGroupCategory,
        joined: true,
      };
      setGroups(prev => [newGroup, ...prev]);
      setShowCreateGroup(false);
      setNewGroupName(''); setNewGroupDesc(''); setNewGroupCity('');
      setCreating(false);
      showToast(`Group "${newGroup.name}" created!`);
    }, 700);
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'groups', label: 'Groups', icon: '👥' },
    { key: 'trips',  label: 'Planned Trips', icon: '🗺️' },
    { key: 'members', label: 'Members', icon: '⭐' },
  ];

  const joinedCount = groups.filter(g => g.joined).length;

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
              <button
                onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Group
              </button>
            )}
            {activeTab === 'trips' && (
              <button
                onClick={() => setShowPlanTrip(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
              >
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
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          {activeTab === 'groups' && (
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border border-slate-100">
                      {group.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm leading-tight">{group.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[group.category] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              {group.category}
                            </span>
                            <span className="text-xs text-slate-400">{group.city}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinGroup(group.id)}
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
                      <p className="text-xs text-slate-400 mt-2">
                        <span className="font-medium text-slate-600">{group.members.toLocaleString()}</span> members
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'trips' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-1">Community members planning trips — join to coordinate travel</p>
              {PLANNED_TRIPS.map(trip => {
                const isJoined = joinedTrips.has(trip.id);
                const spotsLeft = trip.totalSpots - trip.filledSpots - (isJoined ? 1 : 0);
                const isFull = spotsLeft <= 0;
                return (
                  <div key={trip.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{trip.groupEmoji}</span>
                          <span className="text-xs text-slate-400">{trip.groupName}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm">{trip.title}</h3>
                      </div>
                      <button
                        onClick={() => handleJoinTrip(trip.id)}
                        disabled={isFull && !isJoined}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isJoined
                            ? 'bg-violet-50 text-violet-700 border border-violet-200'
                            : isFull
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                        }`}
                      >
                        {isJoined ? 'Going ✓' : isFull ? 'Full' : 'Join'}
                      </button>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 mb-3 p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-xs font-semibold text-slate-700">{trip.from}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-400 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-700">{trip.to}</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{trip.description}</p>

                    {/* Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-400">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {formatDate(trip.date)} · {formatTime(trip.time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img src={trip.organizerAvatar} alt={trip.organizer} className="w-5 h-5 rounded-full" />
                        <span className="text-xs text-slate-500">{trip.organizer}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          spotsLeft <= 1 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isJoined ? 'You\'re in' : `${Math.max(0, spotsLeft)} spot${spotsLeft !== 1 ? 's' : ''} left`}
                        </span>
                      </div>
                    </div>

                    {/* Spots bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{trip.filledSpots + (isJoined ? 1 : 0)} going</span>
                        <span>{trip.totalSpots} total</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${((trip.filledSpots + (isJoined ? 1 : 0)) / trip.totalSpots) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'members' && (
            <MembersTab />
          )}

          {!subscriptionActive && <PaywallOverlay />}
        </div>
      </main>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateGroup(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Create a Group</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Group Name *</label>
                  <input
                    type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                    placeholder="e.g. Colombo South Commuters"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">City *</label>
                  <input
                    type="text" value={newGroupCity} onChange={e => setNewGroupCity(e.target.value)}
                    placeholder="e.g. Colombo"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Commuters', 'Leisure', 'Airport', 'Students'] as const).map(cat => (
                      <button key={cat} onClick={() => setNewGroupCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                          newGroupCategory === cat
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                  <textarea
                    value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)}
                    placeholder="What's this group about?"
                    rows={2}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                  />
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

      {/* Plan a Trip modal */}
      {showPlanTrip && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPlanTrip(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Plan a Group Trip</h2>
              <p className="text-xs text-slate-400 mb-4">Propose a trip to your group and let members join</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">From *</label>
                    <input type="text" placeholder="Departure city"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">To *</label>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Spots</label>
                    <input type="number" min={1} max={20} placeholder="e.g. 4"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Post to Group</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                    {INITIAL_GROUPS.filter(g => g.joined || g.id === 'g2').map(g => (
                      <option key={g.id}>{g.emoji} {g.name}</option>
                    ))}
                  </select>
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

function MembersTab() {
  const { currentUser } = useApp();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient()
        .from('profiles')
        .select('id, name, avatar, verification_status, bio, total_rides, rating, city')
        .order('total_rides', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          setMembers(data ?? []);
          setLoading(false);
        });
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
              {m.id === currentUser?.id && (
                <span className="text-xs text-violet-600 font-medium">(you)</span>
              )}
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
