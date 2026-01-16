"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, BookOpen, X, Settings as SettingsIcon } from "lucide-react";
import { useRSVP } from "@/hooks/useRSVP";
import { Reader } from "@/components/Reader";
import { Controls } from "@/components/Controls";
import { SettingsMenu, AppSettings } from "@/components/Settings";
import { extractTextFromPdf } from "@/lib/pdf-utils";

export default function Home() {
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(300);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    fontSize: 5, // rem
    bgColor: "#000000",
    textColor: "#ffffff",
    focalColor: "#ef4444", // red-500
    shadowOpacity: 0.1,
    guideAxis: 'none',
    guideStyle: 'solid',
    guideColor: '#3f3f46', // zinc-700
    guideOpacity: 0.5,
  });

  // Hook handles logic
  const { currentWord, words, index, setIndex, progress, totalWords } = useRSVP({
    text,
    wpm,
    isPlaying: isPlaying && isReaderOpen,
    onComplete: () => setIsPlaying(false),
  });

  // Derived state for peripherals
  const prevWord = index > 0 ? words[index - 1] : undefined;
  const nextWord = index < totalWords - 1 ? words[index + 1] : undefined;

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Handle Scrubbing
  const handleSeek = (val: number) => {
    const newIndex = Math.floor(val * totalWords);
    setIndex(newIndex);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isReaderOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If we are inputting numbers/text in settings (rare, but good practice), ignore
      if (e.target instanceof HTMLInputElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        setIsPlaying(false);
        setIndex((prev) => Math.min(prev + 1, totalWords - 1));
      } else if (e.code === "ArrowLeft") {
        setIsPlaying(false);
        setIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.code === "Escape") {
         if (showSettings) setShowSettings(false);
         else {
             setIsReaderOpen(false);
             setIsPlaying(false);
         }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReaderOpen, togglePlay, totalWords, setIndex, showSettings]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      setIsLoading(true);
      try {
        const extracted = await extractTextFromPdf(file);
        setText(extracted);
      } catch (err) {
        alert("Failed to read PDF");
      } finally {
        setIsLoading(false);
      }
    } else {
        // Plain text
        const reader = new FileReader();
        reader.onload = (ev) => {
            setText(ev.target?.result as string);
        };
        reader.readAsText(file);
    }
  };

  const startReader = () => {
    if (!text.trim()) return;
    setIsReaderOpen(true);
    setIsPlaying(false); 
    setIndex(0);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 md:p-6 relative">
      {/* Landing Page UI */}
      {!isReaderOpen && (
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-mono font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
              CogniRead
            </h1>
            <p className="text-zinc-500 font-mono text-sm md:text-base">
              High-velocity RSVP Reader
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <textarea
              className="relative w-full h-48 md:h-64 bg-zinc-950 border border-zinc-800 rounded-lg p-4 md:p-6 font-mono text-sm md:text-base text-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none placeholder:text-zinc-700"
              placeholder="Paste text here or upload a file..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <label className="flex-1 cursor-pointer">
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.pdf" />
              <div className="h-12 md:h-14 flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white font-mono text-sm md:text-base">
                <Upload size={20} />
                {isLoading ? "Processing..." : "Upload PDF/TXT"}
              </div>
            </label>
            
            <button
              onClick={startReader}
              disabled={!text.trim()}
              className="flex-1 h-12 md:h-14 bg-white text-black font-mono font-bold rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <BookOpen size={20} />
              Start Reading
            </button>
          </div>
        </div>
      )}

      {/* Reader Overlay (Zen Mode) */}
      {isReaderOpen && (
        <div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-300"
            style={{ backgroundColor: settings.bgColor }}
        >
            {/* Top Bar */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex gap-4">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                    <SettingsIcon className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <button 
                  onClick={() => { setIsReaderOpen(false); setIsPlaying(false); }}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6 md:w-8 md:h-8" />
                </button>
            </div>

            <Reader 
                word={currentWord} 
                prevWord={prevWord}
                nextWord={nextWord}
                settings={settings}
            />

            <Controls
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                wpm={wpm}
                onWpmChange={setWpm}
                progress={progress}
                onSeek={handleSeek}
            />
            
            <SettingsMenu 
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={settings}
                onUpdate={setSettings}
            />
        </div>
      )}
    </main>
  );
}
