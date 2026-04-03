'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Post, Comment, CityResult, Conversation, Message } from '@/types';
import { MOCK_USERS, MOCK_POSTS } from '@/data/mockData';

interface AppContextType {
  isLoggedIn: boolean;
  currentUser: User | null;
  userMode: 'looking' | 'offering' | null;
  posts: Post[];
  users: User[];
  subscriptionActive: boolean;
  showOnboarding: boolean;
  selectedCity: CityResult | null;
  conversations: Conversation[];
  activeDMConversationId: string | null;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  setUserMode: (mode: 'looking' | 'offering') => void;
  setShowOnboarding: (show: boolean) => void;
  addPost: (post: Post) => void;
  addComment: (postId: string, comment: Comment) => void;
  toggleSubscription: () => void;
  setSelectedCity: (city: CityResult | null) => void;
  openDM: (post: Post) => void;
  closeDM: () => void;
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
  unreadCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMode, setUserModeState] = useState<'looking' | 'offering' | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [subscriptionActive, setSubscriptionActive] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeDMConversationId, setActiveDMConversationId] = useState<string | null>(null);

  const login = (email: string, password: string): boolean => {
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return false;
    setCurrentUser(user);
    setSubscriptionActive(user.subscriptionActive);
    setIsLoggedIn(true);
    setShowOnboarding(true);
    return true;
  };

  const signup = (name: string, email: string, password: string): { success: boolean; error?: string } => {
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { success: false, error: 'An account with this email already exists.' };

    const now = new Date();
    const memberSince = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const newUser: User = {
      id: `user-${Date.now()}`,
      name, email, password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
      verificationStatus: 'not_verified',
      subscriptionActive: false,
      memberSince,
      bio: 'New to Ridemate. Looking forward to connecting with the community!',
      totalRides: 0,
      rating: 0,
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setSubscriptionActive(false);
    setIsLoggedIn(true);
    setShowOnboarding(true);
    return { success: true };
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserModeState(null);
    setShowOnboarding(false);
    setSelectedCity(null);
    setActiveDMConversationId(null);
  };

  const setUserMode = (mode: 'looking' | 'offering') => {
    setUserModeState(mode);
    setShowOnboarding(false);
  };

  const addPost = (post: Post) => setPosts(prev => [post, ...prev]);

  const addComment = (postId: string, comment: Comment) => {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)
    );
  };

  const toggleSubscription = () => setSubscriptionActive(prev => !prev);

  // DM methods
  const openDM = (post: Post) => {
    if (!currentUser) return;
    const otherId = post.userId;
    const otherUser = users.find(u => u.id === otherId);
    if (!otherUser || otherId === currentUser.id) return;

    // Find or create conversation
    const existing = conversations.find(c =>
      c.participantIds.includes(currentUser.id) &&
      c.participantIds.includes(otherId) &&
      c.postId === post.id
    );

    if (existing) {
      setActiveDMConversationId(existing.id);
      return;
    }

    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      participantIds: [currentUser.id, otherId],
      participantNames: [currentUser.name, otherUser.name],
      participantAvatars: [currentUser.avatar, otherUser.avatar],
      participantVerifications: [currentUser.verificationStatus, otherUser.verificationStatus],
      messages: [],
      postId: post.id,
      postSnapshot: {
        type: post.type,
        from: post.from,
        to: post.to,
        city: post.city,
        country: post.country,
      },
      createdAt: new Date().toISOString(),
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveDMConversationId(newConv.id);
  };

  const closeDM = () => setActiveDMConversationId(null);

  const sendMessage = (conversationId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, messages: [...c.messages, msg] } : c)
    );
  };

  const markAsRead = (conversationId: string) => {
    if (!currentUser) return;
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map(m =>
                m.senderId !== currentUser.id ? { ...m, read: true } : m
              ),
            }
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
      isLoggedIn, currentUser, userMode, posts, users,
      subscriptionActive, showOnboarding, selectedCity,
      conversations, activeDMConversationId, unreadCount,
      login, signup, logout, setUserMode, setShowOnboarding,
      addPost, addComment, toggleSubscription, setSelectedCity,
      openDM, closeDM, sendMessage, markAsRead,
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
