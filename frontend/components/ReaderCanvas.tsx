"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type ReaderFrame = {
    word: string;
    orp_index: number;
    duration_ms: number;
    is_red: boolean;
};

type ReaderCanvasProps = {
    frames: ReaderFrame[];
    isPlaying: boolean;
    onComplete?: () => void;
    onProgress?: (index: number) => void;
};

export default function ReaderCanvas({ frames, isPlaying, onComplete, onProgress }: ReaderCanvasProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const accumulatedTimeRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number>(0);

    // Derived state for the current frame
    const currentFrame = frames[currentIndex];

    // Reset when frames change
    useEffect(() => {
        setCurrentIndex(0);
        accumulatedTimeRef.current = 0;
        lastFrameTimeRef.current = 0;
    }, [frames]);

    const animate = useCallback((time: number) => {
        if (!isPlaying) {
            lastFrameTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        // Initialize start time if needed
        if (lastFrameTimeRef.current === 0) {
            lastFrameTimeRef.current = time;
        }

        const deltaTime = time - lastFrameTimeRef.current;
        lastFrameTimeRef.current = time;

        accumulatedTimeRef.current += deltaTime;

        // Check if it's time to advance to the next frame
        if (currentFrame && accumulatedTimeRef.current >= currentFrame.duration_ms) {
            accumulatedTimeRef.current = 0; // Reset accumulator, or preserve overflow for precision? 
            // Reset feels safer for now to avoid "catchup" stutter

            setCurrentIndex((prev) => {
                const next = prev + 1;
                if (next >= frames.length) {
                    onComplete?.();
                    return prev; // Stay on last word
                }
                onProgress?.(next);
                return next;
            });
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [isPlaying, frames, currentFrame, onComplete, onProgress]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate]);


    // RENDER HELPERS
    if (!currentFrame) return <div className="text-white">Ready to Initialize</div>;

    const leftPart = currentFrame.word.substring(0, currentFrame.orp_index);
    const orpChar = currentFrame.word[currentFrame.orp_index];
    const rightPart = currentFrame.word.substring(currentFrame.orp_index + 1);

    return (
        <div className="w-full h-96 flex flex-col items-center justify-center bg-redshift-black overflow-hidden font-mono select-none">
            {/* The Reticle / Guides (Optional, for now just clean) */}
            <div className="relative flex items-center text-5xl md:text-7xl">
                {/* Left Side - Align Right to push ORP to center */}
                <span className="text-white opacity-90 text-right w-[45vw] lg:w-[400px]">
                    {leftPart}
                </span>

                {/* The ORP - Absolute Center */}
                <span className="text-redshift-red font-bold mx-0.5">
                    {orpChar}
                </span>

                {/* Right Side - Align Left */}
                <span className="text-white opacity-90 text-left w-[45vw] lg:w-[400px]">
                    {rightPart}
                </span>

                {/* Center marker for debug/visual aid */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-800 opacity-20 -translate-x-1/2 pointer-events-none"></div>
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-800 opacity-20 -translate-y-1/2 pointer-events-none"></div>
            </div>

            {/* Metronome / Progress Bar (Minimal) */}
            <div className="absolute bottom-10 w-64 h-1 bg-gray-900 rounded-full overflow-hidden">
                <div
                    className="h-full bg-redshift-red transition-all duration-75 ease-linear"
                    style={{ width: `${(currentIndex / Math.max(frames.length, 1)) * 100}%` }}
                />
            </div>
            <div className="absolute bottom-4 text-xs text-gray-500 font-sans">
                {currentIndex + 1} / {frames.length} | {Math.round((currentIndex / Math.max(frames.length, 1)) * 100)}%
            </div>
        </div>
    );
}
