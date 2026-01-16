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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col font-mono select-none"
            onMouseMove={handleMouseMove}
            onClick={handleMouseMove}
        >
            {/* HUD OVERLAY LAYERS */}
            {/* 1. Vignette: Fade out in Zen Mode Reading */}
            <div
                className={cn(
                    "absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] z-0 pointer-events-none transition-opacity duration-700",
                    showControls ? "opacity-100" : "opacity-30"
                )}
            />

            {/* 2. Scanlines: Fade out almost completely in Zen Mode */}
            <div
                className={cn(
                    "absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,6px_100%] pointer-events-none transition-opacity duration-700",
                    showControls ? "opacity-20" : "opacity-5"
                )}
            />

            {/* Top Bar: Progress & Exit */}
            <div
                className={cn(
                    "absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20 pt-4 transition-all duration-500",
                    showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
                )}
            >
                <div className="flex items-center gap-4 text-xs font-bold text-[#FF3131] uppercase tracking-widest bg-black/50 backdrop-blur border border-[#FF3131]/20 px-4 py-2 rounded">
                    <span className="animate-pulse">● LIVE</span>
                    <span className="text-white">{wpmConfig} WPM</span>
                    <span>{currentIndex + 1} / {totalWords}</span>
                </div>
                <button onClick={onExit} className="hover:text-[#FF3131] hover:bg-black/50 text-gray-400 p-2 rounded transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Progress Line - HUD Style */}
            <div
                className={cn(
                    "absolute top-0 left-0 right-0 h-0.5 bg-gray-900/50 z-20 transition-opacity duration-500",
                    showControls ? "opacity-100" : "opacity-0"
                )}
            >
                <motion.div
                    className="h-full bg-[#FF3131] shadow-[0_0_10px_#FF3131]"
                    style={{ width: `${(progress) * 100}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
            </div>

            {/* Main Canvas (Centered) */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">

                {/* Focus Reticle (Decorative HUD Elements) - HIDE IN ZEN */}
                <div
                    className={cn(
                        "absolute w-[95vw] md:w-[80vw] max-w-[800px] h-24 md:h-32 border-x border-[#FF3131]/20 pointer-events-none flex justify-between items-end pb-2 transition-opacity duration-500",
                        showControls ? "opacity-50" : "opacity-0"
                    )}
                >
                    {/* Decorative text removed for cleaner look, even when controls shown, or keep subtle */}
                </div>

                {/* The WORD */}
                <div
                    className="relative flex items-baseline justify-center w-full max-w-full px-4 leading-none filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-300"
                    style={{ fontSize: `${settings.fontSize}rem` }}
                >
                    {/* Left Side */}
                    <span className="flex-1 text-right font-medium opacity-80 overflow-hidden whitespace-nowrap text-ellipsis min-w-0 text-zinc-400">
                        {leftPart}
                    </span>

                    {/* The ORP */}
                    <span className="text-[#FF3131] font-bold mx-0.5 relative drop-shadow-[0_0_15px_rgba(255,49,49,0.8)] flex-shrink-0 z-10">
                        {orpChar}
                    </span>

                    {/* Right Side */}
                    <span className="flex-1 text-left font-medium opacity-80 overflow-hidden whitespace-nowrap text-ellipsis min-w-0 text-zinc-400">
                        {rightPart}
                    </span>

                    {/* Dynamic Guides - HIDE IN ZEN? No, keep guides if user asked for them */}
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

                <button onClick={() => setIsSettingsOpen(true)} className="absolute left-8 md:left-12 bottom-12 text-gray-500 hover:text-white transition-colors">
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

            {/* Paused Overlay */}
            {!isPlaying && !isSettingsOpen && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="w-full h-full bg-black/20 backdrop-blur-sm absolute" />
                    <div className="text-[12vw] font-black text-white/10 uppercase tracking-[0.2em] relative">
                        PAUSED
                    </div>
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
