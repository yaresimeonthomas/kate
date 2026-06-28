import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { Appointment, SocialPost, CallLog, Message, ContactLead } from '../types.ts';
import { MOCK_CALL_LOGS } from '../constants.ts';

// Initialize Firebase with the provided configuration
const firebaseConfig = {
    apiKey: "AIzaSyBSDKoQS8admwPicpANR-4_0y4Lf7phDbs",
    authDomain: "kate-aos-pwa.firebaseapp.com",
    projectId: "kate-aos-pwa",
    storageBucket: "kate-aos-pwa.firebasestorage.app",
    messagingSenderId: "689735221755",
    appId: "1:689735221755:web:c6c692956334b6c64d0b5e"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

// Helper to check for permission errors
const handleDbError = (e: any, context: string) => {
    console.error(`Error in ${context}:`, e);
    if (e.code === 'permission-denied') {
        console.error("🚨 FIREBASE PERMISSION DENIED: You need to update your Firestore Security Rules to 'allow read, write: if true;'");
        if (!window.sessionStorage.getItem('firebase_alert_shown')) {
            alert("Firebase blocked the database save! Please go to the Firebase Console -> Firestore -> Rules, and change 'allow read, write: if false;' to 'true'.");
            window.sessionStorage.setItem('firebase_alert_shown', 'true');
        }
    }
};

// --- Agent Memory (Messages) Collection ---
export const getMessages = async (agentId: string): Promise<Message[]> => {
    try {
        const q = query(collection(firestore, 'messages'), where('agentId', '==', agentId));
        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (e) {
        handleDbError(e, 'getMessages');
        return [];
    }
};

export const saveMessage = async (agentId: string, message: Message): Promise<void> => {
    try {
        await addDoc(collection(firestore, 'messages'), { ...message, agentId });
        window.dispatchEvent(new CustomEvent('chat-updated', { detail: agentId }));
    } catch (e) {
        handleDbError(e, 'saveMessage');
    }
};

export const clearMessages = async (agentId: string): Promise<void> => {
    try {
        const q = query(collection(firestore, 'messages'), where('agentId', '==', agentId));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(firestore, 'messages', document.id)));
        await Promise.all(deletePromises);
        window.dispatchEvent(new CustomEvent('chat-updated', { detail: agentId }));
    } catch (e) {
        handleDbError(e, 'clearMessages');
    }
};

// --- Appointments Collection ---
export const getAppointments = async (): Promise<Appointment[]> => {
    try {
        const querySnapshot = await getDocs(collection(firestore, 'appointments'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (e) {
        handleDbError(e, 'getAppointments');
        return [];
    }
};

export const addAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<Appointment | null> => {
    try {
        const docRef = await addDoc(collection(firestore, 'appointments'), appointment);
        return { id: docRef.id, ...appointment };
    } catch (e) {
        handleDbError(e, 'addAppointment');
        return null;
    }
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<void> => {
    try {
        const docRef = doc(firestore, 'appointments', id);
        await updateDoc(docRef, updates);
    } catch (e) {
        handleDbError(e, 'updateAppointment');
    }
};

export const deleteAppointment = async (id: string): Promise<void> => {
    try {
        const docRef = doc(firestore, 'appointments', id);
        await deleteDoc(docRef);
    } catch (e) {
        handleDbError(e, 'deleteAppointment');
    }
};

// --- Leads/Contacts Collection ---
export const getLeads = async (): Promise<ContactLead[]> => {
    try {
        const q = query(collection(firestore, 'leads'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactLead));
    } catch (e) {
        handleDbError(e, 'getLeads');
        return [];
    }
};

export const addLead = async (lead: Omit<ContactLead, 'id' | 'createdAt'>): Promise<ContactLead | null> => {
    try {
        const newLead = { ...lead, createdAt: Date.now() };
        const docRef = await addDoc(collection(firestore, 'leads'), newLead);
        return { id: docRef.id, ...newLead };
    } catch (e) {
        handleDbError(e, 'addLead');
        return null;
    }
};

export const deleteLead = async (id: string): Promise<void> => {
    try {
        const docRef = doc(firestore, 'leads', id);
        await deleteDoc(docRef);
    } catch (e) {
        handleDbError(e, 'deleteLead');
    }
};

// --- Posts Collection ---
export const getPosts = async (): Promise<SocialPost[]> => {
    try {
        const q = query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialPost));
    } catch (e) {
        handleDbError(e, 'getPosts');
        return [];
    }
};

export const addPost = async (post: Omit<SocialPost, 'id' | 'createdAt'>): Promise<SocialPost | null> => {
    try {
        const newPost = { ...post, createdAt: Date.now() };
        const docRef = await addDoc(collection(firestore, 'posts'), newPost);
        return { id: docRef.id, ...newPost };
    } catch (e) {
        handleDbError(e, 'addPost');
        return null;
    }
};

export const updatePostStatus = async (id: string, status: SocialPost['status']): Promise<void> => {
    try {
        const docRef = doc(firestore, 'posts', id);
        await updateDoc(docRef, { status });
    } catch (e) {
        handleDbError(e, 'updatePostStatus');
    }
};

// --- Mock Vapi Integration ---
export const getVapiCallLogs = async (): Promise<CallLog[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_CALL_LOGS), 500));
};

// --- Real Zernio API Integration ---
export const publishToZernio = async (post: SocialPost): Promise<boolean> => {
    const zernioApiKey = "sk_655be8652954d06a4dbb6516eb2465a86ac1150108e7c7eb8abc92c887214046";
    console.log(`[Zernio API] Starting publish process for post ${post.id}...`);
    
    try {
        const accountsRes = await fetch('https://zernio.com/api/v1/accounts', {
            headers: { 'Authorization': `Bearer ${zernioApiKey}` }
        });

        if (!accountsRes.ok) {
            console.error("[Zernio API] Failed to fetch accounts");
            return false;
        }

        const accountsData = await accountsRes.json();
        const accounts = accountsData.accounts || [];

        if (accounts.length === 0) {
            alert("No social accounts connected! Please log in to zernio.com and connect a Twitter or LinkedIn account first.");
            return false;
        }

        const targetAccount = accounts[0];
        
        const response = await fetch('https://zernio.com/api/v1/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${zernioApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: post.text,
                publishNow: true,
                platforms: [{ platform: targetAccount.platform, accountId: targetAccount._id }]
            })
        });

        if (!response.ok) return false;
        return true;
    } catch (error) {
        console.error("[Zernio API] Network error:", error);
        return false;
    }
};
