import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Music, Heart } from 'lucide-react';
import { api, type TabData } from '../services/api';
import { TabViewer } from '../components/TabViewer';
import { useTranspose } from '../hooks/useTranspose';
import { useAuth } from '../contexts/AuthContext';
import { SaveModal } from '../components/SaveModal';

export default function Song() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { title?: string; artist?: string } | null;
    const url = searchParams.get('url');
    const { user, signInWithGoogle } = useAuth(); // Get user to show save button

    const [data, setData] = useState<TabData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savedSongId, setSavedSongId] = useState<string | null>(null);

    // Transpose hook
    // We need to initialize it with content when data loads
    const { semitones, setSemitones, transposedContent } = useTranspose(data?.content || '');

    useEffect(() => {
        if (!url) return;
        setLoading(true);
        api.getTab(url)
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [url]);

    useEffect(() => {
        if (user && url) {
            checkSavedStatus();
        } else {
            setIsSaved(false);
            setSavedSongId(null);
        }
    }, [user, url]);

    const checkSavedStatus = async () => {
        if (!user || !url) return;
        try {
            const { dbService } = await import('../services/db');
            const id = await dbService.getSavedSongId(user.uid, url);
            setSavedSongId(id);
            setIsSaved(!!id);
        } catch (e) {
            console.error("Failed to check saved status", e);
        }
    };

    const handleHeartClick = async () => {
        if (!user) {
            signInWithGoogle();
            return;
        }

        if (isSaved && savedSongId) {
            // Unsave
            if (confirm("Remove this song from your library?")) {
                try {
                    const { dbService } = await import('../services/db');
                    await dbService.deleteSong(savedSongId);
                    setIsSaved(false);
                    setSavedSongId(null);
                } catch (e) {
                    console.error("Failed to remove song", e);
                }
            }
        } else {
            // Save
            if (!data) return;
            setIsSaveModalOpen(true);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

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
            <div className="sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-xl border-b border-neutral-800 px-4 py-3 shadow-2xl">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="text-center">
                        <h1 className="font-bold text-white truncate max-w-[200px] md:max-w-md">{data.song_name || state?.title}</h1>
                        <p className="text-xs text-gray-400">{data.artist_name || state?.artist}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleHeartClick}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-purple-400"
                            title={isSaved ? "Saved" : (user ? "Save to Library" : "Sign in to Save")}
                        >
                            <Heart className={`w-6 h-6 ${isSaved ? 'fill-purple-500 text-purple-500' : (user ? '' : 'opacity-50')}`} />
                        </button>

                        <div className="flex items-center gap-2 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                            <button
                                onClick={() => setSemitones(s => s - 1)}
                                className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className={`text-sm font-mono font-bold w-8 text-center ${semitones !== 0 ? 'text-purple-400' : 'text-gray-500'}`}>
                                {semitones > 0 ? `+${semitones}` : semitones}
                            </span>
                            <button
                                onClick={() => setSemitones(s => s + 1)}
                                className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
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
                        transpose: semitones
                    }}
                    onSave={(id) => {
                        setIsSaved(true);
                        setSavedSongId(id);
                    }}
                />
            )}
        </div>
    );
}
