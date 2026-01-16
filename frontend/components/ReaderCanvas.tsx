"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ReaderFrame = {
    word: string;
    orp_index: number;
    duration_ms: number;
    is_red: boolean;
};

type ReaderCanvasProps = {
    frames: ReaderFrame[];
    isPlaying: boolean;
    onTogglePlay: () => void;
    onExit: () => void;
    onRestart: () => void;
    onSeek: (forward: boolean) => void;
    progress: number;
    wpmConfig: number;
};

export default function ReaderCanvas({
    frames,
    isPlaying,
    onTogglePlay,
    onExit,
    onRestart,
    onSeek,
    progress,
    wpmConfig
}: ReaderCanvasProps) {
    const currentIndex = Math.min(Math.floor(progress * frames.length), frames.length - 1);
    const currentFrame = frames[currentIndex] || frames[0];

    // ORP Rendering Logic
    const leftPart = currentFrame ? currentFrame.word.substring(0, currentFrame.orp_index) : "";
    const orpChar = currentFrame ? currentFrame.word[currentFrame.orp_index] : "";
    const rightPart = currentFrame ? currentFrame.word.substring(currentFrame.orp_index + 1) : "";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col font-mono select-none"
        >
            {/* HUD OVERLAY LAYERS */}
            {/* 1. Vignette: Darken corners heavily */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] z-0 pointer-events-none" />

            {/* 2. Scanlines: CSS Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20" />

            {/* Top Bar: Progress & Exit */}
            <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20 pt-4">
                <div className="flex items-center gap-4 text-xs font-bold text-redshift-red uppercase tracking-widest bg-black/50 backdrop-blur border border-redshift-red/20 px-4 py-2 rounded">
                    <span className="animate-pulse">● LIVE</span>
                    <span className="text-white">{wpmConfig} WPM</span>
                    <span>{currentIndex + 1} / {frames.length}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onExit} className="hover:text-redshift-red hover:bg-black/50 text-gray-400">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Progress Line - HUD Style */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-900/50 z-20">
                <motion.div
                    className="h-full bg-redshift-red shadow-[0_0_10px_#FF3131]"
                    style={{ width: `${(progress) * 100}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
            </div>

            {/* Main Canvas (Centered) */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">

                {/* Focus Reticle (Decorative HUD Elements) */}
                <div className="absolute w-[80vw] max-w-[800px] h-32 border-x border-redshift-red/20 opacity-50 pointer-events-none flex justify-between items-end pb-2">
                    <span className="text-[10px] text-redshift-red/50 pl-2">TARGET_LOCK</span>
                    <span className="text-[10px] text-redshift-red/50 pr-2">ORP_ALIGNED</span>
                </div>

                {/* The WORD */}
                <div className="relative flex items-end text-5xl md:text-7xl lg:text-9xl leading-none filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    {/* Left Side */}
                    <span className="text-white text-right w-[45vw] lg:w-[450px] font-medium tracking-tight opacity-80">
                        {leftPart}
                    </span>

                    {/* The ORP */}
                    <span className="text-redshift-red font-bold mx-1 relative drop-shadow-[0_0_15px_rgba(255,49,49,0.8)]">
                        {orpChar}
                    </span>

                    {/* Right Side */}
                    <span className="text-white text-left w-[45vw] lg:w-[450px] font-medium tracking-tight opacity-80">
                        {rightPart}
                    </span>

                    {/* Center Axis HUD Line */}
                    <div className="absolute -top-10 -bottom-10 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-redshift-red/30 to-transparent" />
                </div>
            </div>

            {/* Control Bar (Bottom) */}
            <div className="h-40 mb-0 flex items-center justify-center gap-8 md:gap-16 pb-12 bg-gradient-to-t from-black to-transparent z-20 relative">
                {/* Decorative Tech Lines */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-redshift-red/20" />

                <Button variant="ghost" size="icon" onClick={() => onSeek(false)} className="hover:bg-redshift-red/10 rounded-full w-16 h-16">
                    <ChevronLeft className="w-10 h-10 text-white/70" />
                </Button>

                <Button
                    variant={isPlaying ? "outline" : "destructive"}
                    className={cn(
                        "w-24 h-24 rounded-full border-2 shadow-[0_0_30px_rgba(255,49,49,0.2)]",
                        isPlaying ? "border-redshift-red text-redshift-red bg-black/50" : "border-transparent"
                    )}
                    onClick={onTogglePlay}
                >
                    {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                </Button>

                <Button variant="ghost" size="icon" onClick={() => onSeek(true)} className="hover:bg-redshift-red/10 rounded-full w-16 h-16">
                    <ChevronRight className="w-10 h-10 text-white/70" />
                </Button>

                <Button variant="ghost" size="icon" onClick={onRestart} className="absolute right-8 md:right-12 bottom-12 text-gray-500 hover:text-white">
                    <RotateCcw className="w-6 h-6" />
                </Button>
            </div>

            {/* Paused Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="w-full h-full bg-black/20 backdrop-blur-sm absolute" />
                    <div className="text-[12vw] font-black text-white/10 uppercase tracking-[0.2em] relative">
                        PAUSED
                    </div>
                </div>
            )}
        </motion.div>
    );
}
