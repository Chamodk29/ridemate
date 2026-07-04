'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Post, Comment, CityResult, Conversation, Message, Gender } from '@/types';

const supabase = createClient();

type AuthResult = { success: boolean; error?: string };

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  isLoggedIn: boolean;
  isLoadingPosts: boolean;
  isLoadingMorePosts: boolean;
  hasMorePosts: boolean;
  isLoadingConversations: boolean;
  currentUser: User | null;
  userMode: 'looking' | 'offering' | null;
  posts: Post[];
  users: User[];
  subscriptionActive: boolean;
  showOnboarding: boolean;
  selectedCity: CityResult | null;
  conversations: Conversation[];
  activeDMConversationId: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  setUserMode: (mode: 'looking' | 'offering') => void;
  setShowOnboarding: (show: boolean) => void;
  addPost: (post: Post) => Promise<void>;
  loadMorePosts: () => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  updateProfile: (fields: { name: string; bio: string; gender: Gender }) => Promise<void>;
  addComment: (postId: string, comment: Comment) => Promise<void>;
  toggleSubscription: () => void;
  setSelectedCity: (city: CityResult | null) => void;
  openDM: (post: Post) => Promise<void>;
  openDMById: (conversationId: string) => void;
  closeDM: () => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  unreadCount: number;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ── Mappers ───────────────────────────────────────────────────────────────────

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
    waypoints: p.waypoints ?? [],
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

function mapConversation(c: any, messages: any[]): Conversation {
  const participants = c.participants ?? [];
  return {
    id: c.id,
    participantIds: c.participant_ids,
    participantNames: participants.map((p: any) => p.name),
    participantAvatars: participants.map((p: any) => p.avatar),
    participantVerifications: participants.map((p: any) => p.verification_status),
    messages: messages.map((m: any) => ({
      id: m.id,
      senderId: m.sender_id,
      content: m.content,
      timestamp: m.created_at,
      read: m.read,
    })),
    postId: c.post_id,
    postSnapshot: c.post_snapshot,
    createdAt: c.created_at,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMode, setUserModeState] = useState<'looking' | 'offering' | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeDMConversationId, setActiveDMConversationId] = useState<string | null>(null);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [postsPage, setPostsPage] = useState(0);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Load helpers ────────────────────────────────────────────────────────────

  const loadProfile = async (userId: string, email: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setCurrentUser({
        id: data.id,
        name: data.name,
        email,
        avatar: data.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=b6e3f4`,
        gender: data.gender,
        verificationStatus: data.verification_status,
        subscriptionActive: data.subscription_active,
        memberSince: data.member_since ?? '',
        bio: data.bio ?? '',
        totalRides: data.total_rides ?? 0,
        rating: data.rating ?? 0,
      });
      setSubscriptionActive(data.subscription_active);
      setIsLoggedIn(true);
    }
  };

  const PAGE_SIZE = 10;

  const POST_QUERY = `
    *,
    profile:profiles!posts_user_id_fkey(name, avatar, verification_status, gender),
    comments(
      id, content, created_at, user_id,
      user:profiles!comments_user_id_fkey(id, name, avatar, verification_status)
    )
  `;

  const today = () => new Date().toISOString().split('T')[0];

  const loadPosts = async () => {
    setIsLoadingPosts(true);
    const { data } = await supabase
      .from('posts')
      .select(POST_QUERY)
      .gte('date', today())
      .order('date', { ascending: true })
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (data) {
      setPosts(data.map(mapPost));
      setHasMorePosts(data.length === PAGE_SIZE);
      setPostsPage(1);
    }
    setIsLoadingPosts(false);
  };

  const loadMorePosts = async () => {
    if (isLoadingMorePosts || !hasMorePosts) return;
    setIsLoadingMorePosts(true);
    const from = postsPage * PAGE_SIZE;
    const { data } = await supabase
      .from('posts')
      .select(POST_QUERY)
      .gte('date', today())
      .order('date', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (data) {
      setPosts(prev => [...prev, ...data.map(mapPost)]);
      setHasMorePosts(data.length === PAGE_SIZE);
      setPostsPage(prev => prev + 1);
    }
    setIsLoadingMorePosts(false);
  };

  const loadConversations = async (userId: string) => {
    setIsLoadingConversations(true);
    const { data } = await supabase
      .from('conversations')
      .select('*, messages(id, sender_id, content, read, created_at)')
      .contains('participant_ids', [userId])
      .order('created_at', { ascending: false });

    if (data) {
      setConversations(data.map(c => mapConversation(c, c.messages ?? [])));
    }
    setIsLoadingConversations(false);
  };

  // ── Auth state ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // Initial load — runs once on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await loadProfile(session.user.id, session.user.email ?? '');
        await loadPosts();
        await loadConversations(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Fresh sign-in (not token refresh or initial session restore)
        await loadProfile(session.user.id, session.user.email ?? '');
        await loadPosts();
        await loadConversations(session.user.id);
        setShowOnboarding(true);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setPosts([]);
        setConversations([]);
        setUserModeState(null);
        setShowOnboarding(false);
        setSelectedCity(null);
        setActiveDMConversationId(null);
      }
      // TOKEN_REFRESHED and INITIAL_SESSION are intentionally ignored —
      // they fire on every navigation and would cause constant re-fetching.
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Real-time: posts ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoggedIn) return;

    const channel = supabase
      .channel('realtime-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
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
          .eq('id', payload.new.id)
          .single();

        if (data) setPosts(prev => [mapPost(data), ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLoggedIn]);

  // ── Real-time: messages ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoggedIn) return;

    const channel = supabase
      .channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg: Message = {
          id: payload.new.id,
          senderId: payload.new.sender_id,
          content: payload.new.content,
          timestamp: payload.new.created_at,
          read: payload.new.read,
        };
        setConversations(prev =>
          prev.map(c =>
            c.id === payload.new.conversation_id
              ? { ...c, messages: [...c.messages, msg] }
              : c
          )
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLoggedIn]);

  // ── Real-time: comments ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoggedIn) return;

    const channel = supabase
      .channel('realtime-comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload) => {
        const { data } = await supabase
          .from('comments')
          .select('id, content, created_at, user_id, user:profiles!comments_user_id_fkey(id, name, avatar, verification_status)')
          .eq('id', payload.new.id)
          .single();

        if (!data) return;
        const comment: Comment = {
          id: data.id,
          userId: (data.user as any)?.id ?? data.user_id,
          userName: (data.user as any)?.name ?? 'Unknown',
          userAvatar: (data.user as any)?.avatar ?? '',
          userVerification: (data.user as any)?.verification_status ?? 'not_verified',
          content: data.content,
          timestamp: data.created_at,
        };
        setPosts(prev =>
          prev.map(p =>
            p.id === payload.new.post_id
              ? { ...p, comments: [...p.comments, comment] }
              : p
          )
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLoggedIn]);

  // ── Auth functions ──────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: 'Invalid email or password. Please try again.' };
    return { success: true };
  };

  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
        },
      },
    });
    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, error: 'An account with this email already exists.' };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // ── App functions ───────────────────────────────────────────────────────────

  const setUserMode = (mode: 'looking' | 'offering') => {
    setUserModeState(mode);
    setShowOnboarding(false);
  };

  const addPost = async (post: Post) => {
    if (!currentUser) return;
    await supabase.from('posts').insert({
      user_id: currentUser.id,
      type: post.type,
      from_location: post.from,
      to_location: post.to,
      city: post.city,
      country: post.country,
      date: post.date,
      time: post.time,
      seats: post.seats ?? null,
      gender_preference: post.genderPreference,
      waypoints: post.waypoints ?? [],
      cost_type: post.costType,
      cost_amount: post.costAmount ?? null,
      description: post.description,
    });
    showToast('Ride posted!');
  };

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    showToast('Post deleted');
  };

  const addComment = async (postId: string, comment: Comment) => {
    if (!currentUser) return;
    await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentUser.id,
      content: comment.content,
    });
    showToast('Comment posted');
  };

  const updateProfile = async (fields: { name: string; bio: string; gender: Gender }) => {
    if (!currentUser) return;
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fields.name)}&backgroundColor=b6e3f4`;
    const { error } = await supabase
      .from('profiles')
      .update({ name: fields.name, bio: fields.bio, gender: fields.gender, avatar: newAvatar })
      .eq('id', currentUser.id);
    if (error) { showToast('Failed to save profile', 'error'); return; }
    setCurrentUser(prev => prev ? { ...prev, ...fields, avatar: newAvatar } : prev);
    showToast('Profile saved!');
  };

  const toggleSubscription = () => setSubscriptionActive(prev => !prev);

  const openDM = async (post: Post) => {
    if (!currentUser) return;
    const otherId = post.userId;
    if (otherId === currentUser.id) return;

    // Check if conversation already exists
    const existing = conversations.find(c =>
      c.participantIds.includes(currentUser.id) &&
      c.participantIds.includes(otherId) &&
      c.postId === post.id
    );

    if (existing) {
      setActiveDMConversationId(existing.id);
      return;
    }

    // Fetch the other user's profile
    const { data: otherProfile } = await supabase
      .from('profiles')
      .select('id, name, avatar, verification_status')
      .eq('id', otherId)
      .single();

    if (!otherProfile) return;

    const participants = [
      { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, verification_status: currentUser.verificationStatus },
      { id: otherProfile.id, name: otherProfile.name, avatar: otherProfile.avatar, verification_status: otherProfile.verification_status },
    ];

    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        participant_ids: [currentUser.id, otherId],
        participants,
        post_id: post.id,
        post_snapshot: {
          type: post.type,
          from: post.from,
          to: post.to,
          city: post.city,
          country: post.country,
        },
      })
      .select()
      .single();

    if (newConv) {
      const conv = mapConversation({ ...newConv, participants }, []);
      setConversations(prev => [conv, ...prev]);
      setActiveDMConversationId(newConv.id);
      showToast('Conversation started');
    }
  };

  const openDMById = (conversationId: string) => setActiveDMConversationId(conversationId);

  const closeDM = () => setActiveDMConversationId(null);

  const sendMessage = async (conversationId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: content.trim(),
      read: false,
    });
    // Real-time subscription handles adding to state
  };

  const markAsRead = async (conversationId: string) => {
    if (!currentUser) return;
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUser.id);

    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? { ...c, messages: c.messages.map(m => m.senderId !== currentUser.id ? { ...m, read: true } : m) }
          : c
      )
    );
  };

  const unreadCount = conversations.reduce((count, conv) => {
    if (!currentUser) return count;
    return count + conv.messages.filter(m => m.senderId !== currentUser.id && !m.read).length;
  }, 0);

  return (
    <AppContext.Provider value={{
      isLoggedIn, isLoadingPosts, isLoadingMorePosts, hasMorePosts, isLoadingConversations,
      currentUser, userMode, posts, users: [],
      subscriptionActive, showOnboarding, selectedCity,
      conversations, activeDMConversationId, unreadCount,
      login, signup, logout, setUserMode, setShowOnboarding,
      addPost, loadMorePosts, deletePost, addComment, toggleSubscription, setSelectedCity,
      updateProfile,
      openDM, openDMById, closeDM, sendMessage, markAsRead,
      toasts, showToast, dismissToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
