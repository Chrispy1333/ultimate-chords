import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Music, Heart, Menu, X, Library, LogOut } from 'lucide-react';
import { api, type TabData } from '../services/api';
import type { SavedSong } from '../services/db';
import { TabViewer } from '../components/TabViewer';
import { useTranspose } from '../hooks/useTranspose';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { SaveModal } from '../components/SaveModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function Song() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { title?: string; artist?: string } | null;
    const [url, setUrl] = useState(searchParams.get('url'));
    const { user, signInWithGoogle, logout } = useAuth(); // Get user to show save button
    const { activeSessionId, isLeader } = useSession();

    const [data, setData] = useState<TabData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savedSongId, setSavedSongId] = useState<string | null>(null);
    const [savedSongData, setSavedSongData] = useState<SavedSong | null>(null);
    const [useFlats, setUseFlats] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Track original saved settings to detect changes
    const [savedSettings, setSavedSettings] = useState<{ transpose: number; useFlats: boolean } | null>(null);

    // Transpose hook
    // We need to initialize it with content when data loads
    const { semitones, setSemitones, transposedContent } = useTranspose(data?.content || '', useFlats);

    const isModified = isSaved && savedSettings && (
        semitones !== savedSettings.transpose ||
        useFlats !== savedSettings.useFlats
    );

    useEffect(() => {
        const newUrl = searchParams.get('url');
        if (newUrl) setUrl(newUrl);
    }, [searchParams]);

    useEffect(() => {
        if (!url) return;

        const loadSong = async () => {
            setLoading(true);
            setError('');

            try {
                let songData: TabData | null = null;
                let foundSavedSong = null;

                // 1. Try to load from DB if user is logged in
                if (user) {
                    try {
                        const { dbService } = await import('../services/db');
                        const savedSong = await dbService.getSavedSong(user.uid, url);

                        if (savedSong) {
                            foundSavedSong = savedSong;

                            // If we have content, we can skip the scrape!
                            if (savedSong.content) {
                                console.log("Loaded song from Library!");
                                songData = {
                                    song_name: savedSong.title,
                                    artist_name: savedSong.artist,
                                    content: savedSong.content,
                                    url: savedSong.url,
                                    key: savedSong.key || '',
                                    capo: savedSong.capo || '',
                                    tuning: savedSong.tuning || ''
                                };
                            }
                        }
                    } catch (e) {
                        console.error("Failed to check library", e);
                    }
                }

                // 2. If not found in DB or valid content missing, fetch from API
                if (!songData) {
                    songData = await api.getTab(url);
                }

                setData(songData);

                // 3. Update saved state based on what we found in DB (if anything)
                if (foundSavedSong) {
                    setSavedSongId(foundSavedSong.id);
                    setSavedSongData(foundSavedSong);
                    setIsSaved(true);

                    // Apply saved settings
                    const transpose = typeof foundSavedSong.transpose === 'number' ? foundSavedSong.transpose : 0;
                    const flats = foundSavedSong.useFlats !== undefined ? foundSavedSong.useFlats : false;

                    setSemitones(transpose);
                    setUseFlats(flats);
                    setSavedSettings({ transpose, useFlats: flats });
                } else {
                    setSavedSongId(null);
                    setSavedSongData(null);
                    setIsSaved(false);
                    setUseFlats(false);
                    setSavedSettings(null);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load song');
            } finally {
                setLoading(false);
            }
        };

        loadSong();
    }, [url, user]); // Reload if url changes or user logs in

    // Broadcast to Session when song data or settings change
    useEffect(() => {
        if (!activeSessionId || !isLeader || !data) return;

        const broadcast = async () => {
            try {
                const { sessionService } = await import('../services/session');
                // Construct the song data to send
                // Use saved data if available, otherwise current data
                const songToSend = {
                    id: savedSongId || 'temp-' + Date.now(),
                    userId: user?.uid || 'temp',
                    folderIds: [],
                    title: data.song_name || state?.title || '',
                    artist: data.artist_name || state?.artist || '',
                    url: url || '',
                    content: data.content,
                    transpose: semitones,
                    useFlats: useFlats,
                    key: data.key,
                    capo: data.capo,
                    tuning: typeof data.tuning === 'string' ? data.tuning : (data.tuning?.name || data.tuning?.value),
                    createdAt: new Date()
                };

                // We use 'as any' because session expects SavedSong, but we might be constructing it on the fly
                // SavedSong interface has required fields like folderIds which we mocked above
                await sessionService.updateSessionSong(activeSessionId, songToSend as any);
                console.log("Broadcasted song to session:", songToSend.title);
            } catch (error) {
                console.error("Failed to broadcast song", error);
            }
        };

        // Debounce slightly to avoid rapid updates
        const timeout = setTimeout(broadcast, 500);
        return () => clearTimeout(timeout);
    }, [activeSessionId, isLeader, data, semitones, useFlats, savedSongId, url, state]);

    // Auto-update saved song with content if missing (Migration/Backfill)
    useEffect(() => {
        const backfillContent = async () => {
            if (isSaved && savedSongId && savedSongData && !savedSongData.content && data?.content) {
                console.log("Backfilling missing content for saved song...");
                try {
                    const { dbService } = await import('../services/db');
                    await dbService.updateSong(savedSongId, { content: data.content });
                    // Update local state so we don't loop
                    setSavedSongData({ ...savedSongData, content: data.content });
                    console.log("Content backfilled successfully.");
                } catch (e) {
                    console.error("Failed to backfill content", e);
                }
            }
        };
        backfillContent();
    }, [isSaved, savedSongId, savedSongData, data]);

    const handleHeartClick = async () => {
        if (!user) {
            signInWithGoogle();
            return;
        }

        if (isSaved && savedSongId) {
            if (isModified) {
                // Update existing song settings
                try {
                    const { dbService } = await import('../services/db');
                    await dbService.updateSongSettings(savedSongId, {
                        transpose: semitones,
                        useFlats: useFlats
                    });
                    setSavedSettings({ transpose: semitones, useFlats });
                    // Optional: Validation feedback could go here
                } catch (e) {
                    console.error("Failed to update song settings", e);
                }
            } else {
                // Unsave
                if (confirm("Remove this song from your library?")) {
                    try {
                        const { dbService } = await import('../services/db');
                        await dbService.deleteSong(savedSongId);
                        setIsSaved(false);
                        setSavedSongId(null);
                        setSavedSettings(null);
                    } catch (e) {
                        console.error("Failed to remove song", e);
                    }
                }
            }
        } else {
            // Save
            if (!data) return;
            setIsSaveModalOpen(true);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to sign out", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // Check if we are broadcasting
    const isBroadcasting = activeSessionId && isLeader;

    if (error || !data) {
        return (
            <div className="p-10 text-center">
                <p className="text-red-400 mb-4">Error: {error || 'Song not found'}</p>
                <button onClick={() => navigate('/')} className="text-purple-400 hover:underline">Go Home</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-[#050505] border-b border-neutral-800 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] shadow-2xl">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">

                    {/* Left: Logo & Back */}
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                                <span className="font-bold text-white text-lg">U</span>
                            </div>
                            <span className="font-bold text-lg text-white hidden xl:block">Ultimate Chords</span>
                        </Link>

                        <div className="h-6 w-px bg-white/10 hidden md:block"></div>

                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors order-first md:order-last"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Center: Title */}
                    <div className="text-center flex-1 min-w-0 px-2 flex flex-col items-center">
                        {isBroadcasting && (
                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-green-400 mb-0.5 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                Live Session Active
                            </div>
                        )}
                        <h1 className="font-bold text-white truncate text-sm md:text-base">{data.song_name || state?.title}</h1>
                        <p className="text-xs text-gray-400 truncate">{data.artist_name || state?.artist}</p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Desktop Library Link */}
                        {user && (
                            <Link to="/library" className="hidden lg:flex items-center gap-2 text-gray-400 hover:text-white px-2 py-1 transition-colors text-sm font-medium">
                                <Library size={16} />
                                <span>Library</span>
                            </Link>
                        )}

                        {user && (
                            <button
                                onClick={handleHeartClick}
                                className={`p-2 hover:bg-white/10 rounded-full transition-colors ${isSaved && !isModified ? 'text-purple-500' : 'text-gray-400 hover:text-purple-400'
                                    }`}
                                title={
                                    isSaved
                                        ? (isModified ? "Update Saved Settings" : "Saved")
                                        : "Save to Library"
                                }
                            >
                                <Heart
                                    className={`w-6 h-6 ${isSaved && !isModified ? 'fill-purple-500' : ''}`}
                                />
                            </button>
                        )}

                        {/* Use Flats Toggle */}
                        <button
                            onClick={() => setUseFlats(!useFlats)}
                            className={`h-9 w-9 flex items-center justify-center rounded-lg border text-sm font-bold font-mono transition-colors ${useFlats
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:text-white'
                                }`}
                            title="Use Flats"
                        >
                            b
                        </button>

                        <div className="flex items-center gap-1 md:gap-2 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                            <button
                                onClick={() => setSemitones(s => s - 1)}
                                className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className={`text-sm font-mono font-bold w-6 md:w-8 text-center ${semitones !== 0 ? 'text-purple-400' : 'text-gray-500'}`}>
                                {semitones > 0 ? `+${semitones}` : semitones}
                            </span>
                            <button
                                onClick={() => setSemitones(s => s + 1)}
                                className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mobile Menu Button - Show on small screens OR if user is signed in (for logout) */}
                        <button
                            className="lg:hidden text-white p-2 rounded-full hover:bg-white/10 ml-1"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="absolute top-full right-4 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden lg:hidden"
                        >
                            <div className="flex flex-col py-2">
                                {user ? (
                                    <>
                                        <Link
                                            to="/library"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="px-4 py-3 text-sm text-gray-300 hover:bg-neutral-800 hover:text-white flex items-center gap-3"
                                        >
                                            <Library size={16} className="text-purple-400" />
                                            My Library
                                        </Link>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="px-4 py-3 text-sm text-gray-400 hover:bg-neutral-800 hover:text-white flex items-center gap-3 text-left w-full"
                                        >
                                            <LogOut size={16} />
                                            Log Out
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="px-4 py-3 text-sm text-white hover:bg-neutral-800"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-8 flex flex-wrap gap-4 text-sm text-gray-500 font-mono">
                    {data.key && (
                        <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
                            <Music className="w-3 h-3" />
                            <span>Key: <span className="text-white">{data.key}</span></span>
                        </div>
                    )}
                    {data.capo && (
                        <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
                            <span>Capo: <span className="text-white">{data.capo}</span></span>
                        </div>
                    )}
                    {data.tuning && (
                        <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
                            <span>Tuning: <span className="text-white">{data.tuning.name || data.tuning.value || data.tuning}</span></span>
                        </div>
                    )}
                </div>

                <div className="bg-neutral-900/30 p-4 md:p-8 rounded-2xl border border-neutral-800/50">
                    <TabViewer content={transposedContent} />
                </div>
            </div>

            {data && (
                <SaveModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    songData={{
                        title: data.song_name || state?.title || '',
                        artist: data.artist_name || state?.artist || '',
                        url: url || '',
                        content: data.content,
                        transpose: semitones,
                        useFlats: useFlats,
                        key: data.key,
                        capo: data.capo,
                        tuning: typeof data.tuning === 'string' ? data.tuning : (data.tuning?.name || data.tuning?.value)
                    }}
                    onSave={(id) => {
                        setIsSaved(true);
                        setSavedSongId(id);
                        setSavedSettings({ transpose: semitones, useFlats });
                    }}
                />
            )}
        </div>
    );
}
