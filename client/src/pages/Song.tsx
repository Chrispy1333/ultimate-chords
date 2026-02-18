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
    const [url, setUrl] = useState(searchParams.get('url'));
    const { user, signInWithGoogle } = useAuth(); // Get user to show save button

    const [data, setData] = useState<TabData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savedSongId, setSavedSongId] = useState<string | null>(null);
    const [useFlats, setUseFlats] = useState(false);

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
            setUseFlats(false);
            setSavedSettings(null);
        }
    }, [user, url]);

    const checkSavedStatus = async () => {
        if (!user || !url) return;
        try {
            const { dbService } = await import('../services/db');
            const song = await dbService.getSavedSong(user.uid, url);
            if (song) {
                setSavedSongId(song.id);
                setIsSaved(true);

                // Apply saved settings
                const transpose = typeof song.transpose === 'number' ? song.transpose : 0;
                const flats = song.useFlats !== undefined ? song.useFlats : false;

                setSemitones(transpose);
                setUseFlats(flats);
                setSavedSettings({ transpose, useFlats: flats });
            } else {
                setSavedSongId(null);
                setIsSaved(false);
                setUseFlats(false);
                setSavedSettings(null);
            }
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
                        transpose: semitones,
                        useFlats: useFlats
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
