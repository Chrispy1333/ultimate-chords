import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface SessionQRModalProps {
    sessionId: string;
    onClose: () => void;
}

export function SessionQRModal({ sessionId, onClose }: SessionQRModalProps) {
    const [copied, setCopied] = useState(false);
    const joinUrl = `${window.location.origin}/session/${sessionId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">Join Session</h3>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-6">
                    <div className="bg-white p-4 rounded-xl">
                        <QRCodeSVG value={joinUrl} size={200} level="H" />
                    </div>

                    <div className="w-full text-center">
                        <p className="text-sm text-gray-400 mb-2">Scan code or share link:</p>
                        <div className="flex items-center gap-2 bg-neutral-800 p-2 rounded-lg">
                            <code className="flex-1 text-xs text-purple-300 truncate font-mono">
                                {joinUrl}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="p-1.5 hover:bg-neutral-700 rounded-md transition-colors text-gray-400 hover:text-white"
                                title="Copy Link"
                            >
                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
