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
    updateDoc
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
    folderId: string | null; // null means "Uncategorized" or root
    title: string;
    artist: string;
    url: string;
    transpose: number;
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

    async deleteFolder(folderId: string) {
        // Note: This does not delete songs inside yet. 
        // Ideally we would verify emptiness or batch delete songs.
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

    async updateSongFolder(songId: string, folderId: string | null) {
        const songRef = doc(db!, 'saved_songs', songId);
        await updateDoc(songRef, { folderId });
    },

    async getUserSongs(userId: string) {
        const songsRef = collection(db!, 'saved_songs');
        const q = query(songsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedSong));
    },

    async deleteSong(songId: string) {
        await deleteDoc(doc(db!, 'saved_songs', songId));
    },

    async getSavedSongId(userId: string, url: string) {
        const songsRef = collection(db!, 'saved_songs');
        const q = query(songsRef, where("userId", "==", userId), where("url", "==", url));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return snapshot.docs[0].id;
    }
};
