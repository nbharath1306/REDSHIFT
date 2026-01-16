import { useState, useEffect, useCallback, useRef } from "react";

interface RSVPHookProps {
  text: string;
  wpm: number;
  isPlaying: boolean;
  onComplete?: () => void;
}

export const useRSVP = ({ text, wpm, isPlaying, onComplete }: RSVPHookProps) => {
  const [index, setIndex] = useState(0);
  const words = useRef<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Split text into words only when text changes
  useEffect(() => {
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

    // Determine current word to calculate delay for the *next* word
    // Actually, the delay determines how long the CURRENT word stays on screen.
    const currentWord = words.current[index] || "";
    
    let baseDelay = 60000 / wpm;
    
    // Logic: Delay modifications based on the *current* word being displayed
    // If current word is long or has punctuation, we wait LONGER before moving to next.
    
    if (currentWord.length > 8) {
        baseDelay *= 1.2;
    }

    if (/[,.!?;:]$/.test(currentWord)) {
        baseDelay *= 2.0; // Punctuation pause
    }

    timerRef.current = setTimeout(() => {
      processTick();
    }, baseDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, index, wpm, processTick]);

  const currentWord = words.current[index] || "";
  const progress = words.current.length > 0 ? index / words.current.length : 0;
  const totalWords = words.current.length;

  return {
    currentWord,
    words: words.current, // Expose full list for peripheral view
    index,
    setIndex,
    progress,
    totalWords,
  };
};
