import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService, type Session } from '../services/session';
import { TabViewer } from '../components/TabViewer';
import { QuickChatOverlay } from '../components/QuickChatOverlay';
import { BroadcastDisplay } from '../components/BroadcastDisplay';
import { useTranspose } from '../hooks/useTranspose';
import { Music, LogOut, MessageSquarePlus } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
export default function SessionView() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const { settings } = useSettings();



    // Derived state for transposition
    // We default to 0 and false, and update when session changes
    const currentSong = session?.currentSong;
    const isLeader = user && session?.leaderId === user.uid;
    const { setSemitones, transposedContent } = useTranspose(currentSong?.content || '', currentSong?.useFlats || false);

    const handleBroadcast = async (message: string) => {
        if (!sessionId) return;
        try {
            await sessionService.broadcastMessage(sessionId, message);
        } catch (err) {
            console.error("Failed to broadcast message", err);
        }
    };

    // Ensure we are authenticated (anonymously if needed)
    useEffect(() => {
        if (!authLoading && !user && auth) {
            signInAnonymously(auth).catch(err => {
                console.error("Failed to sign in anonymously", err);
                setError("Failed to authenticate. Please check your connection.");
                setLoading(false);
            });
        }
    }, [authLoading, user]);

    // Effect to join the session
    useEffect(() => {
        if (!sessionId || !user) return;

        // Join logic
        sessionService.joinSession(sessionId, 'guest-' + Math.random().toString(36).substr(2, 9))
            .catch(err => console.error("Failed to join session log", err));

        // Subscribe logic
        const unsubscribe = sessionService.subscribeToSession(sessionId, (data) => {
            if (data) {
                setSession(data);
                // Sync transposition settings
                if (data.currentSong) {
                    setSemitones(data.currentSong.transpose || 0);
                    // useFlats is passed directly to the hook, so it will update automatically
                }
            } else {
                setError("Session ended or not found");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sessionId, user]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                <p className="ml-4 text-lg">Connecting to session...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white p-4">
                <div className="text-center max-w-md">
                    <p className="text-red-400 mb-4 text-xl">{error}</p>
                    <p className="text-gray-500">The session may have ended or the link is invalid.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-sm border-b border-neutral-800 px-4 py-3 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Live Session</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {session?.currentSong && (
                            <div className="hidden md:flex items-center gap-4 text-sm font-mono text-gray-500">
                                <span>Key: <span className="text-purple-400">{session.currentSong.transpose > 0 ? `+${session.currentSong.transpose}` : session.currentSong.transpose}</span></span>
                            </div>
                        )}
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border border-red-500/30 hover:border-red-500/50"
                        >
                            <LogOut size={14} />
                            <span>Leave</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {session?.currentSong ? (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl md:text-3xl font-bold">{session.currentSong.title}</h1>
                            <p className="text-purple-400 text-lg">{session.currentSong.artist}</p>
                        </div>

                        <div className="bg-neutral-900/30 p-4 md:p-8 rounded-2xl border border-neutral-800/50 min-h-[500px]">
                            <TabViewer content={transposedContent} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                        <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center">
                            <Music className="w-8 h-8 text-gray-600 animate-bounce" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-300">Waiting for leader...</h2>
                        <p className="text-gray-500 max-w-xs mx-auto">The session leader is selecting a song. It will appear here automatically.</p>
                    </div>
                )}
            </div>

            {/* Quick Chat Overlay & Display */}
            <BroadcastDisplay message={session?.broadcastMessage} />

            {isLeader && (
                <>
                    <QuickChatOverlay
                        isOpen={isQuickChatOpen}
                        onClose={() => setIsQuickChatOpen(false)}
                        onBroadcast={handleBroadcast}
                    />

                    {/* Floating Action Button */}
                    {settings.quickChat?.enabled && (
                        <button
                            onClick={() => setIsQuickChatOpen(true)}
                            className="fixed bottom-6 right-6 z-40 bg-purple-600 text-white p-4 rounded-full shadow-lg shadow-purple-900/40 hover:bg-purple-500 transition-colors"
                            aria-label="Quick Chat"
                        >
                            <MessageSquarePlus size={24} />
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
