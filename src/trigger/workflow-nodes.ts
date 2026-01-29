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
    }) => {
        console.log(`\n🤖 [TASK aiGenerator] ===== STARTING =====`);
        console.log(`📝 [TASK aiGenerator] Prompt: ${payload.prompt.substring(0, 150)}...`);
        console.log(`⚙️ [TASK aiGenerator] Model: ${payload.model || 'gemini-1.5-flash'}`);
        console.log(`🌡️ [TASK aiGenerator] Temperature: ${payload.temperature || 0.7}`);

        // Use the model specified in payload or default to gemini-1.5-flash
        const modelName = payload.model || "gemini-1.5-flash";
        
        console.log(`🔧 [TASK aiGenerator] Initializing Gemini model: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
                temperature: payload.temperature || 0.7,
            },
        });

        try {
            console.log(`⏳ [TASK aiGenerator] Calling Gemini API...`);
            let fullPrompt = payload.prompt;
            
            // Add system prompt if provided
            if (payload.systemPrompt) {
                console.log(`📋 [TASK aiGenerator] Adding system prompt (${payload.systemPrompt.length} chars)`);
                fullPrompt = `${payload.systemPrompt}\n\nUser: ${payload.prompt}`;
            }
            
            console.log(`📤 [TASK aiGenerator] Final prompt length: ${fullPrompt.length} chars`);
            const result = await model.generateContent(fullPrompt);
            console.log(`📥 [TASK aiGenerator] Got response from Gemini`);
            
            const response = await result.response;
            const text = response.text();
            console.log(`✅ [TASK aiGenerator] Response text length: ${text.length} chars`);
            console.log(`📝 [TASK aiGenerator] Response preview: ${text.substring(0, 150)}...`);

            const returnValue = {
                success: true,
                text: text,
            };
            console.log(`✅ [TASK aiGenerator] ===== COMPLETED =====\n`);
            return returnValue;
        } catch (error) {
            console.error(`❌ [TASK aiGenerator] ERROR:`, error);
            console.error(`❌ [TASK aiGenerator] Error details:`, JSON.stringify(error, null, 2));
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
            // Extract public ID from Cloudinary URL or use the URL directly
            let publicId = payload.imageUrl;
            
            // If it's a Cloudinary URL, extract the public ID
            if (payload.imageUrl.includes('cloudinary.com')) {
                const urlParts = payload.imageUrl.split('/');
                const uploadIndex = urlParts.findIndex(part => part === 'upload');
                if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                    publicId = urlParts[uploadIndex + 2].split('.')[0];
                }
            }

            // Use Cloudinary to crop the image
            const croppedUrl = cloudinary.url(publicId, {
                transformation: [
                    {
                        crop: 'crop',
                        x: Math.round(payload.cropX),
                        y: Math.round(payload.cropY),
                        width: Math.round(payload.cropWidth),
                        height: Math.round(payload.cropHeight),
                    }
                ],
                secure: true,
            });

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
            // Extract public ID from Cloudinary URL
            let publicId = payload.videoUrl;
            
            if (payload.videoUrl.includes('cloudinary.com')) {
                const urlParts = payload.videoUrl.split('/');
                const uploadIndex = urlParts.findIndex(part => part === 'upload');
                if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                    publicId = urlParts[uploadIndex + 2].split('.')[0];
                }
            }

            // Get video info to determine duration
            const videoInfo = await cloudinary.api.resource(publicId, {
                resource_type: 'video',
            });

            const duration = videoInfo.duration || 10; // Default to 10 seconds if unknown
            const totalFrames = Math.ceil(duration * payload.framesPerSecond);
            const frameInterval = 1 / payload.framesPerSecond; // Seconds between frames

            const frameUrls: string[] = [];

            // Extract frames at specified intervals
            for (let i = 0; i < totalFrames; i++) {
                const timeOffset = i * frameInterval;
                
                // Generate frame URL with crop transformation
                const frameUrl = cloudinary.url(publicId, {
                    resource_type: 'video',
                    transformation: [
                        {
                            crop: 'crop',
                            x: Math.round(payload.cropX),
                            y: Math.round(payload.cropY),
                            width: Math.round(payload.cropWidth),
                            height: Math.round(payload.cropHeight),
                        },
                        {
                            format: 'jpg',
                            page: Math.floor(timeOffset * 30), // Approximate frame number (30 fps)
                        }
                    ],
                    secure: true,
                });

                frameUrls.push(frameUrl);
            }

            // For more accurate frame extraction, use Cloudinary's video transformation
            // This generates individual frame images
            const extractedFrames = await Promise.all(
                frameUrls.map(async (url, index) => {
                    try {
                        // Use Cloudinary's video frame extraction
                        const frameUrl = cloudinary.url(publicId, {
                            resource_type: 'video',
                            transformation: [
                                {
                                    crop: 'crop',
                                    x: Math.round(payload.cropX),
                                    y: Math.round(payload.cropY),
                                    width: Math.round(payload.cropWidth),
                                    height: Math.round(payload.cropHeight),
                                },
                                {
                                    format: 'jpg',
                                    start_offset: `${index * frameInterval}`,
                                }
                            ],
                            secure: true,
                        });
                        return frameUrl;
                    } catch (err) {
                        console.error(`Failed to extract frame ${index}:`, err);
                        return url; // Fallback to original URL
                    }
                })
            );

            return {
                success: true,
                frames: extractedFrames.filter(Boolean),
            };
        } catch (error: any) {
            console.error('Extract frames error:', error);
            return {
                success: false,
                error: error.message || 'Failed to extract frames',
                frames: [],
            };
        }
    },
});