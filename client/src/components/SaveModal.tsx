import { useState, useEffect } from 'react';
import { X, FolderPlus, Check } from 'lucide-react';
import { dbService, type Folder } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

interface SaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    songData: {
        title: string;
        artist: string;
        url: string;
        transpose: number;
        useFlats?: boolean;
    };
    onSave?: (id: string) => void;
}

export function SaveModal({ isOpen, onClose, songData, onSave }: SaveModalProps) {
    const { user } = useAuth();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            loadFolders();
        }
    }, [isOpen, user]);

    const loadFolders = async () => {
        if (!user) return;
        try {
            const data = await dbService.getUserFolders(user.uid);
            setFolders(data);
        } catch (error) {
            console.error("Failed to load folders", error);
        }
    };

    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;
        try {
            const newFolder = await dbService.createFolder(user.uid, newFolderName);
            setFolders([newFolder as Folder, ...folders]);
            // Auto-select the new folder
            setSelectedFolderIds(prev => [...prev, newFolder.id]);
            setNewFolderName('');
            setIsCreatingFolder(false);
        } catch (error) {
            console.error("Failed to create folder", error);
        }
    };

    const toggleFolder = (folderId: string) => {
        setSelectedFolderIds(prev =>
            prev.includes(folderId)
                ? prev.filter(id => id !== folderId)
                : [...prev, folderId]
        );
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const id = await dbService.saveSong(user.uid, {
                title: songData.title,
                artist: songData.artist,
                url: songData.url,
                transpose: songData.transpose,
                useFlats: songData.useFlats,
                folderIds: selectedFolderIds
            });
            onClose();
            onSave?.(id);
        } catch (error) {
            console.error("Failed to save song", error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Save to Library</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-400">
                        Saving <span className="text-white font-medium">{songData.title}</span> with
                        transpose <span className="text-purple-400 font-mono">{songData.transpose > 0 ? `+${songData.transpose}` : songData.transpose}</span>
                    </p>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Select Folders</span>
                            <button
                                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                                <FolderPlus size={14} />
                                {isCreatingFolder ? "Cancel" : "New Folder"}
                            </button>
                        </div>

                        {isCreatingFolder && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Folder Name"
                                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                    autoFocus
                                />
                                <button
                                    onClick={handleCreateFolder}
                                    disabled={!newFolderName.trim()}
                                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        )}

                        <div className="max-h-48 overflow-y-auto space-y-1">
                            {folders.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">No folders created yet.</p>
                            )}

                            {folders.map(folder => {
                                const isSelected = selectedFolderIds.includes(folder.id);
                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => toggleFolder(folder.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between
                                            ${isSelected
                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                                                : 'hover:bg-neutral-800 text-gray-300 border border-transparent'
                                            }`}
                                    >
                                        <span>{folder.name}</span>
                                        {isSelected && <Check size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-neutral-800 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
