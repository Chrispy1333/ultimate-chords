import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { SongCard } from '../components/SongCard';
import { api, type SearchResult } from '../services/api';
import { Navbar } from '../components/Navbar';

export default function Home() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParam = searchParams.get('q') || '';

    // Local state for input field to allow typing without updating URL immediately
    const [inputValue, setInputValue] = useState(queryParam);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(!!queryParam);

    const [error, setError] = useState('');

    // Sync input with URL param (e.g. on back button)
    useEffect(() => {
        setInputValue(queryParam);
        if (queryParam) {
            performSearch(queryParam);
        } else {
            setResults([]);
            setSearched(false);
            setError('');
        }
    }, [queryParam]);

    const performSearch = async (q: string) => {
        setLoading(true);
        setSearched(true);
        setError('');
        try {
            const data = await api.search(q);
            setResults(data);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Search failed');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!inputValue.trim()) {
            setSearchParams({});
            return;
        }
        setSearchParams({ q: inputValue });
    };

    return (
        <div className="w-full min-h-screen">
            <Navbar transparent={true} />
            <div className="w-full max-w-4xl lg:max-w-7xl mx-auto px-6 pt-24 pb-10 flex flex-col items-center">
                <div className={`transition-all duration-500 flex flex-col items-center w-full max-w-3xl ${searched ? 'mb-8' : 'mb-8 mt-[20vh]'}`}>
                    <h1 className={`font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2 ${searched ? 'text-3xl lg:text-4xl' : 'text-5xl lg:text-7xl'}`}>
                        Ultimate Chords
                    </h1>
                    <p className={`text-gray-400 mb-8 ${searched ? 'hidden' : 'block'}`}>
                        Minimalist, ad-free guitar tabs in night mode.
                    </p>

                    <SearchBar
                        value={inputValue}
                        onChange={setInputValue}
                        onSearch={handleSearch}
                        loading={loading}
                    />

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm">
                            {error}
                            {error.includes("Captcha") && <p className="mt-1 text-xs opacity-75">The server is currently blocked by Ultimate Guitar. Please try again later.</p>}
                        </div>
                    )}
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {results.map((res, i) => (
                        <SongCard key={i} result={res} />
                    ))}
                    {searched && !loading && !error && results.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-10">
                            No results found.
                        </div>
                    )}
                </div>
            </div>
            );
}
