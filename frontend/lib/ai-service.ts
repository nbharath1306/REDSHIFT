import { pipeline } from '@xenova/transformers';

// Singleton to hold the model pipeline
let embedder: any = null;

export const initEmbeddingModel = async () => {
    if (!embedder) {
        // Use a small, efficient model quantized for the browser
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
    const model = await initEmbeddingModel();
    const output = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
};

// Calculate cosine similarity for vector search
export const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};
