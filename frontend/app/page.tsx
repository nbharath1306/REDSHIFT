"use client";

import { useState } from "react";
import ReaderCanvas from "@/components/ReaderCanvas";

export default function Home() {
  const [text, setText] = useState("");
  const [frames, setFrames] = useState<any[]>([]);
  const [reading, setReading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleIngest = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      // Connect to the local Django backend (ensure it's running on :8000)
      const res = await fetch("http://localhost:8000/api/ingest/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, wpm: 600 }),
      });
      const data = await res.json();
      if (data.frames) {
        setFrames(data.frames);
        setReading(true);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Failed to ingest text:", err);
      alert("Error connecting to backend API. Is Django running? (localhost:8000)");
    } finally {
      setLoading(false);
    }
  };

  const resetReader = () => {
    setReading(false);
    setIsPlaying(false);
    setFrames([]);
  };

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!reading) return;
    if (e.code === "Space") {
      e.preventDefault();
      setIsPlaying(!isPlaying);
    }
    if (e.code === "Escape") {
      resetReader();
    }
  };

  return (
    <div
      className="min-h-screen font-[family-name:var(--font-geist-sans)] flex flex-col items-center justify-center p-8 transition-colors duration-500"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      autoFocus
    >
      {!reading ? (
        <main className="flex flex-col gap-8 max-w-2xl w-full text-center">
          <h1 className="text-5xl font-bold tracking-tighter">
            RED<span className="text-red-500">SHIFT</span>
          </h1>
          <p className="text-gray-400">
            Cognitive Acceleration Engine. Paste your text below.
          </p>

          <textarea
            className="w-full h-64 bg-gray-900 border border-gray-800 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-red-500 transition-colors"
            placeholder="Paste text here to begin streaming..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button
            onClick={handleIngest}
            disabled={loading || !text}
            className="bg-white text-black font-bold py-4 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "PROCESSING..." : "INITIALIZE STREAM"}
          </button>
        </main>
      ) : (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="absolute top-4 right-4 z-10 flex gap-4">
            <button onClick={() => setIsPlaying(!isPlaying)} className="text-white text-sm hover:text-red-500 uppercase cursor-pointer">
              {isPlaying ? "Pause [Space]" : "Resume [Space]"}
            </button>
            <button onClick={resetReader} className="text-white text-sm hover:text-gray-400 uppercase cursor-pointer">
              Exit [Esc]
            </button>
          </div>

          <ReaderCanvas
            frames={frames}
            isPlaying={isPlaying}
            onComplete={() => setIsPlaying(false)}
          />
        </div>
      )}
    </div>
  );
}
