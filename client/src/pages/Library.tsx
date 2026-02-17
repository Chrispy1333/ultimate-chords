import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type Folder, type SavedSong } from '../services/db';
import { Folder as FolderIcon, Music, Trash2, Calendar, FolderOpen, MoreVertical, Plus, Check, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Library() {
    const { user } = useAuth();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [songs, setSongs] = useState<SavedSong[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const navigate = useNavigate();

    // Folder creation state
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Song action state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [moveSongId, setMoveSongId] = useState<string | null>(null); // Song being moved

    useEffect(() => {
        if (user) {
            loadLibrary();
        }
    }, [user]);

    const loadLibrary = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [fetchedFolders, fetchedSongs] = await Promise.all([
                dbService.getUserFolders(user.uid),
                dbService.getUserSongs(user.uid)
            ]);
            setFolders(fetchedFolders);
            setSongs(fetchedSongs);
        } catch (error) {
            console.error("Failed to load library", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;
        try {
            const newFolder = await dbService.createFolder(user.uid, newFolderName);
            setFolders([newFolder as Folder, ...folders]);
            setNewFolderName('');
            setIsCreatingFolder(false);
        } catch (error) {
            console.error("Failed to create folder", error);
        }
    };

    const handleMoveSong = async (songId: string, folderId: string | null) => {
        try {
            await dbService.updateSongFolder(songId, folderId);
            setSongs(songs.map(s => s.id === songId ? { ...s, folderId } : s));
            setMoveSongId(null);
        } catch (error) {
            console.error("Failed to move song", error);
        }
    };

    const handleDeleteSong = async (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        if (!confirm("Delete this song?")) return;
        try {
            await dbService.deleteSong(id);
            setSongs(songs.filter(s => s.id !== id));
        } catch (error) {
            console.error("Failed to delete song", error);
        }
    };

    const handleDeleteFolder = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (!confirm(`Delete folder "${name}"? Songs inside will be moved to Uncategorized.`)) return;

        // Note: Real app should maybe move songs to null folderId or delete them.
        // For now, we just delete the folder doc. The songs will still have the folderId but it won't match any folder.
        // Better approach: Update songs to have folderId: null
        // But for MVP, let's just delete the folder.

        try {
            await dbService.deleteFolder(id);
            setFolders(folders.filter(f => f.id !== id));
            if (activeFolderId === id) setActiveFolderId(null);
        } catch (error) {
            console.error("Failed to delete folder", error);
        }
    };

    // Filter songs based on active folder
    const filteredSongs = activeFolderId
        ? songs.filter(s => s.folderId === activeFolderId)
        : songs.filter(s => !s.folderId || !folders.find(f => f.id === s.folderId));
    // Show uncategorized OR songs belonging to deleted folders in "Uncategorized" view (null activeFolderId)

    if (loading) {
        return <div className="p-20 text-center text-gray-500">Loading library...</div>;
    }

    if (!user) {
        return <div className="p-20 text-center text-gray-500">Please sign in to view your library.</div>;
    }

    return (
        <div className="min-h-screen bg-[#050505]">
            {/* Navbar */}
            <div className="sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-xl border-b border-neutral-800 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 hover:opacity-80 transition-opacity">
                        Ultimate Chords
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <h1 className="text-3xl font-bold mb-8 text-white">
                    Your Library
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar / Folder List */}
                    <div className="lg:col-span-1 space-y-2">
                        <div className="flex items-center justify-between px-2 mb-4">
                            <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">Folders</h3>
                            <button
                                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                                className="text-gray-400 hover:text-white p-1 hover:bg-neutral-800 rounded transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {isCreatingFolder && (
                            <div className="flex gap-2 max-w-full px-2 mb-2">
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Name"
                                    className="flex-1 w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                />
                                <button
                                    onClick={handleCreateFolder}
                                    disabled={!newFolderName.trim()}
                                    className="text-purple-400 hover:text-purple-300 disabled:opacity-50"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={() => setIsCreatingFolder(false)}
                                    className="text-gray-500 hover:text-gray-400"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setActiveFolderId(null)}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
                            ${activeFolderId === null
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'hover:bg-neutral-900 text-gray-400 hover:text-white'
                                }`}
                        >
                            <FolderOpen size={18} />
                            <span className="font-medium">Uncategorized</span>
                            <span className="ml-auto text-xs opacity-50 bg-neutral-800 px-2 py-0.5 rounded-full">
                                {songs.filter(s => !s.folderId || !folders.find(f => f.id === s.folderId)).length}
                            </span>
                        </button>

                        {folders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => setActiveFolderId(folder.id)}
                                className={`w-full group text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
                                ${activeFolderId === folder.id
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'hover:bg-neutral-900 text-gray-400 hover:text-white'
                                    }`}
                            >
                                <FolderIcon size={18} />
                                <span className="font-medium truncate">{folder.name}</span>
                                <span className="ml-auto text-xs opacity-50 bg-neutral-800 px-2 py-0.5 rounded-full">
                                    {songs.filter(s => s.folderId === folder.id).length}
                                </span>
                                <div
                                    onClick={(e) => handleDeleteFolder(e, folder.id, folder.name)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                                    title="Delete Folder"
                                >
                                    <Trash2 size={14} />
                                </div>
                            </button>
                        ))}

                        {folders.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-gray-600 border border-dashed border-neutral-800 rounded-xl">
                                No folders yet.
                                <br />
                                Create one when saving a song!
                            </div>
                        )}
                    </div>

                    {/* Song List */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSongs.map(song => (
                                <Link
                                    key={song.id}
                                    to={`/song?url=${encodeURIComponent(song.url)}`}
                                    state={{ title: song.title, artist: song.artist }}
                                    className="group block bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 hover:bg-neutral-800 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-1 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-neutral-900 rounded-lg group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                                            <Music size={20} />
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === song.id ? null : song.id);
                                                }}
                                                className="text-gray-600 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {openMenuId === song.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-20 overflow-hidden">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setMoveSongId(song.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
                                                    >
                                                        <ArrowRight size={14} />
                                                        Move to Folder
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            handleDeleteSong(e, song.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-lg text-white mb-1 truncate">{song.title || 'Unknown Title'}</h3>
                                    <p className="text-gray-400 text-sm mb-4 truncate">{song.artist || 'Unknown Artist'}</p>

                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {song.transpose !== 0 && (
                                            <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-700 font-mono text-purple-400">
                                                {song.transpose > 0 ? `+${song.transpose}` : song.transpose}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1 ml-auto">
                                            <Calendar size={12} />
                                            <span>
                                                {song.createdAt?.seconds
                                                    ? new Date(song.createdAt.seconds * 1000).toLocaleDateString()
                                                    : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {filteredSongs.length === 0 && (
                                <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-neutral-800 rounded-2xl">
                                    <Music size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No songs found in this folder.</p>
                                    <Link to="/" className="text-purple-400 hover:underline mt-2 inline-block">
                                        Search for songs
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Move Song Modal */}
                {moveSongId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setMoveSongId(null)}>
                        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-neutral-800">
                                <h3 className="font-bold text-white">Move to Folder</h3>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-2">
                                <button
                                    onClick={() => handleMoveSong(moveSongId, null)}
                                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-neutral-800 text-gray-300 flex items-center gap-3"
                                >
                                    <FolderOpen size={18} />
                                    Uncategorized
                                </button>
                                {folders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleMoveSong(moveSongId, folder.id)}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-neutral-800 text-gray-300 flex items-center gap-3"
                                    >
                                        <FolderIcon size={18} />
                                        {folder.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
