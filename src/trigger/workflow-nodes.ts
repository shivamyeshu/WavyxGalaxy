import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v2 as cloudinary } from "cloudinary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Configure Cloudinary (with validation)
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
};

export const aiGenerator = task({
    id: "generate-text",
    run: async (payload: { 
        prompt: string; 
        model?: string;
        systemPrompt?: string;
        temperature?: number;
        imageUrls?: string[];
        apiKey?: string;  // 🔑 User's API key (optional)
    }) => {
        console.log(`\n[INFO] [TASK aiGenerator] ===== STARTING =====`);
        console.log(`[INFO] [TASK aiGenerator] Prompt: ${payload.prompt.substring(0, 150)}...`);
        console.log(`[INFO] [TASK aiGenerator] Model: ${payload.model || 'gemini-1.5-flash'}`);
        console.log(`[INFO] [TASK aiGenerator] Temperature: ${payload.temperature || 0.7}`);
        console.log(`[INFO] [TASK aiGenerator] Images: ${payload.imageUrls?.length || 0}`);
        
        // Log API key info (masked for security)
        if (payload.apiKey) {
            const maskedKey = payload.apiKey.substring(0, 10) + '...' + payload.apiKey.slice(-4);
            console.log(`[INFO] [TASK aiGenerator] Using USER API key: ${maskedKey}`);
        } else if (process.env.GEMINI_API_KEY) {
            const serverKey = process.env.GEMINI_API_KEY;
            const maskedServerKey = serverKey.substring(0, 10) + '...' + serverKey.slice(-4);
            console.log(`[INFO] [TASK aiGenerator] Using SERVER API key: ${maskedServerKey}`);
        } else {
            console.log(`[ERROR] [TASK aiGenerator] NO API KEY AVAILABLE!`);
        }

        // Use the model specified in payload or default to gemini-1.5-flash
        const modelName = payload.model || "gemini-1.5-flash";
        
        // Initialize Gemini with user's API key OR server API key
        const apiKey = payload.apiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("No API key available (user or server)");
        }
        
        const genAIInstance = new GoogleGenerativeAI(apiKey);
        console.log(`[INFO] [TASK aiGenerator] Initializing Gemini model: ${modelName}`);
        const model = genAIInstance.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
                temperature: payload.temperature || 0.7,
            },
        });

        try {
            console.log(`[INFO] [TASK aiGenerator] Calling Gemini API...`);
            let fullPrompt = payload.prompt;
            
            // Add system prompt if provided
            if (payload.systemPrompt) {
                console.log(`[INFO] [TASK aiGenerator] Adding system prompt (${payload.systemPrompt.length} chars)`);
                fullPrompt = `${payload.systemPrompt}\n\nUser: ${payload.prompt}`;
            }
            
            console.log(`[INFO] [TASK aiGenerator] Final prompt length: ${fullPrompt.length} chars`);
            
            // Handle images if provided
            let result;
            if (payload.imageUrls && payload.imageUrls.length > 0) {
                console.log(`[INFO] [TASK aiGenerator] Processing ${payload.imageUrls.length} images...`);
                
                // Convert images to Gemini format (handles both base64 and URLs)
                const imageParts = await Promise.all(
                    payload.imageUrls.map(async (imageUrl) => {
                        // Check if it's a base64 data URL
                        if (imageUrl.startsWith("data:")) {
                            // Extract base64 data and mime type
                            const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
                            if (matches) {
                                return {
                                    inlineData: {
                                        data: matches[2],
                                        mimeType: matches[1],
                                    },
                                };
                            }
                            console.warn(`[WARN] [TASK aiGenerator] Invalid base64 format`);
                            return null;
                        }
                        
                        // It's a URL, fetch and convert to base64
                        console.log(`[INFO] [TASK aiGenerator] Fetching image from URL: ${imageUrl.substring(0, 60)}...`);
                        try {
                            const response = await fetch(imageUrl);
                            if (!response.ok) {
                                console.log(`[ERROR] [TASK aiGenerator] Failed to fetch image: ${response.status}`);
                                return null;
                            }
                            
                            const arrayBuffer = await response.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            const base64Data = buffer.toString('base64');
                            
                            // Get MIME type from response headers
                            const contentType = response.headers.get('content-type') || 'image/jpeg';
                            console.log(`[SUCCESS] [TASK aiGenerator] Converted URL to base64 (${contentType})`);
                            
                            return {
                                inlineData: {
                                    data: base64Data,
                                    mimeType: contentType,
                                },
                            };
                        } catch (error) {
                            console.log(`[ERROR] [TASK aiGenerator] Error fetching image: ${error}`);
                            return null;
                        }
                    })
                );
                
                const validImageParts = imageParts.filter(Boolean) as Array<{ inlineData: { data: string; mimeType: string } }>;
                console.log(`[SUCCESS] [TASK aiGenerator] Converted ${validImageParts.length} images to Gemini format`);
                
                if (validImageParts.length > 0) {
                    // Generate content with images
                    result = await model.generateContent([fullPrompt, ...validImageParts]);
                } else {
                    // Fallback to text-only if no valid images
                    result = await model.generateContent(fullPrompt);
                }
            } else {
                // Text-only generation
                result = await model.generateContent(fullPrompt);
            }
            
            console.log(`[INFO] [TASK aiGenerator] Got response from Gemini`);
            
            const response = await result.response;
            const text = response.text();
            console.log(`[SUCCESS] [TASK aiGenerator] Response text length: ${text.length} chars`);
            console.log(`[INFO] [TASK aiGenerator] Response preview: ${text.substring(0, 150)}...`);

            const returnValue = {
                success: true,
                text: text,
            };
            console.log(`[SUCCESS] [TASK aiGenerator] ===== COMPLETED =====\n`);
            return returnValue;
        } catch (error) {
            console.error(`[ERROR] [TASK aiGenerator] ERROR:`, error);
            console.error(`[ERROR] [TASK aiGenerator] Error details:`, JSON.stringify(error, null, 2));
            throw new Error(`Gemini API Failed: ${error}`);
        }
    },
});

export const imageProcessor = task({
    id: "process-image",
    run: async () => ({ success: true })
});

// Crop Image Task - Fast processing via Trigger.dev
export const cropImageTask = task({
    id: "crop-image",
    run: async (payload: { 
        imageUrl: string; 
        cropX: number; 
        cropY: number; 
        cropWidth: number; 
        cropHeight: number;
    }) => {
        console.log(`Cropping image: ${payload.imageUrl}`);
        
        try {
            configureCloudinary();
            
            // Extract public ID from Cloudinary URL with full path including folders
            let publicId = payload.imageUrl;
            
            if (payload.imageUrl.includes('cloudinary.com')) {
                const uploadIndex = payload.imageUrl.indexOf('/upload/');
                if (uploadIndex !== -1) {
                    // Get everything after /upload/
                    const afterUpload = payload.imageUrl.substring(uploadIndex + 8);
                    
                    // Remove version if present (v1234567890/)
                    const versionMatch = afterUpload.match(/^v\d+\//);
                    const afterVersion = versionMatch ? afterUpload.substring(versionMatch[0].length) : afterUpload;
                    
                    // Remove file extension
                    publicId = afterVersion.replace(/\.[^/.]+$/, '');
                    
                    console.log(`[INFO] Extracted public ID with full path: ${publicId}`);
                }
            }

            // Use Cloudinary to crop the image with percentage-based coordinates
            // Cloudinary percentage format: divide by 100 (e.g., 10% = 0.1)
            const croppedUrl = cloudinary.url(publicId, {
                transformation: [
                    {
                        crop: 'crop',
                        x: payload.cropX / 100,  // Convert percentage to decimal (10 -> 0.1)
                        y: payload.cropY / 100,
                        width: payload.cropWidth / 100,
                        height: payload.cropHeight / 100,
                    }
                ],
                secure: true,
                resource_type: 'image',
            });
            
            console.log(`[SUCCESS] Generated cropped URL: ${croppedUrl}`);

            return {
                success: true,
                croppedImageUrl: croppedUrl,
            };
        } catch (error: any) {
            console.error('Crop image error:', error);
            return {
                success: false,
                error: error.message || 'Failed to crop image',
            };
        }
    },
});

// Extract Video Frames Task - Fast processing via Trigger.dev
export const extractVideoFrames = task({
    id: "extract-video-frames",
    run: async (payload: { 
        videoUrl: string; 
        cropX: number; 
        cropY: number; 
        cropWidth: number; 
        cropHeight: number;
        framesPerSecond: number;
    }) => {
        console.log(`Extracting frames from video: ${payload.videoUrl}`);
        try {
            configureCloudinary();
            // Extract public ID from Cloudinary URL with full path including folders
            let publicId = payload.videoUrl;
            if (payload.videoUrl.includes('cloudinary.com')) {
                const uploadIndex = payload.videoUrl.indexOf('/upload/');
                if (uploadIndex !== -1) {
                    // Get everything after /upload/
                    const afterUpload = payload.videoUrl.substring(uploadIndex + 8);
                    // Remove version if present (v1234567890/)
                    const versionMatch = afterUpload.match(/^v\d+\//);
                    const afterVersion = versionMatch ? afterUpload.substring(versionMatch[0].length) : afterUpload;
                    // Remove file extension
                    publicId = afterVersion.replace(/\.[^/.]+$/, '');
                    console.log(`[INFO] Extracted video public ID with full path: ${publicId}`);
                }
            }

            // Use framesPerSecond as the timestamp (single frame extraction)
            const timestamp = payload.framesPerSecond; // This is actually frameNumber from UI
            console.log(`[INFO] Extracting single frame at timestamp: ${timestamp}s`);

            // --- NEW: Check video duration before extracting frame ---
            const { getVideoDuration } = await import("./cloudinary-utils");
            const duration = await getVideoDuration(publicId);
            console.log(`[DEBUG] Video duration: ${duration}, requested timestamp: ${timestamp}`);
            if (duration == null) {
                console.warn('[WARN] Could not determine video duration, proceeding to extract frame.');
            } else if (timestamp > duration + 0.5) {
                return {
                    success: false,
                    error: `Requested frame (${timestamp}s) is beyond video duration (${duration}s).`,
                    frames: [],
                };
            }
            // --- END duration check ---

            // Generate frame URL using start_offset for precise timestamp
            const frameUrl = cloudinary.url(publicId, {
                resource_type: 'video',
                transformation: [
                  { so: timestamp, fetch_format: 'jpg', quality: 'auto' }
                ],
                secure: true,
            });
            console.log(`[SUCCESS] Generated frame URL: ${frameUrl}`);
            return {
                success: true,
                frames: [frameUrl], // Return single frame in array for consistency
            };
        } catch (error: any) {
            console.error('Extract frame error:', error);
            return {
                success: false,
                error: error.message || 'Failed to extract frame',
                frames: [],
            };
        }
    },
});