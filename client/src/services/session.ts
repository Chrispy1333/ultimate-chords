import { db } from '../lib/firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    type DocumentSnapshot
} from 'firebase/firestore';
import { type SavedSong } from './db';

export interface BroadcastMessage {
    text: string;
    timestamp: any; // ServerTimestamp
    id: string;
}

export interface Session {
    id: string;
    leaderId: string;
    currentSong: SavedSong | null;
    participants: string[];
    isActive: boolean;
    createdAt: any;
    broadcastMessage?: BroadcastMessage | null;
}

export const sessionService = {
    async createSession(leaderId: string) {
        if (!db) throw new Error("Database not initialized");
        const sessionRef = await addDoc(collection(db, 'sessions'), {
            leaderId,
            currentSong: null,
            participants: [],
            isActive: true,
            createdAt: serverTimestamp()
        });
        return sessionRef.id;
    },

    async joinSession(sessionId: string, userId: string = 'guest') {
        if (!db) throw new Error("Database not initialized");
        const sessionRef = doc(db, 'sessions', sessionId);

        // Optionally verify session exists and is active first
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists() || !sessionSnap.data().isActive) {
            throw new Error("Session not found or inactive");
        }

        // Add participant (simple list of IDs/Names for now)
        // Using arrayUnion to avoid duplicates
        await updateDoc(sessionRef, {
            participants: arrayUnion(userId)
        });

        return sessionSnap.data() as Session;
    },

    async updateSessionSong(sessionId: string, song: SavedSong) {
        if (!db) throw new Error("Database not initialized");
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            currentSong: song,
            // Clear any previous broadcast when changing songs to avoid confusion
            broadcastMessage: null
        });
    },

    async broadcastMessage(sessionId: string, message: string) {
        if (!db) throw new Error("Database not initialized");
        const sessionRef = doc(db, 'sessions', sessionId);
        const broadcastData: BroadcastMessage = {
            text: message,
            timestamp: serverTimestamp(),
            id: Math.random().toString(36).substr(2, 9)
        };
        await updateDoc(sessionRef, {
            broadcastMessage: broadcastData
        });
    },

    async deleteSession(sessionId: string) {
        if (!db) throw new Error("Database not initialized");
        const sessionRef = doc(db, 'sessions', sessionId);
        await deleteDoc(sessionRef);
    },

    subscribeToSession(sessionId: string, callback: (session: Session | null) => void) {
        if (!db) return () => { };

        const sessionRef = doc(db, 'sessions', sessionId);
        return onSnapshot(sessionRef, (doc: DocumentSnapshot) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() } as Session);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error("Session subscription error:", error);
            callback(null);
        });
    }
};
