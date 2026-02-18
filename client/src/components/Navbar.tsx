import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, LogOut, Library, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
    className?: string;
    transparent?: boolean;
}

export function Navbar({ className = '', transparent = false }: NavbarProps) {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error("Failed to sign out", error);
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-colors ${transparent ? 'bg-transparent' : 'bg-[#050505]/90 backdrop-blur-md border-b border-neutral-800'
            } ${className}`}>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                    <span className="font-bold text-white text-lg">U</span>
                </div>
                <span className="font-bold text-lg text-white hidden sm:block">Ultimate Chords</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
                {user ? (
                    <>
                        <Link to="/library" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-2">
                            <Library size={18} />
                            <span>My Library</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <LogOut size={18} />
                            <span>Log Out</span>
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                        Sign In
                    </Link>
                )}
            </div>

            {/* Mobile Menu Button */}
            <button
                className="md:hidden text-white p-2 rounded-full hover:bg-white/10"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full right-4 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden md:hidden"
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
        </nav>
    );
}
