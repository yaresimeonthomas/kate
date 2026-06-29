export interface User {
  email: string;
  businessName: string;
  tier: 'starter' | 'growth' | 'pro';
  isAdmin: boolean;
  createdAt: number;
}

export interface BusinessContext {
  businessName: string;
  services: string;
  hours: string;
  location: string;
  brandVoice: string;
  platforms: string;
  phone: string;
  differentiator: string;
  commonQuestions: string;
}

export interface Agent {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  status: 'online' | 'offline';
  systemPrompt?: string;
  vertexAgentId?: string;
  tier: 'starter' | 'growth' | 'pro';
}

export interface Message {
  id?: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: number;
}

export interface Appointment {
  id?: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  submittedAt: number;
  status: 'New' | 'Contacted';
  source?: string;
  duration?: string;
  transcript?: string;
}

export interface Post {
  id?: string;
  content: string;
  status: 'Draft' | 'Approved' | 'Published';
  scheduledFor?: number;
  publishedAt?: number;
}
