import { useState, useRef, useEffect, useCallback } from 'react';

type Frame = {
    word: string;
    duration_ms: number;
    orp_index: number;
    is_red: boolean;
};

export function useRSVPReader(frames: Frame[]) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Refs for animation loop
    const requestRef = useRef<number>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const accumulatorRef = useRef<number>(0);
    const frameIndexRef = useRef(0); // Mutable ref for instant access in loop

    // Sync refs with state
    useEffect(() => {
        frameIndexRef.current = currentIndex;
    }, [currentIndex]);

    const animate = useCallback((time: number) => {
        if (lastFrameTimeRef.current === 0) {
            lastFrameTimeRef.current = time;
        }

        const deltaTime = time - lastFrameTimeRef.current;
        lastFrameTimeRef.current = time;

        accumulatorRef.current += deltaTime;

        const currentFrame = frames[frameIndexRef.current];

        if (currentFrame && accumulatorRef.current >= currentFrame.duration_ms) {
            accumulatorRef.current = 0;

            const nextIndex = frameIndexRef.current + 1;
            if (nextIndex >= frames.length) {
                setIsPlaying(false); // Stop at end
                return;
            }

            frameIndexRef.current = nextIndex;
            setCurrentIndex(nextIndex);
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [frames]);

    const startLoop = useCallback(() => {
        lastFrameTimeRef.current = 0; // Reset delta tracking
        requestRef.current = requestAnimationFrame(animate);
    }, [animate]);

    const stopLoop = useCallback(() => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    }, []);

    // Effect to toggle loop
    useEffect(() => {
        if (isPlaying && frames.length > 0) {
            startLoop();
        } else {
            stopLoop();
        }
        return () => stopLoop();
    }, [isPlaying, frames, startLoop, stopLoop]);

    // Controls
    const togglePlay = () => setIsPlaying(p => !p);
    const restart = () => {
        setIsPlaying(false);
        setCurrentIndex(0);
        frameIndexRef.current = 0;
        accumulatorRef.current = 0;
    };
    const seek = (forward: boolean) => {
        const delta = forward ? 10 : -10;
        const newIndex = Math.max(0, Math.min(frames.length - 1, currentIndex + delta));
        setCurrentIndex(newIndex);
        frameIndexRef.current = newIndex;
    };

    return {
        currentIndex,
        progress: frames.length ? currentIndex / frames.length : 0,
        isPlaying,
        togglePlay,
        restart,
        seek,
        setIsPlaying
    };
}
