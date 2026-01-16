import { NextResponse } from 'next/server';

type Frame = {
    word: string;
    orp_index: number;
    duration_ms: number;
    is_red: boolean;
};

// ORP Algorithm: Find the "Optical Recognition Point"
function calculateOrpIndex(word: string): number {
    const length = word.length;
    if (length <= 1) return 0;
    if (length === 2) return 0; // 'at' -> 'a'
    if (length === 3) return 1; // 'the' -> 'h'
    if (length === 4) return 1; // 'with' -> 'i'
    return Math.ceil(length * 0.35) - 1;
}

// Heuristic-based text processor (No heavy NLP lib needed for MVP)
function processText(text: string, wpm: number): Frame[] {
    const baseMs = 60000 / wpm; // e.g., 60000 / 600 = 100ms

    // Split by whitespace but keep integrity. 
    // We want to handle "Word." as "Word" + "." logic
    // Simple regex split for now
    const rawTokens = text.split(/\s+/).filter(t => t.length > 0);

    const frames: Frame[] = [];

    rawTokens.forEach((token) => {
        let duration = baseMs;
        const word = token;

        // 1. Length Heuristics
        if (word.length > 7) duration *= 1.2;
        if (word.length > 12) duration *= 1.4;

        // 2. Stop words heuristic (Simple list)
        const stopWords = new Set(['a', 'an', 'the', 'is', 'it', 'in', 'on', 'to', 'of', 'and']);
        if (stopWords.has(word.toLowerCase().replace(/[^a-z]/g, ''))) {
            duration *= 0.7;
        }

        // 3. Punctuation Pauses
        if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
            duration += 300; // Sentence break
        } else if (word.endsWith(',') || word.endsWith(';') || word.endsWith(':')) {
            duration += 150; // Clause break
        }

        // 4. Proper Nouns (Capitalized first letter, not start of sentence? Hard to know without context)
        // Simple check: If it has a capital letter inside or starts with one and is longish
        if (/^[A-Z]/.test(word) && word.length > 4) {
            duration *= 1.2;
        }

        frames.push({
            word: word,
            orp_index: calculateOrpIndex(word),
            duration_ms: Math.round(duration),
            is_red: true,
        });
    });

    return frames;
}

export async function POST(request: Request) {
    try {
        const { text, wpm } = await request.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const frames = processText(text, Number(wpm) || 600);

        return NextResponse.json({ frames, total_words: frames.length });
    } catch (error) {
        console.error("Ingest error:", error);
        return NextResponse.json({ error: "Failed to process text" }, { status: 500 });
    }
}
