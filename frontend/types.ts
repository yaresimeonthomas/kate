export enum AgentId {
    BUSINESS = 'business',
    SOCIAL = 'social',
    WEB = 'web',
    FRONT_DESK = 'front_desk',
    APPOINTMENTS = 'appointments',
    LEADS = 'leads',
    MARKETING = 'marketing',
    SETTINGS = 'settings'
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export interface Appointment {
    id: string;
    clientName: string;
    dateTime: string;
    service: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface ContactLead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    createdAt: number;
}

export interface SocialPost {
    id: string;
    text: string;
    imageUrl: string;
    status: 'Draft' | 'Approved' | 'Published' | 'Rejected';
    createdAt: number;
}

export interface CallLog {
    id: string;
    callerName: string;
    phoneNumber: string;
    duration: string;
    timestamp: string;
    transcript: string;
    summary: string;
}

export interface AgentConfig {
    id: AgentId;
    name: string;
    subtitle: string;
    iconName: string;
    colorClass: string;
    defaultPrompt: string;
}
