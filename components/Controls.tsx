"use client";

import React from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface ControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  wpm: number;
  onWpmChange: (val: number) => void;
  progress: number;
  onSeek: (val: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onTogglePlay,
  wpm,
  onWpmChange,
  progress,
  onSeek,
}) => {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl transition-opacity duration-300 hover:opacity-100 opacity-20 hover:opacity-100 focus-within:opacity-100 group">
      <div className="flex flex-col gap-4">
        {/* Progress Bar */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500 hover:h-2 transition-all"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onTogglePlay}
              className="p-3 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors"
            >
              {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
            </button>
            <div className="text-zinc-400 font-mono text-sm">
                {Math.round(progress * 100)}%
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end">
            <span className="text-zinc-400 font-mono text-sm min-w-[4rem] text-right">
              {wpm} WPM
            </span>
            <input
              type="range"
              min={200}
              max={1000}
              step={10}
              value={wpm}
              onChange={(e) => onWpmChange(parseInt(e.target.value))}
              className="w-40 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>
      </div>
      
      {/* Keyboard Hint */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-zinc-500 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Press [Space] to Play/Pause • [←/→] to Scrub
      </div>
    </div>
  );
};
