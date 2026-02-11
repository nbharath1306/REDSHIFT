import { pipeline } from '@xenova/transformers';

class LLMService {
    private generator: any = null;
    private isLoading: boolean = false;

    // We use LaMini-Flan-T5-78M for a good balance of speed vs quality in browser
    private MODEL_NAME = 'Xenova/LaMini-Flan-T5-78M';

    async init() {
        if (this.generator) return;

        this.isLoading = true;
        try {
            console.log("Loading LLM...");
            this.generator = await pipeline('text2text-generation', this.MODEL_NAME);
            console.log("LLM Loaded.");
        } catch (err) {
            console.error("Failed to load LLM:", err);
        } finally {
            this.isLoading = false;
        }
    }

    async summarize(text: string): Promise<string> {
        if (!this.generator) await this.init();

        const prompt = `Summarize this heavily: ${text}`;

        try {
            const output = await this.generator(prompt, {
                max_new_tokens: 100,
                temperature: 0.7,
                repetition_penalty: 1.2
            });
            return output[0].generated_text;
        } catch (err) {
            return "Failed to generate summary.";
        }
    }

    async generateQuiz(text: string): Promise<{ question: string, answer: string }> {
        if (!this.generator) await this.init();

        // 1. Generate Question
        const qPrompt = `Generate a single challenging question about this text: ${text}`;
        const qOutput = await this.generator(qPrompt, { max_new_tokens: 50 });
        const question = qOutput[0].generated_text;

        // 2. Generate Answer
        const aPrompt = `Answer this question based on the text: ${question} \n Text: ${text}`;
        const aOutput = await this.generator(aPrompt, { max_new_tokens: 50 });
        const answer = aOutput[0].generated_text;

        return { question, answer };
    }
}

export const llm = new LLMService();
