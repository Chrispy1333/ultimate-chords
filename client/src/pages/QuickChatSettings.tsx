import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Plus, Trash2, RotateCcw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Define the structure for sections
export interface QuickChatSection {
    id: string;
    title: string;
    messages: string[];
}

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
    const [sections, setSections] = useState<QuickChatSection[]>(() => {
        const saved = localStorage.getItem('quickChatSections_v2');
        return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    });

    // Save whenever sections change
    useEffect(() => {
        localStorage.setItem('quickChatSections_v2', JSON.stringify(sections));
        // We track "hasChanges" just for UI feedback if needed, 
        // but here we auto-save to localStorage effectively. 
        // If we wanted a manual "Save" button we would defer this.
        // For this app, auto-save is fine, but let's show a "Saved" indicator temporarily if we wanted.
    }, [sections]);

    const handleReset = () => {
        if (confirm('Reset all quick chat settings to default?')) {
            setSections(DEFAULT_SECTIONS);
        }
    };

    const addSection = () => {
        const newSection: QuickChatSection = {
            id: Date.now().toString(),
            title: 'New Section',
            messages: []
        };
        setSections([...sections, newSection]);
    };

    const removeSection = (id: string) => {
        if (confirm('Delete this entire section?')) {
            setSections(sections.filter(s => s.id !== id));
        }
    };

    const updateSectionTitle = (id: string, newTitle: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, title: newTitle } : s));
    };

    const addMessage = (sectionId: string) => {
        const message = prompt("Enter new message:");
        if (message) {
            setSections(sections.map(s =>
                s.id === sectionId ? { ...s, messages: [...s.messages, message] } : s
            ));
        }
    };

    const removeMessage = (sectionId: string, index: number) => {
        setSections(sections.map(s => {
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
        setSections(newSections);
    };

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

                <div className="space-y-6">
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
                </div>
            </div>
        </div>
    );
}


