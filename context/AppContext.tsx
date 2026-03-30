'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Post, Comment } from '@/types';
import { MOCK_USERS, MOCK_POSTS } from '@/data/mockData';

interface AppContextType {
  isLoggedIn: boolean;
  currentUser: User | null;
  userMode: 'looking' | 'offering' | null;
  posts: Post[];
  subscriptionActive: boolean;
  showOnboarding: boolean;
  login: (email: string, password: string) => boolean;
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
  const [subscriptionActive, setSubscriptionActive] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const login = (email: string, password: string): boolean => {
    const user = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return false;
    setCurrentUser(user);
    setSubscriptionActive(user.subscriptionActive);
    setIsLoggedIn(true);
    setShowOnboarding(true);
    return true;
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
      subscriptionActive,
      showOnboarding,
      login,
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
