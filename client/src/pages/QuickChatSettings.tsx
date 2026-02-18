import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Plus, Trash2, RotateCcw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import type { QuickChatSection } from '../services/db';

const DEFAULT_SECTIONS: QuickChatSection[] = [
    {
        id: 'section-1',
        title: 'Song Parts',
        messages: ['Verse 1', 'Verse 2', 'Verse 3', 'Chorus', 'Bridge']
    },
    {
        id: 'section-2',
        title: 'Dynamics',
        messages: ['Repeat', 'Build up', 'Quiet down']
    }
];

export default function QuickChatSettings() {
    const { settings, updateQuickChatSettings, isLoading } = useSettings();

    // Local state for editing form, initialized from context
    const [sections, setSections] = useState<QuickChatSection[]>([]);
    const [enabled, setEnabled] = useState(true);

    // Sync local state with context settings when they load
    useEffect(() => {
        if (!isLoading && settings.quickChat) {
            setSections(settings.quickChat.sections);
            setEnabled(settings.quickChat.enabled ?? true);
        }
    }, [isLoading, settings]);

    // Save changes function (debounced or on distinct actions? 
    // For this UI, let's auto-save on every change for a smooth experience, 
    // but maybe we should wrap the update in a helper to avoid boilerplate)
    const save = (newEnabled: boolean, newSections: QuickChatSection[]) => {
        setEnabled(newEnabled);
        setSections(newSections);
        updateQuickChatSettings(newEnabled, newSections);
    };

    const handleReset = () => {
        if (confirm('Reset all quick chat settings to default?')) {
            save(true, DEFAULT_SECTIONS);
        }
    };

    const addSection = () => {
        const newSection: QuickChatSection = {
            id: Date.now().toString(),
            title: 'New Section',
            messages: []
        };
        save(enabled, [...sections, newSection]);
    };

    const removeSection = (id: string) => {
        if (confirm('Delete this entire section?')) {
            save(enabled, sections.filter(s => s.id !== id));
        }
    };

    const updateSectionTitle = (id: string, newTitle: string) => {
        save(enabled, sections.map(s => s.id === id ? { ...s, title: newTitle } : s));
    };

    const addMessage = (sectionId: string) => {
        const message = prompt("Enter new message:");
        if (message) {
            save(enabled, sections.map(s =>
                s.id === sectionId ? { ...s, messages: [...s.messages, message] } : s
            ));
        }
    };

    const removeMessage = (sectionId: string, index: number) => {
        save(enabled, sections.map(s => {
            if (s.id !== sectionId) return s;
            const newMessages = [...s.messages];
            newMessages.splice(index, 1);
            return { ...s, messages: newMessages };
        }));
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sections.length - 1) return;

        const newSections = [...sections];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
        save(enabled, newSections);
    };

    if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            <div className="max-w-3xl mx-auto px-6 pt-24 pb-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Settings</h1>
                        <p className="text-gray-400 mt-1">Customize your Quick Chat presets</p>
                    </div>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                    >
                        <RotateCcw size={16} />
                        <span>Reset Defaults</span>
                    </button>
                </div>

                {/* Main Toggle */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-8 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-white text-lg">Enable Quick Chat</h3>
                        <p className="text-sm text-gray-500">Show the Quick Chat button during sessions</p>
                    </div>
                    <button
                        onClick={() => save(!enabled, sections)}
                        className={`w-14 h-8 rounded-full p-1 transition-colors ${enabled ? 'bg-purple-600' : 'bg-neutral-700'}`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                <AnimatePresence>
                    {enabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6 overflow-hidden"
                        >
                            {sections.map((section, index) => (
                                <motion.div
                                    key={section.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden"
                                >
                                    {/* Section Header */}
                                    <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center gap-4">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => moveSection(index, 'up')}
                                                disabled={index === 0}
                                                className="text-gray-600 hover:text-white disabled:opacity-30"
                                            >
                                                <ChevronUp size={16} />
                                            </button>
                                            <button
                                                onClick={() => moveSection(index, 'down')}
                                                disabled={index === sections.length - 1}
                                                className="text-gray-600 hover:text-white disabled:opacity-30"
                                            >
                                                <ChevronDown size={16} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                            className="bg-transparent text-xl font-bold focus:outline-none focus:text-purple-400 transition-colors w-full"
                                            placeholder="Section Title"
                                        />
                                        <button
                                            onClick={() => removeSection(section.id)}
                                            className="text-gray-600 hover:text-red-400 transition-colors p-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Messages Grid */}
                                    <div className="p-4">
                                        <div className="flex flex-wrap gap-3">
                                            <AnimatePresence>
                                                {section.messages.map((msg, msgIndex) => (
                                                    <motion.div
                                                        key={`${section.id}-${msgIndex}`}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className="group relative bg-[#050505] border border-neutral-800 rounded-lg px-4 py-2 flex items-center hover:border-purple-500/50 transition-colors"
                                                    >
                                                        <span>{msg}</span>
                                                        <button
                                                            onClick={() => removeMessage(section.id, msgIndex)}
                                                            className="ml-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={14} className="lucide-x" /> {/* Note: Need to import X */}
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            <button
                                                onClick={() => addMessage(section.id)}
                                                className="px-4 py-2 rounded-lg border border-dashed border-neutral-700 text-gray-500 hover:text-purple-400 hover:border-purple-500/50 transition-all flex items-center gap-2 text-sm"
                                            >
                                                <Plus size={16} /> Add Message
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            <button
                                onClick={addSection}
                                className="w-full py-4 rounded-xl border-2 border-dashed border-neutral-800 text-gray-500 hover:text-white hover:border-neutral-700 transition-all flex items-center justify-center gap-2 font-medium"
                            >
                                <Plus size={20} /> Add New Section
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


