import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const aiGenerator = task({
    id: "generate-text",
    run: async (payload: { prompt: string }) => {
        console.log(` Asking Gemini: ${payload.prompt}`);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        try {
            const result = await model.generateContent(payload.prompt);
            const response = await result.response;
            const text = response.text();

            return {
                success: true,
                text: text,
            };
        } catch (error) {
            throw new Error(`Gemini API Failed: ${error}`);
        }
    },
});

export const imageProcessor = task({
    id: "process-image",
    run: async () => ({ success: true })
});