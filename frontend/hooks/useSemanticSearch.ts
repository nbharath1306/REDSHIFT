import { useState, useCallback } from 'react';
import { db, KnowledgeNode } from '@/lib/db';
import { generateEmbedding, cosineSimilarity } from '@/lib/ai-service';

export const useSemanticSearch = () => {
    const [results, setResults] = useState<{ node: KnowledgeNode, score: number }[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const search = useCallback(async (query: string) => {
        setIsSearching(true);
        try {
            // 1. Generate embedding for query
            const queryVector = await generateEmbedding(query);

            // 2. Fetch all knowledge nodes (In production, use Dexie index or better vector store)
            // For MVP with <1000 nodes, full scan depends on browser speed, but is usually fast enough for a demo.
            const allNodes = await db.knowledge.toArray();

            // 3. Compute Similarity
            const scored = allNodes.map(node => {
                if (!node.embedding) return { node, score: -1 };
                return {
                    node,
                    score: cosineSimilarity(queryVector, Array.from(node.embedding))
                };
            });

            // 4. Sort and Filter
            const topResults = scored
                .filter(item => item.score > 0.4) // Threshold
                .sort((a, b) => b.score - a.score)
                .slice(0, 5); // Top 5

            setResults(topResults);
        } catch (error) {
            console.error("Semantic search failed:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    return { search, results, isSearching };
};
