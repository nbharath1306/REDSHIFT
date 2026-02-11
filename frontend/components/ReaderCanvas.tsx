"use client";

import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, X, Settings2 } from "lucide-react";
// We don't have a Button component in Cogniread by default, will use raw HTML or basic implementation
import { motion } from "framer-motion";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from "react";
import { ReaderSettingsMenu, type ReaderSettings } from "./ReaderSettings";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type ReaderCanvasProps = {
    currentWord: string;
    orpIndex: number;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onExit: () => void;
    onRestart: () => void;
    onSeek: (forward: boolean) => void;
    progress: number;
    wpmConfig: number;
    totalWords: number;
    currentIndex: number;
    settings: ReaderSettings;
    onSettingsChange: (settings: ReaderSettings) => void;
};

export default function ReaderCanvas({
    currentWord,
    orpIndex,
    isPlaying,
    onTogglePlay,
    onExit,
    onRestart,
    onSeek,
    progress,
    wpmConfig,
    totalWords,
    currentIndex,
    settings,
    onSettingsChange
}: ReaderCanvasProps) {

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Zen Mode State
    const [isHovering, setIsHovering] = useState(true); // Start visible
    const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);

    // Logic: Show controls if paused, hovering, or Zen Mode is OFF
    const showControls = !isPlaying || isHovering || !settings.zenMode || isSettingsOpen;

    // Handle Mouse Movement (Idle Detection)
    const handleMouseMove = () => {
        setIsHovering(true);
        if (idleTimer) clearTimeout(idleTimer);

        // Only start hide timer if we are playing and in Zen Mode
        if (isPlaying && settings.zenMode && !isSettingsOpen) {
            const timer = setTimeout(() => {
                setIsHovering(false);
            }, 1500); // 1.5s idle to hide
            setIdleTimer(timer);
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (idleTimer) clearTimeout(idleTimer);
        }
    }, [idleTimer]);

    // Force hide when playing starts
    useEffect(() => {
        if (isPlaying && settings.zenMode) {
            const timer = setTimeout(() => setIsHovering(false), 500);
            return () => clearTimeout(timer);
        } else {
            setIsHovering(true);
        }
    }, [isPlaying, settings.zenMode]);




    // ORP Slicing Logic
    const leftPart = currentWord.substring(0, orpIndex);
    const orpChar = currentWord[orpIndex] || "";
    const rightPart = currentWord.substring(orpIndex + 1);

    // Dynamic Text Scaling
    // Base threshold: 10 chars. If longer, scale down.
    const charCount = currentWord.length;
    const baseScale = 1;
    const scaleFactor = charCount > 10 ? Math.max(0.4, 10 / charCount) : 1;
    const dynamicFontSize = settings.fontSize * scaleFactor;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col font-mono select-none overflow-hidden"
            onMouseMove={handleMouseMove}
            onClick={handleMouseMove}
        >
            {/* ... HUD Layers ... */}

            {/* Top/Bottom Bars ... */}

            {/* Main Canvas (Centered) */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">

                {/* Focus Reticle ... */}
                <div
                    className={cn(
                        "absolute w-[95vw] md:w-[80vw] max-w-[800px] h-24 md:h-32 border-x border-[#FF3131]/20 pointer-events-none flex justify-between items-end pb-2 transition-opacity duration-500",
                        showControls ? "opacity-50" : "opacity-0"
                    )}
                >
                </div>

                {/* The WORD */}
                <div
                    className="relative flex items-center justify-center w-full max-w-full px-4 leading-none filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ fontSize: `${dynamicFontSize}rem` }}
                >
                    {/* Left Side - Removed overflow-hidden/text-ellipsis */}
                    <span className="flex-1 text-right font-medium opacity-80 whitespace-nowrap text-zinc-400">
                        {leftPart}
                    </span>

                    {/* The ORP */}
                    <span className="text-[#FF3131] font-bold mx-0.5 relative drop-shadow-[0_0_15px_rgba(255,49,49,0.8)] flex-shrink-0 z-10">
                        {orpChar}
                    </span>

                    {/* Right Side - Removed overflow-hidden/text-ellipsis */}
                    <span className="flex-1 text-left font-medium opacity-80 whitespace-nowrap text-zinc-400">
                        {rightPart}
                    </span>

                    {/* Dynamic Guides ... */}
                    {settings.guideAxis === 'vertical' && (
                        <div className={cn("absolute -top-10 -bottom-10 left-1/2 w-0.5 -translate-x-1/2 bg-[#FF3131]/20 z-0 transition-opacity", showControls ? "opacity-100" : "opacity-30")} />
                    )}
                    {settings.guideAxis === 'horizontal' && (
                        <div className={cn("absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#FF3131]/20 z-0 transition-opacity", showControls ? "opacity-100" : "opacity-30")} />
                    )}
                    {settings.guideAxis === 'crosshair' && (
                        <>
                            <div className={cn("absolute -top-10 -bottom-10 left-1/2 w-0.5 -translate-x-1/2 bg-[#FF3131]/20 z-0 transition-opacity", showControls ? "opacity-100" : "opacity-30")} />
                            <div className={cn("absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#FF3131]/20 z-0 transition-opacity", showControls ? "opacity-100" : "opacity-30")} />
                        </>
                    )}

                </div>
            </div>

            {/* Control Bar (Bottom) */}
            <div
                className={cn(
                    "h-40 mb-0 flex items-center justify-center gap-4 md:gap-16 pb-12 bg-gradient-to-t from-black to-transparent z-20 relative transition-all duration-500",
                    showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
                )}
            >
                {/* Decorative Tech Lines */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-[#FF3131]/20" />

                <button
                    onClick={() => {
                        setIsSettingsOpen(true);
                        if (isPlaying) onTogglePlay();
                    }}
                    className="absolute left-8 md:left-12 bottom-12 text-gray-500 hover:text-white transition-colors"
                >
                    <Settings2 className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-8">
                    <button onClick={() => onSeek(false)} className="hover:bg-[#FF3131]/10 rounded-full w-16 h-16 flex items-center justify-center transition-colors">
                        <ChevronLeft className="w-10 h-10 text-white/70" />
                    </button>

                    <button
                        className={cn(
                            "w-24 h-24 rounded-full border-2 shadow-[0_0_30px_rgba(255,49,49,0.2)] flex items-center justify-center transition-all",
                            isPlaying ? "border-[#FF3131] text-[#FF3131] bg-black/50" : "border-white/20 text-white hover:border-[#FF3131] hover:text-[#FF3131]"
                        )}
                        onClick={onTogglePlay}
                    >
                        {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                    </button>

                    <button onClick={() => onSeek(true)} className="hover:bg-[#FF3131]/10 rounded-full w-16 h-16 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-10 h-10 text-white/70" />
                    </button>
                </div>

                <button onClick={onRestart} className="absolute right-8 md:right-12 bottom-12 text-gray-500 hover:text-white transition-colors">
                    <RotateCcw className="w-6 h-6" />
                </button>
            </div>

            {/* Exit Button - Always visible or toggleable */}
            <div className={cn("absolute top-6 right-6 z-50 transition-opacity", showControls ? "opacity-100" : "opacity-0")}>
                <button
                    onClick={onExit}
                    className="p-2 rounded-full bg-black/50 hover:bg-red-500 hover:text-white border border-white/10 transition-all group"
                >
                    <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
                </button>
            </div>

            {/* Paused Overlay */}
            {!isPlaying && !isSettingsOpen && currentIndex < totalWords - 1 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="w-full h-full bg-black/20 backdrop-blur-sm absolute" />
                    <div className="text-[12vw] font-black text-white/10 uppercase tracking-[0.2em] relative">
                        PAUSED
                    </div>
                </div>
            )}

            {/* Completion Overlay */}
            {!isPlaying && currentIndex >= totalWords - 1 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-8"
                    >
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                            READING <span className="text-red-500">COMPLETE</span>
                        </h2>

                        <div className="flex items-center justify-center gap-8 text-gray-400 font-mono uppercase tracking-widest text-sm">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-2xl text-white font-bold">{wpmConfig}</span>
                                <span>WPM</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-2xl text-white font-bold">{totalWords}</span>
                                <span>WORDS</span>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={onRestart}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Replay
                            </button>
                            <button
                                onClick={onExit}
                                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,49,49,0.4)]"
                            >
                                Finish
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Settings Modal */}
            <ReaderSettingsMenu
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onUpdate={onSettingsChange}
            />

        </motion.div>
    );
}
