import { useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const useSessionTracker = (
    isPlaying: boolean,
    bookId: string | null,
    wpm: number
) => {
    const sessionStartRef = useRef<number | null>(null);
    const wordsReadRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Track active reading time
    useEffect(() => {
        if (isPlaying && bookId) {
            // Start Session
            sessionStartRef.current = Date.now();
            wordsReadRef.current = 0;

            // Simple Estimation: Words read = (WPM / 60) * seconds
            // We'll update this periodically or on pause
            intervalRef.current = setInterval(() => {
                wordsReadRef.current += (wpm / 60);
            }, 1000);

        } else if (!isPlaying && sessionStartRef.current && bookId) {
            // End Session
            const endTime = Date.now();
            const startTime = sessionStartRef.current;
            const durationSeconds = (endTime - startTime) / 1000;

            // Minimum valid session: 5 seconds (ignore accidental clicks)
            if (durationSeconds > 5) {
                const session = {
                    id: uuidv4(),
                    bookId,
                    startTime,
                    endTime,
                    durationSeconds,
                    wordsRead: Math.round(wordsReadRef.current),
                    averageWpm: wpm
                };

                db.sessions.add(session).catch(e => console.error("Failed to save session:", e));
            }

            // Reset
            sessionStartRef.current = null;
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Handle unmount - tricky with React strict mode, usually handled by checking isPlaying false, 
            // but strict mode might fire cleanup with active session. 
            // For MVP, we'll rely on pause to save.
        };
    }, [isPlaying, bookId, wpm]); // Re-run if any change (splitting sessions on WPM change is acceptable for v1)
};
