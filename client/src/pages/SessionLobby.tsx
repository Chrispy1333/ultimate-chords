import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { sessionService, type Session } from '../services/session';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Users, Copy, Check, ChevronLeft } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';

export default function SessionLobby() {
    const { user } = useAuth();
    const { startSession, endSession, activeSessionId } = useSession();
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState<string | null>(activeSessionId);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(!activeSessionId);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!activeSessionId) {
            createSession();
        } else {
            setSessionId(activeSessionId);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!sessionId) return;

        const unsubscribe = sessionService.subscribeToSession(sessionId, (data) => {
            setSession(data);
        });

        return () => unsubscribe();
    }, [sessionId]);

    const createSession = async () => {
        if (!user) return;
        try {
            const id = await sessionService.createSession(user.uid);
            setSessionId(id);
            startSession(id);
        } catch (error) {
            console.error("Failed to create session", error);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (!sessionId) return;
        const url = `${window.location.origin}/session/${sessionId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!sessionId) return null;

    const joinUrl = `${window.location.origin}/session/${sessionId}`;

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 flex flex-col items-center pt-20">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link to="/library" className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Live Session</h1>
                        <p className="text-gray-400 text-sm">Scan to join</p>
                    </div>
                </div>

                {/* QR Code Card */}
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                    <div className="p-2 border-4 border-black rounded-xl">
                        <QRCodeSVG value={joinUrl} size={250} level="H" />
                    </div>
                    <div className="text-center">
                        <p className="text-black font-mono font-bold text-lg tracking-wider mb-2">SCAN ME</p>
                        <button
                            onClick={copyLink}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors bg-gray-100 px-3 py-1.5 rounded-full"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? "Copied!" : "Copy Link"}
                        </button>
                    </div>
                </div>

                {/* Session Status */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Users size={18} />
                            <span>Participants</span>
                        </div>
                        <span className="font-mono text-purple-400 font-bold">{session?.participants.length || 0}</span>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Now Playing</h3>
                        {session?.currentSong ? (
                            <div className="bg-neutral-800 rounded-xl p-4 flex items-center gap-4">
                                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400">
                                    <Music size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold truncate">{session.currentSong.title}</p>
                                    <p className="text-sm text-gray-400 truncate">{session.currentSong.artist}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 border border-dashed border-neutral-800 rounded-xl">
                                No song selected
                            </div>
                        )}

                        <Link
                            to="/library"
                            state={{ sessionId }}
                            className="block w-full text-center bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Select Song from Library
                        </Link>

                        <button
                            onClick={() => {
                                endSession();
                                navigate('/library');
                            }}
                            className="block w-full text-center text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold py-3 rounded-xl transition-colors mt-2"
                        >
                            End Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
