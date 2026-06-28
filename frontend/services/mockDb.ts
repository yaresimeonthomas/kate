import { Appointment, SocialPost, CallLog } from '../types.ts';
import { INITIAL_APPOINTMENTS, MOCK_CALL_LOGS } from '../constants.ts';

// Mock Firestore
class MockFirestore {
    private appointments: Appointment[] = [...INITIAL_APPOINTMENTS];
    private posts: SocialPost[] = [];

    getAppointments(): Appointment[] {
        return [...this.appointments];
    }

    addAppointment(appointment: Omit<Appointment, 'id'>): Appointment {
        const newAppt = { ...appointment, id: Math.random().toString(36).substr(2, 9) };
        this.appointments.push(newAppt);
        return newAppt;
    }

    updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            this.appointments[index] = { ...this.appointments[index], ...updates };
            return this.appointments[index];
        }
        return null;
    }

    deleteAppointment(id: string): void {
        this.appointments = this.appointments.filter(a => a.id !== id);
    }

    getPosts(): SocialPost[] {
        return [...this.posts];
    }

    addPost(post: Omit<SocialPost, 'id' | 'createdAt'>): SocialPost {
        const newPost = { ...post, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
        this.posts.push(newPost);
        return newPost;
    }

    updatePostStatus(id: string, status: SocialPost['status']): void {
        const post = this.posts.find(p => p.id === id);
        if (post) {
            post.status = status;
        }
    }
}

export const db = new MockFirestore();

// Mock Vapi
export const getVapiCallLogs = (): CallLog[] => {
    return MOCK_CALL_LOGS;
};

// Mock Zernio API
export const publishToZernio = async (post: SocialPost): Promise<boolean> => {
    console.log(`[Zernio API Mock] Publishing post ${post.id}...`);
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`[Zernio API Mock] Post ${post.id} published successfully.`);
            resolve(true);
        }, 1000);
    });
};
