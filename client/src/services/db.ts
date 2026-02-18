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
    folderIds: string[]; // Replaces folderId. Empty array means "All Songs" only.
    title: string;
    artist: string;
    url: string;
    transpose: number;
    useFlats?: boolean;
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
    }
};
