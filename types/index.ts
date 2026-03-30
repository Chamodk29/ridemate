export type VerificationStatus = 'verified' | 'pending' | 'not_verified';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  password: string;
  verificationStatus: VerificationStatus;
  subscriptionActive: boolean;
  memberSince: string;
  bio: string;
  totalRides: number;
  rating: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userVerification: VerificationStatus;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userVerification: VerificationStatus;
  type: 'offering' | 'looking';
  from: string;
  to: string;
  date: string;
  time: string;
  seats?: number;
  description: string;
  timestamp: string;
  comments: Comment[];
}
