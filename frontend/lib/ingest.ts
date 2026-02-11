import { db, Book, KnowledgeNode } from './db';
import { generateEmbedding } from './ai-service';
import { v4 as uuidv4 } from 'uuid';

/**
 * The Digestive System: Turns raw text into biological intelligence.
 */
export class IngestionService {

    // 1. Process Book
    static async processBook(file: File, title: string, author: string, addToKnowledgeGraph: boolean = true) {
        // Placeholder for file extraction (assume plain text for MVP or use existing pdf-utils)
        const text = await file.text(); // Simple text read for now, upgrade later

        const bookId = uuidv4();
        const timestamp = Date.now();

        // Save Book Metadata
        const book: Book = {
            id: bookId,
            title,
            author,
            sourceType: file.type.includes('pdf') ? 'pdf' : 'text',
            content: text,
            addedAt: timestamp,
            wordCount: text.split(/\s+/).length
        };

        await db.books.add(book);
        await db.progress.add({
            bookId,
            currentWordIndex: 0,
            totalWords: book.wordCount,
            wpm: 300,
            lastReadAt: timestamp,
            completionPercentage: 0
        });

        if (addToKnowledgeGraph) {
            await this.digestKnowledge(bookId, text);
        }

        return bookId;
    }

    // 2. Digest Knowledge (Chunk & Embed)
    private static async digestKnowledge(bookId: string, fullText: string) {
        // Semantic Chunking (Naive approach: Paragraphs > 50 chars)
        const chunks = fullText.split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 50 && p.length < 1000); // Filter noise

        // Process in batches to avoid locking the UI
        for (const chunk of chunks) {
            try {
                // Generate Vector
                const vector = await generateEmbedding(chunk);

                // Save Concept Node
                const node: KnowledgeNode = {
                    id: uuidv4(),
                    concept: "Extract Key Concepts with LLM later", // Future: Use LLM to extract "The OODA Loop"
                    snippet: chunk,
                    embedding: vector,
                    sourceBookIds: [bookId],
                    createdAt: Date.now()
                };

                await db.knowledge.add(node);
            } catch (e) {
                console.error("Failed to digest chunk:", e);
            }
        }
    }
}
