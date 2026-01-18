// src/app/api/llm/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Zod Schema for Request Validation
const ExecuteRequestSchema = z.object({
    model: z.enum([
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-2.5-flash'
    ]),
    prompt: z.string(), // Removed .min(1) to allow empty when images/systemPrompt exist
    systemPrompt: z.string().optional(),
    imageUrls: z.array(z.string()).optional().default([]),
    temperature: z.number().min(0).max(2).optional().default(0.7),
});

// Type inference from Zod schema
type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;

export async function POST(req: NextRequest) {
    try {
        // Parse and validate request body
        const body = await req.json();
        const validated = ExecuteRequestSchema.parse(body);

        // Custom validation: At least one input must be provided
        const hasPrompt = validated.prompt && validated.prompt.trim().length > 0;
        const hasSystemPrompt = validated.systemPrompt && validated.systemPrompt.trim().length > 0;
        const hasImages = validated.imageUrls && validated.imageUrls.length > 0;

        if (!hasPrompt && !hasSystemPrompt && !hasImages) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'At least one input required: prompt, system prompt, or images'
                },
                { status: 400 }
            );
        }

        // Generate content using Gemini with retry logic
        const result = await executeGeminiWithRetry(validated, 3);

        if (!result.success) {
            // Return appropriate status code based on error type (503 for overloaded, 429 for rate limit, 500 for other errors)
            const statusCode = result.error?.includes('overloaded') || result.error?.includes('503')
                ? 503
                : result.error?.includes('rate limit') || result.error?.includes('429')
                    ? 429
                    : 500;

            return NextResponse.json(
                { success: false, error: result.error },
                { status: statusCode }
            );
        }

        return NextResponse.json({
            success: true,
            text: result.text,
        });

    } catch (error) {
        // Handle Zod validation errors (invalid request data)
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request data',
                    issues: error.issues.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
                { status: 400 }
            );
        }

        // Handle other errors (unknown error)
        console.error("API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

// Helper function with retry logic (3 attempts with exponential backoff)
async function executeGeminiWithRetry(request: ExecuteRequest, maxRetries: number = 3) {
    let lastError: string = "";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await executeGemini(request);

            if (result.success) {
                return result;
            }

            lastError = result.error || "Unknown error";

            // If it's a 503 (overloaded) or 429 (rate limit), retry with exponential backoff (max 5s delay between attempts)
            if (lastError.includes('overloaded') || lastError.includes('503') || lastError.includes('rate limit') || lastError.includes('429')) {
                if (attempt < maxRetries) {
                    const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
                    console.log(`Retry attempt ${attempt}/${maxRetries} after ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
            }

            // For other errors, don't retry (don't want to retry indefinitely)     (some errors are transient and will resolve themselves)
            return result;

        } catch (error) {
            lastError = error instanceof Error ? error.message : "Unknown error";

            // If we get an error, log it and wait for the next attempt
            if (attempt < maxRetries) {
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s delay between attempts
                console.log(`Retry attempt ${attempt}/${maxRetries} after ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    // If we've tried all retries and still failed, return the last error
    return {
        success: false,
        error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
    };
}

// Helper function to execute Gemini API call
async function executeGemini(request: ExecuteRequest) {
    try {
        const geminiModel = genAI.getGenerativeModel({
            model: request.model,
            generationConfig: {
                temperature: request.temperature,
            }
        });

        // Build the final prompt
        let finalPrompt = request.prompt?.trim() || "";

        // If there's a system prompt, use it
        if (request.systemPrompt?.trim()) {
            if (finalPrompt) {
                finalPrompt = `${request.systemPrompt.trim()}\n\n${finalPrompt}`;
            } else {
                // Only system prompt, no user prompt
                finalPrompt = request.systemPrompt.trim();
            }
        }

        // If no prompt at all but there are images, add a default
        if (!finalPrompt && request.imageUrls && request.imageUrls.length > 0) {
            finalPrompt = "Describe and analyze these images in detail.";
        }

        // Handle images if provided (if there are images, we need to add them to the prompt)   (images are base64 encoded strings) 
        if (request.imageUrls && request.imageUrls.length > 0) {
            const imageParts = request.imageUrls.map((base64String) => {
                const base64Data = base64String.split(',')[1] || base64String;
                const mimeMatch = base64String.match(/data:(.*?);base64/);
                const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

                return {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType,
                    },
                };
            });

            const parts = [{ text: finalPrompt }, ...imageParts];
            const result = await geminiModel.generateContent(parts);
            const response = await result.response;

            return { success: true, text: response.text() };
        } else {
            // Text-only generation
            const result = await geminiModel.generateContent(finalPrompt);
            const response = await result.response;

            return { success: true, text: response.text() };
        }
    } catch (error: unknown) {
        console.error("Gemini API Error:", error);

        // Extract more detailed error information
        let errorMessage = "Unknown error occurred during generation";

        if (error instanceof Error) {
            errorMessage = error.message;

            // Parse specific error types from Google's error messages
            if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
                errorMessage = "The AI model is currently overloaded. Please try again in a few moments.";
            } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                errorMessage = "Rate limit exceeded. Please wait before trying again.";
            } else if (errorMessage.includes('quota')) {
                errorMessage = "API quota exceeded. Please check your Gemini API quota.";
            } else if (errorMessage.includes('invalid') || errorMessage.includes('API key')) {
                errorMessage = "Invalid API key. Please check your Gemini API configuration.";
            }
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}