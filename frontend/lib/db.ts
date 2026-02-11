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

// --- Database Class ---

const db = new Dexie('RedshiftVault') as Dexie & {
    books: EntityTable<Book, 'id'>,
    progress: EntityTable<Progress, 'bookId'>,
    knowledge: EntityTable<KnowledgeNode, 'id'>
};

// --- Schema Definition ---
db.version(1).stores({
    books: 'id, title, author, addedAt', // Indexed inputs
    progress: 'bookId, lastReadAt',
    knowledge: 'id, concept, *sourceBookIds' // Multi-index for search
});

export { db };
