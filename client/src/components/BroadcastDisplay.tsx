import { useEffect, useState } from 'react';
import { type BroadcastMessage } from '../services/session';
import { AnimatePresence, motion } from 'framer-motion';

interface BroadcastDisplayProps {
    message: BroadcastMessage | null | undefined;
    isLeader?: boolean;
}

export function BroadcastDisplay({ message, isLeader = false }: BroadcastDisplayProps) {
    const [visible, setVisible] = useState(false);
    const [currentText, setCurrentText] = useState('');

    useEffect(() => {
        if (message?.text && !isLeader) {
            setCurrentText(message.text);
            setVisible(true);

            // Auto-hide after 3 seconds
            const timer = setTimeout(() => {
                setVisible(false);
            }, 3000);

            return () => clearTimeout(timer);
        } else if (!message?.text) {
            setVisible(false);
        }
    }, [message?.id, message?.text, isLeader]);

    if (isLeader) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-safe-top pointer-events-none"
                    style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
                >
                    <div className="mx-4 mt-2">
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-neutral-900/90 backdrop-blur-md border border-purple-500/30 px-8 py-4 rounded-2xl shadow-xl shadow-purple-900/20 flex items-center justify-center max-w-md mx-auto"
                        >
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent text-center">
                                {currentText}
                            </h2>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
