import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { sessionService } from '../services/session';

interface SessionContextType {
    activeSessionId: string | null;
    isLeader: boolean;
    startSession: (sessionId: string) => void;
    endSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
        return localStorage.getItem('activeSessionId');
    });
    const [isLeader, setIsLeader] = useState<boolean>(() => {
        return localStorage.getItem('isSessionLeader') === 'true';
    });

    useEffect(() => {
        if (activeSessionId) {
            localStorage.setItem('activeSessionId', activeSessionId);
            localStorage.setItem('isSessionLeader', String(isLeader));
        } else {
            localStorage.removeItem('activeSessionId');
            localStorage.removeItem('isSessionLeader');
        }
    }, [activeSessionId, isLeader]);

    const startSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
        setIsLeader(true); // Assumes only leader calls this for now
    };

    const endSession = async () => {
        if (activeSessionId && isLeader) {
            try {
                // Fire and forget delete - we want to clear local state immediately
                sessionService.deleteSession(activeSessionId).catch(err =>
                    console.error("Failed to delete session remotely", err)
                );
            } catch (error) {
                console.error("Error ending session:", error);
            }
        }
        setActiveSessionId(null);
        setIsLeader(false);
    };

    return (
        <SessionContext.Provider value={{ activeSessionId, isLeader, startSession, endSession }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
