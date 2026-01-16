import { useState, useEffect, useCallback, useRef } from "react";

interface RSVPHookProps {
  text: string;
  wpm: number;
  isPlaying: boolean;
  onComplete?: () => void;
}

const calculateORP = (word: string): number => {
  const len = word.length;
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
};

export const useRSVP = ({ text, wpm, isPlaying, onComplete }: RSVPHookProps) => {
  const [index, setIndex] = useState(0);
  const words = useRef<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Split text into words only when text changes
  useEffect(() => {
    // Better splitting: preserving some punctuation logic if needed, but simple whitespace for now
    words.current = text.split(/\s+/).filter((w) => w.length > 0);
    setIndex(0);
  }, [text]);

  const processTick = useCallback(() => {
    setIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= words.current.length) {
        if (onComplete) onComplete();
        return prevIndex; // Stop at end
      }
      return nextIndex;
    });
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentWord = words.current[index] || "";

    // Base delay (ms per word)
    let baseDelay = 60000 / wpm;

    // Pacing Heuristics (Redshift Logic)
    if (currentWord.length > 8) {
      baseDelay *= 1.3; // Long word slowdown
    }
    if (/[,.!?;:]$/.test(currentWord)) {
      baseDelay *= 2.0; // Punctuation pause
    }
    // Numeric data or Capitalized words (light slowdown)
    if (/\d/.test(currentWord) || /^[A-Z]/.test(currentWord)) {
      baseDelay *= 1.1;
    }

    timerRef.current = setTimeout(() => {
      processTick();
    }, baseDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, index, wpm, processTick]);

  const currentWord = words.current[index] || "";
  const orpIndex = calculateORP(currentWord);

  return {
    currentWord,
    orpIndex,
    words: words.current,
    index,
    setIndex,
    progress: words.current.length > 0 ? index / words.current.length : 0,
    totalWords: words.current.length,
  };
};
