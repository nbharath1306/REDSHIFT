"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, PlayCircle, Settings2 } from "lucide-react";
import { useRSVPReader } from "@/hooks/use-rsvp-reader";
import ReaderCanvas from "@/components/ReaderCanvas";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function Home() {
  const [text, setText] = useState("");
  const [frames, setFrames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wpm, setWpm] = useState(600);
  const [isReaderActive, setIsReaderActive] = useState(false);

  // Hook handles engine mapping
  const reader = useRSVPReader(frames);

  const handleIngest = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, wpm }),
      });
      const data = await res.json();
      if (data.frames) {
        setFrames(data.frames);
        reader.restart(); // Reset hook state
        setIsReaderActive(true);
        reader.setIsPlaying(true);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing text.");
    } finally {
      setLoading(false);
    }
  };

  const closeReader = () => {
    reader.setIsPlaying(false);
    setIsReaderActive(false);
  };

  // Keyboard Shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isReaderActive) {
      if (e.code === "Space") {
        e.preventDefault();
        reader.togglePlay();
      }
      if (e.code === "ArrowLeft") reader.seek(false);
      if (e.code === "ArrowRight") reader.seek(true);
      if (e.code === "Escape") closeReader();
    }
  };

  return (
    <div
      className="min-h-screen bg-black text-white selection:bg-redshift-red selection:text-white font-[family-name:var(--font-geist-sans)]"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <AnimatePresence>
        {isReaderActive && (
          <ReaderCanvas
            frames={frames}
            isPlaying={reader.isPlaying}
            onTogglePlay={reader.togglePlay}
            onExit={closeReader}
            onRestart={reader.restart}
            onSeek={reader.seek}
            progress={reader.progress}
            wpmConfig={wpm}
          />
        )}
      </AnimatePresence>

      {/* Landing Page Content */}
      <motion.main
        className="max-w-4xl mx-auto px-6 py-20 flex flex-col gap-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <header className="flex flex-col md:flex-row gap-8 items-center justify-between border-b border-gray-900 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-redshift-red rounded flex items-center justify-center">
              <Zap className="text-black fill-current w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter leading-none">
                RED<span className="text-redshift-red">SHIFT</span>
              </h1>
              <p className="text-xs text-gray-400 tracking-widest uppercase">Cognitive Acceleration ver 1.0</p>
            </div>
          </div>

          <div className="flex gap-8 text-sm text-gray-500 font-mono">
            <div className="flex flex-col items-center">
              <span className="text-white font-bold">ORP</span>
              <span>Technology</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-white font-bold">NLP</span>
              <span>Pacing</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-white font-bold">1200+</span>
              <span>Max WPM</span>
            </div>
          </div>
        </header>

        {/* Control Panel & Input */}
        <div className="grid md:grid-cols-[1fr_300px] gap-8">
          {/* Left: Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-redshift-red rounded-full animate-pulse" />
                Input Source
              </label>
              <button
                onClick={() => setText("")}
                className="text-xs text-gray-600 hover:text-white underline"
              >
                Clear
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here... System will automatically tokenize and analyze structure."
              className="w-full h-[400px] bg-gray-950 border border-gray-900 rounded-lg p-6 text-gray-300 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-redshift-red/50 focus:ring-1 focus:ring-redshift-red/50 transition-all placeholder:text-gray-800"
            />
          </div>

          {/* Right: Settings */}
          <div className="flex flex-col gap-6">
            <div className="p-6 bg-gray-950 border border-gray-900 rounded-lg space-y-8">
              <div className="flex items-center gap-2 text-white font-bold pb-4 border-b border-gray-900">
                <Settings2 className="w-5 h-5" />
                <span>CONFIGURATION</span>
              </div>

              <Slider
                label="Target Speed"
                value={wpm}
                onChange={(e) => setWpm(Number(e.target.value))}
                min={300} max={1200} step={50}
                valueDisplay={`${wpm} WPM`}
              />

              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-mono">Efficiency Estimate</div>
                <div className="text-2xl font-bold text-white font-mono">
                  {text.trim() ? `~${Math.ceil((text.split(" ").length / wpm) * 60)} sec` : "--"}
                </div>
              </div>
            </div>

            <Button
              size="lg"
              variant="destructive"
              className="w-full h-20 text-xl shadow-[0_0_30px_rgba(255,49,49,0.3)] hover:shadow-[0_0_50px_rgba(255,49,49,0.6)] transition-shadow"
              onClick={handleIngest}
              disabled={!text || loading}
            >
              {loading ? (
                <span className="animate-pulse">PROCESSING...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-6 h-6" />
                  INITIALIZE
                </div>
              )}
            </Button>

            <p className="text-xs text-center text-gray-700">
              By proceeding, you agree to accelerate your mind.
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
