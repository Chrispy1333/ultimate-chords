import { useAuth } from '../contexts/AuthContext';
import { LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function SignIn() {
    const { user, loading, signInWithGoogle, logout, error } = useAuth();
    const location = useLocation();

    // Hide on song page to prevent overlap with sticky header
    if (location.pathname.startsWith('/song')) return null;

    if (loading) return null;

    return (
        <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
            {error && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs mb-2 backdrop-blur-sm">
                    <AlertTriangle size={14} />
                    <span>Auth Failed: {error.message}</span>
                </div>
            )}

            {user ? (
                <div className="flex items-center gap-4">
                    <Link to="/library" className="text-sm text-gray-400 hover:text-white transition-colors">
                        My Library
                    </Link>
                    <img
                        src={user.photoURL || ''}
                        alt={user.displayName || 'User'}
                        className="w-8 h-8 rounded-full border border-gray-700"
                    />
                    <button
                        onClick={logout}
                        className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white transition-colors"
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={signInWithGoogle}
                    disabled={!!error}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all
                        ${error
                            ? 'bg-neutral-900/50 text-gray-600 border-neutral-800 cursor-not-allowed'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-gray-200 border-neutral-700 hover:border-purple-500/50'
                        }`}
                >
                    <LogIn size={18} />
                    <span className="text-sm font-medium">Sign In</span>
                </button>
            )}
        </div>
    );
}
