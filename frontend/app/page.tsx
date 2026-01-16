"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, PlayCircle, Settings2 } from "lucide-react";
import { useRSVPReader } from "@/hooks/use-rsvp-reader";
import ReaderCanvas from "@/components/ReaderCanvas";
import WarpBackground from "@/components/WarpBackground";
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

  // Dynamic Warp Speed Logic
  const warpSpeed = isReaderActive && reader.isPlaying ? (wpm / 100) : 0.2;

  return (
    <div
      className="min-h-screen bg-black text-white selection:bg-redshift-red selection:text-white font-[family-name:var(--font-space-grotesk)] overflow-hidden relative"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <WarpBackground speed={warpSpeed} />

      <AnimatePresence mode="wait">
        {isReaderActive ? (
          <ReaderCanvas
            key="reader"
            frames={frames}
            isPlaying={reader.isPlaying}
            onTogglePlay={reader.togglePlay}
            onExit={closeReader}
            onRestart={reader.restart}
            onSeek={reader.seek}
            progress={reader.progress}
            wpmConfig={wpm}
          />
        ) : (
          /* Landing Page Content */
          <motion.main
            key="landing"
            className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-12 relative z-10"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)", transition: { duration: 0.5 } }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            {/* Header */}
            <header className="flex flex-col md:flex-row gap-8 items-center justify-between border-b border-white/10 pb-8 backdrop-blur-sm bg-black/20 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-redshift-red/90 rounded flex items-center justify-center shadow-[0_0_20px_rgba(255,49,49,0.4)]">
                  <Zap className="text-black fill-current w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tighter leading-none bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                    REDSHIFT
                  </h1>
                  <p className="text-[10px] text-redshift-red tracking-[0.3em] uppercase font-bold">Cognitive Acceleration Engine</p>
                </div>
              </div>

              <div className="flex gap-12 text-xs text-gray-500 font-mono uppercase tracking-widest">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold">ORP</span>
                  <span>Technology</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold">NLP</span>
                  <span>Pacing</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold">1200+</span>
                  <span>Max WPM</span>
                </div>
              </div>
            </header>

            {/* Control Panel & Input */}
            <div className="grid md:grid-cols-[1fr_320px] gap-6">
              {/* Left: Input */}
              <div className="space-y-4 group">
                <div className="flex items-center justify-between px-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-redshift-red rounded-full animate-pulse shadow-[0_0_10px_#FF3131]" />
                    Data Input Source
                  </label>
                  <button
                    onClick={() => setText("")}
                    className="text-[10px] uppercase tracking-widest text-gray-600 hover:text-redshift-red transition-colors"
                  >
                    [ Clear Buffer ]
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-redshift-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg" />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="PASTE TEXT SEQUENCE HERE // SYSTEM WILL ANALYZE STRUCTURE..."
                    className="w-full h-[500px] bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-8 text-gray-300 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-redshift-red/50 focus:ring-1 focus:ring-redshift-red/50 transition-all placeholder:text-gray-800 shadow-xl"
                  />
                  {/* Corner Decorators */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 rounded-tl-lg" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 rounded-br-lg" />
                </div>
              </div>

              {/* Right: Settings */}
              <div className="flex flex-col gap-6">
                <div className="p-6 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg space-y-8 relative overflow-hidden">
                  {/* Scanline texture */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />

                  <div className="flex items-center gap-2 text-white font-bold pb-4 border-b border-white/10 relative z-10">
                    <Settings2 className="w-4 h-4 text-redshift-red" />
                    <span className="text-sm tracking-widest">SYSTEM_CONFIG</span>
                  </div>

                  <div className="relative z-10 space-y-8">
                    <Slider
                      label="VELOCITY (WPM)"
                      value={wpm}
                      onChange={(e) => setWpm(Number(e.target.value))}
                      min={300} max={1200} step={50}
                      valueDisplay={wpm}
                    />

                    <div className="p-4 bg-redshift-red/5 border border-redshift-red/10 rounded">
                      <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Time To Completion</div>
                      <div className="text-3xl font-bold text-white font-mono flex items-baseline gap-2">
                        {text.trim() ? Math.ceil((text.split(" ").length / wpm) * 60) : "--"}
                        <span className="text-xs text-redshift-red font-normal">SEC</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full h-24 text-xl font-bold tracking-widest shadow-[0_0_30px_rgba(255,49,49,0.2)] hover:shadow-[0_0_60px_rgba(255,49,49,0.5)] transition-all bg-redshift-red hover:bg-[#ff4444] border-none group relative overflow-hidden"
                  onClick={handleIngest}
                  disabled={!text || loading}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] pointer-events-none" />

                  {loading ? (
                    <span className="animate-pulse">INITIALIZING...</span>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="w-6 h-6 fill-black text-redshift-red group-hover:scale-110 transition-transform" />
                        <span>ENGAGE</span>
                      </div>
                      <span className="text-[10px] opacity-50 font-mono font-normal">INITIATE SEQUENCE</span>
                    </div>
                  )}
                </Button>

                <p className="text-[10px] text-center text-gray-700 font-mono uppercase tracking-widest">
                  System Ready // Awaiting Input
                </p>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
