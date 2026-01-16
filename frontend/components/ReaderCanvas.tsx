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
            className="fixed inset-0 bg-redshift-black z-50 flex flex-col font-mono select-none"
        >
            {/* Top Bar: Progress & Exit */}
            <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-widest">
                    <span className="text-white">{wpmConfig} WPM</span>
                    <span>{currentIndex + 1} / {frames.length}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onExit} className="hover:text-redshift-red">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Progress Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-900">
                <motion.div
                    className="h-full bg-redshift-red"
                    style={{ width: `${(progress) * 100}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
            </div>

            {/* Main Canvas (Centered) */}
            <div className="flex-1 flex flex-col items-center justify-center relative">

                {/* Focus Reticle (Decorative) */}
                <div className="absolute w-[600px] h-32 border-x border-gray-800 opacity-20 pointer-events-none hidden md:block" />
                <div className="absolute w-64 h-24 border-y border-gray-800 opacity-20 pointer-events-none" />

                {/* The WORD */}
                <div className="relative flex items-end text-5xl md:text-7xl lg:text-8xl leading-none">
                    {/* Left Side - Align Right to push ORP to center */}
                    <span className="text-white text-right w-[45vw] lg:w-[400px] font-medium tracking-tight opacity-90">
                        {leftPart}
                    </span>

                    {/* The ORP - Absolute Center */}
                    <span className="text-redshift-red font-bold mx-0.5 relative">
                        {orpChar}
                        {/* ORP Marker (Dot below) */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-redshift-red rounded-full opacity-50" />
                    </span>

                    {/* Right Side - Align Left */}
                    <span className="text-white text-left w-[45vw] lg:w-[400px] font-medium tracking-tight opacity-90">
                        {rightPart}
                    </span>

                    {/* Center Axis (Invisible alignment helper) */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2" />
                </div>
            </div>

            {/* Control Bar (Bottom) */}
            <div className="h-32 mb-8 flex items-center justify-center gap-8 md:gap-12 pb-8">
                <Button variant="ghost" size="icon" onClick={() => onSeek(false)}>
                    <ChevronLeft className="w-8 h-8" />
                </Button>

                <Button
                    variant={isPlaying ? "outline" : "primary"}
                    className={cn("w-20 h-20 rounded-full", isPlaying ? "border-redshift-red text-redshift-red hover:bg-redshift-red/10" : "")}
                    onClick={onTogglePlay}
                >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                </Button>

                <Button variant="ghost" size="icon" onClick={() => onSeek(true)}>
                    <ChevronRight className="w-8 h-8" />
                </Button>

                <Button variant="ghost" size="icon" onClick={onRestart} className="absolute right-8 md:static">
                    <RotateCcw className="w-6 h-6 text-gray-500 hover:text-white" />
                </Button>
            </div>

            {/* Paused Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-[12rem] font-black text-white/5 uppercase tracking-widest">
                        PAUSED
                    </div>
                </div>
            )}
        </motion.div>
    );
}
