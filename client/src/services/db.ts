import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    type Unsubscribe
} from 'firebase/firestore';

export interface Folder {
    id: string;
    userId: string;
    name: string;
    createdAt: any;
}

export interface SavedSong {
    id: string;
    userId: string;
    folderIds: string[]; // Replaces folderId. Empty array means "All Songs" only.
    title: string;
    artist: string;
    url: string;
    transpose: number;
    useFlats?: boolean;
    key?: string;
    capo?: string | number;
    tuning?: string;
    content?: string; // Optional for backward compatibility, but desireable for offline/session use
    createdAt: any;
}

export const dbService = {
    // Folders
    async createFolder(userId: string, name: string) {
        const foldersRef = collection(db!, 'folders');
        const docRef = await addDoc(foldersRef, {
            userId,
            name,
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, userId, name };
    },

    async getUserFolders(userId: string) {
        const foldersRef = collection(db!, 'folders');
        const q = query(foldersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
    },

    subscribeToUserFolders(userId: string, callback: (folders: Folder[]) => void): Unsubscribe {
        const foldersRef = collection(db!, 'folders');
        const q = query(foldersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snapshot) => {
            const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
            callback(folders);
        });
    },

    async deleteFolder(folderId: string) {
        // Just delete the folder. Songs remain but won't have this folder in their list anymore (if we processed it).
        // For MVP, we just delete the folder doc.
        // Frontend will filter out IDs that don't match existing folders.
        await deleteDoc(doc(db!, 'folders', folderId));
    },

    // Songs
    async saveSong(userId: string, songData: Omit<SavedSong, 'id' | 'userId' | 'createdAt'>) {
        const songsRef = collection(db!, 'saved_songs');
        const docRef = await addDoc(songsRef, {
            userId,
            ...songData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateSongFolders(songId: string, folderIds: string[]) {
        const songRef = doc(db!, 'saved_songs', songId);
        await updateDoc(songRef, { folderIds });
    },

    async updateSongSettings(songId: string, settings: { transpose: number; useFlats: boolean }) {
        const songRef = doc(db!, 'saved_songs', songId);
        await updateDoc(songRef, settings);
    },

    async updateSong(songId: string, data: Partial<SavedSong>) {
        const songRef = doc(db!, 'saved_songs', songId);
        await updateDoc(songRef, data);
    },

    async getUserSongs(userId: string) {
        const songsRef = collection(db!, 'saved_songs');
        const q = query(songsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Migration / Compatibility
            let folderIds = data.folderIds || [];
            if (!data.folderIds && data.folderId) {
                folderIds = [data.folderId];
            }
            return { id: doc.id, ...data, folderIds } as SavedSong;
        });
    },

    subscribeToUserSongs(userId: string, callback: (songs: SavedSong[]) => void): Unsubscribe {
        const songsRef = collection(db!, 'saved_songs');
        const q = query(songsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snapshot) => {
            const songs = snapshot.docs.map(doc => {
                const data = doc.data();
                // Migration / Compatibility
                let folderIds = data.folderIds || [];
                if (!data.folderIds && data.folderId) {
                    folderIds = [data.folderId];
                }
                return { id: doc.id, ...data, folderIds } as SavedSong;
            });
            callback(songs);
        });
    },

    async deleteSong(songId: string) {
        await deleteDoc(doc(db!, 'saved_songs', songId));
    },

    async getSavedSongId(userId: string, url: string) {
        const song = await this.getSavedSong(userId, url);
        return song ? song.id : null;
    },

    async getSavedSong(userId: string, url: string): Promise<SavedSong | null> {
        const songsRef = collection(db!, 'saved_songs');
        const q = query(songsRef, where("userId", "==", userId), where("url", "==", url));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        const data = doc.data();
        // Migration / Compatibility logic if needed (similar to getUserSongs)
        let folderIds = data.folderIds || [];
        if (!data.folderIds && data.folderId) {
            folderIds = [data.folderId];
        }
        return { id: doc.id, ...data, folderIds } as SavedSong;
    },

    // User Settings
    async updateUserSettings(userId: string, settings: Partial<UserSettings>) {
        const userRef = doc(db!, 'users', userId);
        // We use setDoc with merge: true to ensure the document exists
        const { setDoc } = await import('firebase/firestore');
        await setDoc(userRef, { settings }, { merge: true });
    },

    subscribeToUserSettings(userId: string, callback: (settings: UserSettings | null) => void): Unsubscribe {
        const userRef = doc(db!, 'users', userId);
        return onSnapshot(userRef, (doc) => {
            if (doc.exists() && doc.data().settings) {
                callback(doc.data().settings as UserSettings);
            } else {
                callback(null);
            }
        });
    }
};

export interface QuickChatSection {
    id: string;
    title: string;
    messages: string[];
}

export interface UserSettings {
    quickChat?: {
        enabled: boolean;
        sections: QuickChatSection[];
    };
}
