import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type SavedSong, type Folder } from '../services/db';
import { Link } from 'react-router-dom';
import { FolderPlus, Trash2, Search, MoreVertical, FolderInput, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Library() {
    const { user } = useAuth();
    const [songs, setSongs] = useState<SavedSong[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null = All Songs
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Folder creation
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Context Menu
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, songId: string } | null>(null);
    const [showAddToFolderModal, setShowAddToFolderModal] = useState<string | null>(null); // songId

    useEffect(() => {
        if (user) {
            loadLibrary();
        }
    }, [user]);

    // Click outside to close context menu
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const loadLibrary = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [songsData, foldersData] = await Promise.all([
                dbService.getUserSongs(user.uid),
                dbService.getUserFolders(user.uid)
            ]);
            setSongs(songsData);
            setFolders(foldersData);
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

    const handleDeleteSong = async (songId: string) => {
        if (!confirm("Are you sure you want to remove this song from your library?")) return;
        try {
            await dbService.deleteSong(songId);
            setSongs(songs.filter(s => s.id !== songId));
        } catch (error) {
            console.error("Failed to delete song", error);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm("Delete this folder? Songs will remain in 'All Songs'.")) return;
        try {
            await dbService.deleteFolder(folderId);
            setFolders(folders.filter(f => f.id !== folderId));
            if (activeFolderId === folderId) setActiveFolderId(null);
        } catch (error) {
            console.error("Failed to delete folder", error);
        }
    };

    // Filter Logic
    const filteredSongs = songs.filter(song => {
        // Search Filter
        const matchesSearch = (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchesSearch) return false;

        // Folder Filter
        if (activeFolderId === null) {
            // "All Songs" - show everything
            return true;
        } else {
            // Specific Folder
            return song.folderIds && song.folderIds.includes(activeFolderId);
        }
    });

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar / Top bar on mobile */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Library</h1>
                        <p className="text-gray-400 text-sm">Organize your collection</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search songs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Folders</h2>
                            <button
                                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                <FolderPlus size={18} />
                            </button>
                        </div>

                        {isCreatingFolder && (
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Name..."
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                    autoFocus
                                />
                                <button onClick={handleCreateFolder} className="text-xs bg-purple-600 px-2 rounded text-white">Add</button>
                            </div>
                        )}

                        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                            <button
                                onClick={() => setActiveFolderId(null)}
                                className={`flex-shrink-0 w-full text-left px-4 py-2 rounded-xl text-sm transition-colors
                                    ${activeFolderId === null
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-neutral-900 text-gray-400 hover:bg-neutral-800'
                                    }`}
                            >
                                All Songs
                            </button>

                            {folders.map(folder => (
                                <div key={folder.id} className="group relative flex-shrink-0">
                                    <button
                                        onClick={() => setActiveFolderId(folder.id)}
                                        className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors pr-8 truncate
                                            ${activeFolderId === folder.id
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-neutral-900 text-gray-400 hover:bg-neutral-800'
                                            }`}
                                    >
                                        {folder.name}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Loading your library...</div>
                    ) : filteredSongs.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="inline-block p-4 rounded-full bg-neutral-900 mb-4">
                                <FolderPlus className="w-8 h-8 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No songs found</h3>
                            <p className="text-gray-400">
                                {searchTerm ? "No songs match your search." : "Start saving songs to build your collection!"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSongs.map(song => (
                                <div key={song.id} className="relative group bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-purple-500/50 transition-colors">
                                    <Link to={`/tab?url=${encodeURIComponent(song.url)}`} className="block">
                                        <h3 className="font-bold text-white truncate mb-1 pr-6">{song.title}</h3>
                                        <p className="text-sm text-gray-400 truncate mb-3">{song.artist}</p>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {song.folderIds && song.folderIds.map(fid => {
                                                const folder = folders.find(f => f.id === fid);
                                                if (!folder) return null;
                                                return (
                                                    <span key={fid} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-gray-400 border border-neutral-700">
                                                        {folder.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </Link>

                                    <div className="absolute top-4 right-4">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setContextMenu({ x: e.clientX, y: e.clientY, songId: song.id });
                                            }}
                                            className="text-gray-500 hover:text-white transition-colors"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-50 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden min-w-[160px]"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button
                            onClick={() => {
                                setShowAddToFolderModal(contextMenu.songId);
                                setContextMenu(null);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-neutral-800 flex items-center gap-2"
                        >
                            <FolderInput size={16} className="text-purple-400" />
                            Add to Folder
                        </button>
                        <button
                            onClick={() => {
                                handleDeleteSong(contextMenu.songId);
                                setContextMenu(null);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-neutral-800 flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Remove Song
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add to Folder Modal */}
            <AnimatePresence>
                {showAddToFolderModal && (
                    <AddToFolderModal
                        folders={folders}
                        songId={showAddToFolderModal}
                        existingFolderIds={songs.find(s => s.id === showAddToFolderModal)?.folderIds || []}
                        onClose={() => setShowAddToFolderModal(null)}
                        onUpdate={(newFolderIds) => {
                            setSongs(songs.map(s => s.id === showAddToFolderModal ? { ...s, folderIds: newFolderIds } : s));
                            setShowAddToFolderModal(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper Component for the Modal
function AddToFolderModal({ folders, songId, existingFolderIds, onClose, onUpdate }: {
    folders: Folder[],
    songId: string,
    existingFolderIds: string[],
    onClose: () => void,
    onUpdate: (ids: string[]) => void
}) {
    const [selectedIds, setSelectedIds] = useState<string[]>(existingFolderIds);
    const [saving, setSaving] = useState(false);

    const toggleFolder = (folderId: string) => {
        setSelectedIds(prev =>
            prev.includes(folderId)
                ? prev.filter(id => id !== folderId)
                : [...prev, folderId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await dbService.updateSongFolders(songId, selectedIds);
            onUpdate(selectedIds);
        } catch (error) {
            console.error("Failed to update folders", error);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">Add to Folders</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="p-4 max-h-60 overflow-y-auto space-y-1">
                    {folders.length === 0 && <p className="text-gray-500 text-center py-4">No folders created.</p>}
                    {folders.map(folder => {
                        const isSelected = selectedIds.includes(folder.id);
                        return (
                            <button
                                key={folder.id}
                                onClick={() => toggleFolder(folder.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition-colors
                                    ${isSelected ? 'bg-purple-500/20 text-purple-300' : 'hover:bg-neutral-800 text-gray-300'}`}
                            >
                                <span>{folder.name}</span>
                                {isSelected && <Check size={14} className="text-purple-400" />}
                            </button>
                        );
                    })}
                </div>
                <div className="p-4 border-t border-neutral-800 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 text-sm bg-white text-black rounded-lg font-medium hover:bg-gray-200"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
