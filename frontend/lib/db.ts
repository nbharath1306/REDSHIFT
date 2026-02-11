import Dexie, { type EntityTable } from 'dexie';

// --- Interfaces ---

export interface Book {
    id: string; // UUID
    title: string;
    author: string;
    sourceType: 'pdf' | 'epub' | 'url' | 'text';
    content: string; // The full text (or chunked references in future)
    addedAt: number; // Timestamp
    coverUrl?: string;
    wordCount: number;
}

export interface Progress {
    bookId: string;
    currentWordIndex: number;
    totalWords: number;
    wpm: number;
    lastReadAt: number;
    completionPercentage: number;
}

export interface KnowledgeNode {
    id: string;
    concept: string; // e.g., "Stoicism" or "React Hooks"
    embedding?: number[]; // Vector (Float32Array) for AI search
    sourceBookIds: string[]; // Books that mention this
    snippet: string; // The context paragraph
    createdAt: number;
}

export interface Session {
    id: string; // UUID
    bookId: string;
    startTime: number;
    endTime: number;
    durationSeconds: number; // Active reading time
    wordsRead: number;
    averageWpm: number;
}

// --- Database Class ---

const db = new Dexie('RedshiftVault') as Dexie & {
    books: EntityTable<Book, 'id'>,
    progress: EntityTable<Progress, 'bookId'>,
    knowledge: EntityTable<KnowledgeNode, 'id'>,
    sessions: EntityTable<Session, 'id'>
};

// --- Schema Definition ---
db.version(2).stores({
    books: 'id, title, author, addedAt',
    progress: 'bookId, lastReadAt',
    knowledge: 'id, concept, *sourceBookIds',
    sessions: 'id, bookId, startTime, endTime' // Indexed for stats
});

export { db };
