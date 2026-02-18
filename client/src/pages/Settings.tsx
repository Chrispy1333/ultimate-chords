import { Navbar } from '../components/Navbar';
import { MessageSquarePlus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            <div className="max-w-3xl mx-auto px-6 pt-24 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Settings</h1>
                    <p className="text-gray-400 mt-1">Manage your application preferences</p>
                </div>

                <div className="space-y-4">
                    <Link
                        to="/settings/quick-chat"
                        className="block bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 hover:bg-neutral-800/80 hover:border-purple-500/30 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                    <MessageSquarePlus size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Quick Chat</h3>
                                    <p className="text-sm text-gray-500">Configure presets and sections</p>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
