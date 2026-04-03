export type VerificationStatus = 'verified' | 'pending' | 'not_verified';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type GenderPreference = 'any' | 'male' | 'female';

export interface CityResult {
  name: string;
  country: string;
  countryCode: string;
  displayName: string;
  lat: string;
  lon: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  password: string;
  gender?: Gender;
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
  userGender?: Gender;
  type: 'offering' | 'looking';
  from: string;
  to: string;
  city: string;
  country: string;
  date: string;
  time: string;
  seats?: number;
  genderPreference: GenderPreference;
  description: string;
  timestamp: string;
  comments: Comment[];
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: [string, string];
  participantNames: [string, string];
  participantAvatars: [string, string];
  participantVerifications: [VerificationStatus, VerificationStatus];
  messages: Message[];
  postId?: string;
  postSnapshot?: {
    type: 'offering' | 'looking';
    from: string;
    to: string;
    city: string;
    country: string;
  };
  createdAt: string;
}
