import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { dbService, type UserSettings, type QuickChatSection } from '../services/db';

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

const DEFAULT_SETTINGS: UserSettings = {
    quickChat: {
        enabled: true,
        sections: DEFAULT_SECTIONS
    }
};

interface SettingsContextType {
    settings: UserSettings;
    isLoading: boolean;
    updateQuickChatSettings: (enabled: boolean, sections: QuickChatSection[]) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setSettings(DEFAULT_SETTINGS);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubscribe = dbService.subscribeToUserSettings(user.uid, (data) => {
            if (data) {
                // Merge with defaults to handle partial data or new fields
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    quickChat: {
                        ...DEFAULT_SETTINGS.quickChat!, // Starts with defaults
                        ...(data.quickChat || {})       // Overwrites with saved
                    }
                }));
            } else {
                // No settings found, keep defaults
                setSettings(DEFAULT_SETTINGS);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateQuickChatSettings = async (enabled: boolean, sections: QuickChatSection[]) => {
        if (!user) return;
        // Optimistic update
        setSettings(prev => ({
            ...prev,
            quickChat: { enabled, sections }
        }));

        try {
            await dbService.updateUserSettings(user.uid, {
                quickChat: { enabled, sections }
            });
        } catch (error) {
            console.error("Failed to save settings", error);
            // Revert? Or just show toast. For now, we trust.
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, isLoading, updateQuickChatSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
