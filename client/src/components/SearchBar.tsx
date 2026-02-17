import { Search } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (val: string) => void;
    onSearch: () => void;
    loading?: boolean;
}

export function SearchBar({ value, onChange, onSearch, loading }: SearchBarProps) {
    return (
        <div className="relative w-full max-w-2xl mx-auto flex gap-2">
            <input
                type="text"
                className="block w-full px-6 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl 
                   text-lg text-white placeholder-gray-500
                   focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 focus:outline-none
                   transition-all shadow-lg shadow-black/50 hover:border-neutral-700"
                placeholder="Search for songs or artists..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                disabled={loading}
            />
            <button
                onClick={onSearch}
                disabled={loading}
                className="flex-none px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl 
                    transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-700/40 
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title="Search"
            >
                {loading ? (
                    <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                    <Search className="w-6 h-6" />
                )}
            </button>
        </div>
    );
}
