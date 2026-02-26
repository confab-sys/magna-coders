// Re-export types from services for backward compatibility
export type { Post, Comment, CreatePostData, CreateCommentData } from '../services/posts';
export type { Job, CreateJobData } from '../services/jobs';
import type { Message, SendMessageData, Chat } from '../services/messages';
export type { Message, SendMessageData, Chat };

// Additional types for UI components
export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  profilePicture?: string;
  verified?: boolean;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  experienceLevel?: string;
  createdAt?: string;
}

// Feed post types (union of all post types)
export interface FeedPost {
  id: string;
  type: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  title?: string;
  content?: string;
  image?: string;
  company?: string;
  description?: string;
  location?: string;
  salary?: string;
  tags?: string[];
  jobType?: string;
  deadlineProgress?: number;
  timeLeft?: string;
  summary?: string;
  source?: string;
  url?: string;
  imageUrl?: string;
  membersNeeded?: number;
  requestsSent?: number;
  membersJoined?: number;
}

export type JobPost = FeedPost & {
  // Job specific fields from service that might not be in FeedPost or need override
  requirements?: string[];
  benefits?: string[];
  applicationUrl?: string;
  isActive?: boolean;
};
export type ProjectPost = FeedPost & {
  projectName?: string;
  projectDescription?: string;
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
};
export type TechNewsPost = FeedPost & {
  newsTitle?: string;
  newsUrl?: string;
  newsSource?: string;
};
export type RegularPost = FeedPost;

// Conversation type for messages
export type Conversation = Chat;
