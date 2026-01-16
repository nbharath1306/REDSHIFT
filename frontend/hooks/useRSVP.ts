import { useState, useEffect, useRef } from "react";

interface RSVPHookProps {
  text: string;
  wpm: number;
  isPlaying: boolean;
  onComplete?: () => void;
}

const calculateORP = (word: string): number => {
  const len = word.length;
  // Scientific "Optimal Recognition Point" Algorithm
  // The eye lands best slightly left of center.
  if (len <= 1) return 0;   // "A" (center)
  if (len <= 4) return 1;   // "THE" (1st/2nd char)
  if (len <= 9) return 2;   // "POWER" (3rd char)
  if (len <= 13) return 3;  // "UNIVERSAL" (4th char)
  if (len <= 18) return 4;  // "INTERNATIONAL" (5th char)
  return 5;                 // "ANTIDISESTABLISHMENT..." (6th char) - Caps here to keep foveal anchor
};

export const useRSVP = ({ text, wpm, isPlaying, onComplete }: RSVPHookProps) => {
  const [index, setIndex] = useState(0);
  const words = useRef<string[]>([]);

  // Timing State
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  // Split text into words only when text changes
  useEffect(() => {
    words.current = text.split(/\s+/).filter((w) => w.length > 0);
    setIndex(0);
    accumulatedTimeRef.current = 0;
  }, [text]);

  const getDelay = (word: string) => {
    let baseDelay = 60000 / wpm;

    // Pacing Heuristics
    if (word.length > 8) baseDelay *= 1.3;
    if (/[,.!?;:]$/.test(word)) baseDelay *= 2.0;
    if (/\d/.test(word) || /^[A-Z]/.test(word)) baseDelay *= 1.1;

    return baseDelay;
  };

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = 0;
      cancelAnimationFrame(requestRef.current);
      return;
    }

    // Logic: 
    // We start a loop. Inside the loop, we calculate delta time.
    // We add to accumulator.
    // If accumulator > delay, we advance index and subtract delay.

    requestRef.current = requestAnimationFrame((time) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;

      const loop = (t: number) => {
        const delta = t - lastTimeRef.current;
        lastTimeRef.current = t;
        accumulatedTimeRef.current += delta;

        const currentWord = words.current[index] || "";
        const delay = getDelay(currentWord);

        if (accumulatedTimeRef.current >= delay) {
          // Time to move to next word
          setIndex(prev => {
            const next = prev + 1;
            // Check boundary
            if (next >= words.current.length) {
              if (onComplete) onComplete();
              return prev;
            }
            return next;
          });
          accumulatedTimeRef.current -= delay;
        } else {
          // Not enough time, keep looping
          requestRef.current = requestAnimationFrame(loop);
        }
      };
      // Start the inner loop
      requestRef.current = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, index, wpm]); // Dependency on index ensures fresh closure for 'index' reading if needed, though we use setIndex(prev).
  // Actually, if we depend on index, the loop restarts every word.
  // This is good because it ensures we are always "fresh" and 'index' in scope is correct-ish (though we rely on prev).
  // The accumulatedTimeRef handles the continuity.

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
