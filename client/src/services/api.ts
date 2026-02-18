export interface SearchResult {
    song_name: string;
    artist_name: string;
    rating: number;
    votes: number;
    type: string;
    url: string;
    version: number;
    tab_access_type: string;
}

export interface TabData {
    song_name: string;
    artist_name: string;
    content: string;
    tuning: any;
    key: string;
    capo: string | number;
    url: string;
}

const API_BASE = '/api';

const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

const getCache = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed: CacheItem<T> = JSON.parse(item);
        if (Date.now() - parsed.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
            return null;
        }

        return parsed.data;
    } catch {
        return null;
    }
};

const setCache = <T>(key: string, data: T) => {
    try {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
        console.warn('Failed to save to cache', e);
    }
};

export const api = {
    search: async (query: string): Promise<SearchResult[]> => {
        const cacheKey = `search_v2:${query.toLowerCase()}`;
        const cached = getCache<SearchResult[]>(cacheKey);
        if (cached) return cached;

        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Search failed: ${res.status}`);
        }
        const data = await res.json();
        // Only cache if we actually found results
        if (data && data.length > 0) {
            setCache(cacheKey, data);
        }
        return data;
    },

    getTab: async (url: string): Promise<TabData> => {
        const cacheKey = `tab_v2:${url}`;
        const cached = getCache<TabData>(cacheKey);
        if (cached) return cached;

        const res = await fetch(`${API_BASE}/tab?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch tab: ${res.status}`);
        }
        const data = await res.json();
        setCache(cacheKey, data);
        return data;
    }
};
