"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, PlayCircle, Settings2, Upload, FileText, Library } from "lucide-react";
import { useRSVP } from "@/hooks/useRSVP"; // Patched with ORP
import ReaderCanvas from "@/components/ReaderCanvas"; // Redshift HUD
import WarpBackground from "@/components/WarpBackground"; // Redshift Warp
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { extractTextFromPdf } from "@/lib/pdf-utils"; // Cogniread Feature
import { DEMO_CONTENT } from "@/lib/demo-content"; // Preview Feature
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

import { ReaderSettings } from "@/components/ReaderSettings"; // Import Type
import { StreakHUD } from "@/components/StreakHUD";
import { LevelUpModal } from "@/components/LevelUpModal";
import { useRef } from "react";

function ReaderContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId");

  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(600);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load Book from Vault if ID present
  useEffect(() => {
    if (bookId) {
      setIsLoading(true);
      db.books.get(bookId).then(book => {
        if (book) {
          setText(book.content);
          setIsReaderOpen(true);
          // Also load progress if exists
          db.progress.get(bookId).then(p => {
            // TODO: Restore position if needed
          });
        }
      }).catch(err => console.error("Failed to load book:", err))
        .finally(() => setIsLoading(false));
    }
  }, [bookId]);

  // Global Reader Settings Persistence
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>({
    fontSize: 6,
    guideAxis: 'horizontal',
    guideOpacity: 0.5,
    zenMode: true,
    soundEnabled: true
  });

  // New State for Source Modes
  const [sourceMode, setSourceMode] = useState<"text" | "file" | "url">("text");
  const [fileName, setFileName] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // Hook handles Logic + ORP Calculation
  const { currentWord, orpIndex, progress, totalWords, index, setIndex } = useRSVP({
    text,
    wpm,
    isPlaying: isPlaying && isReaderOpen,
    onComplete: () => setIsPlaying(false),
  });

  // Derived Control Handlers (Mapping to Redshift Props)
  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const closeReader = useCallback(() => {
    setIsPlaying(false);
    setIsReaderOpen(false);
  }, []);
  const restartReader = useCallback(() => {
    setIndex(0);
    setIsPlaying(true);
  }, [setIndex]);
  const seekReader = useCallback((forward: boolean) => {
    setIsPlaying(false);
    setIndex((prev) => Math.max(0, Math.min(totalWords - 1, prev + (forward ? 1 : -1))));
  }, [setIndex, totalWords]);

  // Handle URL Scrape
  const handleUrlScrape = async () => {
    if (!urlInput) return;
    setIsLoadingUrl(true);
    try {
      // Use API Route instead of Server Action
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput })
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        console.error("Scrape failed:", result);
        throw new Error(result.error + (result.details ? `\nDetails: ${result.details}` : "") || "Failed to scrape URL");
      }

      setText(result.data.content || "");
      setFileName(result.data.title || "Scraped Article");
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message || "Failed to load URL"}`);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Handle File Upload (Cogniread Logic)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      setIsLoading(true);
      try {
        const extracted = await extractTextFromPdf(file);
        setText(extracted);
        setFileName(file.name);
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
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  // Level Up State
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [newRank, setNewRank] = useState("");
  const initialLevelRef = useRef<number | null>(null);

  // Check initial level on mount
  useEffect(() => {
    import("@/lib/gamification").then(({ getGamificationStats }) => {
      getGamificationStats().then(stats => {
        initialLevelRef.current = stats.level;
      });
    });
  }, []);

  // Check for Level Up when session ends (isPlaying goes to false)
  useEffect(() => {
    if (!isPlaying && initialLevelRef.current !== null) {
      import("@/lib/gamification").then(({ getGamificationStats }) => {
        setTimeout(() => { // Slight delay to ensure DB write
          getGamificationStats().then(stats => {
            if (stats.level > initialLevelRef.current!) {
              setNewLevel(stats.level);
              setNewRank(stats.rank);
              setShowLevelUp(true);
              initialLevelRef.current = stats.level; // Update ref
            }
          });
        }, 1000);
      });
    }
  }, [isPlaying]);

  const handleIngest = () => {
    if (!text.trim()) return;
    setIsReaderOpen(true);
    setIsPlaying(true);
    setIndex(0);
  };

  // Keyboard Shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isReaderOpen) {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.code === "ArrowLeft") seekReader(false);
      if (e.code === "ArrowRight") seekReader(true);
      if (e.code === "Escape") closeReader();
    }
  };

  // Dynamic Warp Speed Logic
  const warpSpeed = isReaderOpen && isPlaying ? (wpm / 100) : 0.2;

  return (
    <div
      className="min-h-screen bg-black text-white selection:bg-redshift-red selection:text-white font-[family-name:var(--font-space-grotesk)] overflow-hidden relative"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <WarpBackground speed={warpSpeed} />

      <AnimatePresence mode="wait">
        {isReaderOpen ? (
          <ReaderCanvas
            key="reader"
            currentWord={currentWord}
            orpIndex={orpIndex}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onExit={closeReader}
            onRestart={restartReader}
            onSeek={seekReader}
            progress={progress}
            wpmConfig={wpm}
            totalWords={totalWords}
            currentIndex={index}
            settings={readerSettings}
            onSettingsChange={setReaderSettings}
            fullText={text}
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

              // ... inside Header ...
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

              <div className="hidden md:block">
                <StreakHUD />
              </div>

              {/* Library Link */}
              <Link href="/library" className="group flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full hover:bg-white/10 border border-white/5 hover:border-redshift-red/50 transition-all">
                <Library className="w-4 h-4 text-gray-400 group-hover:text-redshift-red" />
                <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-white uppercase tracking-widest">Open Vault</span>
              </Link>

              <div className="flex gap-12 text-xs text-gray-500 font-mono uppercase tracking-widest hidden md:flex">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold">ORP</span>
                  <span>Technology</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold">PDF</span>
                  <span>Ingestion</span>
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
                  <div className="flex gap-4">
                    <label className="text-[10px] uppercase tracking-widest text-gray-600 hover:text-redshift-red transition-colors cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      [ Upload PDF/TXT ]
                      <input type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.pdf" />
                    </label>
                    <button
                      onClick={() => setText("")}
                      className="text-[10px] uppercase tracking-widest text-gray-600 hover:text-redshift-red transition-colors"
                    >
                      [ Clear Buffer ]
                    </button>
                  </div>
                </div>

                {/* Source Toggles */}
                <div className="flex justify-center gap-4 bg-black/40 p-1.5 rounded-lg border border-white/5 w-fit mx-auto">
                  <button
                    onClick={() => setSourceMode("text")}
                    className={clsx(
                      "px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                      sourceMode === "text" ? "bg-redshift-red text-black shadow-[0_0_15px_rgba(255,49,49,0.4)]" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    Text Input
                  </button>
                  <button
                    onClick={() => setSourceMode("file")}
                    className={clsx(
                      "px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                      sourceMode === "file" ? "bg-redshift-red text-black shadow-[0_0_15px_rgba(255,49,49,0.4)]" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    File Upload
                  </button>
                  <button
                    onClick={() => setSourceMode("url")}
                    className={clsx(
                      "px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                      sourceMode === "url" ? "bg-redshift-red text-black shadow-[0_0_15px_rgba(255,49,49,0.4)]" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    URL Extract
                  </button>
                </div>

                {/* Input Area */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-redshift-red/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

                  {sourceMode === "text" && (
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="PASTE TEXT SEQUENCE HERE..."
                      className="relative w-full h-[500px] bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-8 text-gray-300 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-redshift-red/50 focus:ring-1 focus:ring-redshift-red/50 transition-all placeholder:text-gray-800 shadow-xl"
                    />
                  )}

                  {sourceMode === "file" && (
                    <div className="relative w-full h-[500px] bg-black/40 backdrop-blur-md border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-4 hover:border-redshift-red/50 transition-colors group/file">
                      <Upload className="w-8 h-8 text-zinc-600 group-hover/file:text-redshift-red transition-colors" />
                      <div className="text-center">
                        <p className="text-zinc-400 font-mono text-sm">Drop PDF or TXT file</p>
                        <p className="text-zinc-700 text-xs mt-1">(Max 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept=".txt,.pdf"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {fileName && (
                        <div className="absolute bottom-4 bg-redshift-red/10 px-3 py-1 rounded-full border border-redshift-red/20 text-redshift-red text-xs font-mono">
                          {fileName}
                        </div>
                      )}
                    </div>
                  )}

                  {sourceMode === "url" && (
                    <div className="relative w-full h-[500px] bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-8 flex flex-col items-center justify-center gap-4">
                      <div className="w-full max-w-md space-y-4">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://example.com/article"
                          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-redshift-red transition-colors font-mono text-sm"
                        />
                        <button
                          onClick={handleUrlScrape}
                          disabled={isLoadingUrl || !urlInput}
                          className="w-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-3 rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2"
                        >
                          {isLoadingUrl ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              EXTRACTING...
                            </>
                          ) : (
                            "LOAD CONTENT"
                          )}
                        </button>
                      </div>
                      {fileName && sourceMode === 'url' && (
                        <div className="bg-redshift-red/10 px-3 py-1 rounded-full border border-redshift-red/20 text-redshift-red text-xs font-mono max-w-[90%] truncate">
                          LOADED: {fileName}
                        </div>
                      )}
                    </div>
                  )}

                  {(isLoading || isLoadingUrl) && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm rounded-lg">
                      <div className="flex flex-col items-center gap-2 text-redshift-red animate-pulse">
                        <FileText className="w-8 h-8" />
                        <span className="text-xs font-mono uppercase tracking-widest">Processing Data Stream...</span>
                      </div>
                    </div>
                  )}
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
                  disabled={!text || isLoading}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] pointer-events-none" />

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-6 h-6 fill-black text-redshift-red group-hover:scale-110 transition-transform" />
                      <span>ENGAGE</span>
                    </div>
                    <span className="text-[10px] opacity-50 font-mono font-normal">INITIATE SEQUENCE</span>
                  </div>
                </Button>

                <p className="text-[10px] text-center text-gray-700 font-mono uppercase tracking-widest flex items-center justify-center gap-4">
                  <span>System Ready // Awaiting Input</span>
                  <span className="text-gray-800">|</span>
                  <button
                    onClick={() => {
                      import("@/lib/demo-content").then(({ DEMO_CONTENT }) => {
                        setText(DEMO_CONTENT);
                        setTimeout(() => handleIngest(), 100);
                      });
                    }}
                    className="hover:text-redshift-red transition-colors cursor-pointer"
                  >
                    [ INITIATE DEMO PROTOCOL ]
                  </button>
                </p>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
      <LevelUpModal
        show={showLevelUp}
        level={newLevel}
        rank={newRank}
        onClose={() => setShowLevelUp(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen text-white flex items-center justify-center font-mono">INITIALIZING NEURAL INTERFACE...</div>}>
      <ReaderContent />
    </Suspense>
  );
}
