import { Search, ArrowRight } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (val: string) => void;
    onSearch: () => void;
    loading?: boolean;
}

export function SearchBar({ value, onChange, onSearch, loading }: SearchBarProps) {
    return (
        <div className="relative w-full max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
                type="text"
                className="block w-full pl-12 pr-14 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl 
                   text-lg text-white placeholder-gray-500
                   focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 focus:outline-none
                   transition-all shadow-lg shadow-black/50 hover:border-neutral-700"
                placeholder="Search for songs or artists..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                disabled={loading}
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
                {loading ? (
                    <div className="h-9 w-9 flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <button
                        onClick={onSearch}
                        className="p-2 text-gray-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
                        title="Search"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
