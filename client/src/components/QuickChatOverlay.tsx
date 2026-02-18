import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

interface QuickChatOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onBroadcast: (message: string) => void;
}

export function QuickChatOverlay({ isOpen, onClose, onBroadcast }: QuickChatOverlayProps) {
    const { settings } = useSettings();
    const sections = settings.quickChat?.sections || [];

    // Scroll locking
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBroadcast = (text: string) => {
        onBroadcast(text);
        onClose();
    };

    // Animation for staggered items
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-md flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-white">Quick Chat</h2>
                            <Link
                                to="/settings"
                                className="px-3 py-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <SettingsIcon size={14} />
                                Edit Presets
                            </Link>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="max-w-4xl mx-auto space-y-8"
                        >
                            {sections.map((section) => (
                                <motion.div key={section.id} variants={item} className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-wider pl-1">{section.title}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {section.messages.map((text, idx) => (
                                            <button
                                                key={`${section.id}-${idx}`}
                                                onClick={() => handleBroadcast(text)}
                                                className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] 
                                                         hover:bg-white/10 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 
                                                         active:scale-95 transition-all duration-200"
                                            >
                                                <span className="text-xl font-semibold text-white">{text}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
