'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Post, Comment } from '@/types';
import { MOCK_USERS, MOCK_POSTS } from '@/data/mockData';

interface AppContextType {
  isLoggedIn: boolean;
  currentUser: User | null;
  userMode: 'looking' | 'offering' | null;
  posts: Post[];
  users: User[];
  subscriptionActive: boolean;
  showOnboarding: boolean;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  setUserMode: (mode: 'looking' | 'offering') => void;
  setShowOnboarding: (show: boolean) => void;
  addPost: (post: Post) => void;
  addComment: (postId: string, comment: Comment) => void;
  toggleSubscription: () => void;
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
      name,
      email,
      password,
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
  };

  const setUserMode = (mode: 'looking' | 'offering') => {
    setUserModeState(mode);
    setShowOnboarding(false);
  };

  const addPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const addComment = (postId: string, comment: Comment) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, comments: [...p.comments, comment] }
          : p
      )
    );
  };

  const toggleSubscription = () => {
    setSubscriptionActive(prev => !prev);
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn,
      currentUser,
      userMode,
      posts,
      users,
      subscriptionActive,
      showOnboarding,
      login,
      signup,
      logout,
      setUserMode,
      setShowOnboarding,
      addPost,
      addComment,
      toggleSubscription,
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
