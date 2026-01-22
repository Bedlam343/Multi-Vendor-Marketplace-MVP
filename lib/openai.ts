import "server-only";

import OpenAI from "openai";

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateEmbedding = async (text: string) => {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small", // cost/performance optimized model
        input: text.replace(/\n/g, " "), // Clean text for better results
    });

    return response.data[0].embedding;
};
