import { Star } from 'lucide-react';
import type { SearchResult } from '../services/api';
import { Link } from 'react-router-dom';

export function SongCard({ result }: { result: SearchResult }) {
    // Only show chords/tabs
    if (!['Chords', 'Tab'].includes(result.type)) return null;

    return (
        <Link to={`/song?url=${encodeURIComponent(result.url)}`}
            state={{ title: result.song_name, artist: result.artist_name }}
            className="block p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl 
                     hover:bg-neutral-800 hover:border-neutral-700 transition-all group">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-gray-200 group-hover:text-purple-400 transition-colors">
                        {result.song_name}
                    </h3>
                    <p className="text-gray-400 text-sm">{result.artist_name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${result.type === 'Chords'
                        ? 'border-purple-500/30 text-purple-400 bg-purple-500/5'
                        : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                        }`}>
                        {result.type}
                    </span>
                    <div className="flex items-center text-yellow-500/80 gap-1 text-xs">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{result.rating.toFixed(1)}</span>
                        <span className="text-gray-600">({result.votes})</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
