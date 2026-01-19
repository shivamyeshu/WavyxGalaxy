import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    configureCloudinary();

    const body = await req.json();
    const { videoUrl, cropX, cropY, cropWidth, cropHeight, framesPerSecond } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Extract public ID from Cloudinary URL
    // Cloudinary URL format: https://res.cloudinary.com/{cloud}/video/upload/v{version}/{folder}/{public_id}.{ext}
    // We need to extract everything after 'upload/v{version}/' and before the file extension
    let publicId = videoUrl;
    if (videoUrl.includes('cloudinary.com')) {
      try {
        // Find the 'upload' part
        const uploadIndex = videoUrl.indexOf('/upload/');
        if (uploadIndex !== -1) {
          // Get everything after '/upload/'
          const afterUpload = videoUrl.substring(uploadIndex + 8);
          // Remove version number (v1234567890/)
          const versionMatch = afterUpload.match(/^v\d+\//);
          const afterVersion = versionMatch ? afterUpload.substring(versionMatch[0].length) : afterUpload;
          // Remove file extension
          publicId = afterVersion.replace(/\.[^/.]+$/, '');
        }
      } catch (err) {
        console.error('Error extracting public ID:', err);
        // Fallback: try to extract from the end of the URL
        const urlParts = videoUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        publicId = lastPart.split('.')[0];
      }
    }

    // Get video info to determine duration
    const videoInfo = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });

    const duration = videoInfo.duration || 10; // Default to 10 seconds if unknown
    const fps = framesPerSecond || 1;
    const totalFrames = Math.ceil(duration * fps);
    const frameInterval = 1 / fps; // Seconds between frames

    const extractedFrames: string[] = [];

    // Extract frames at specified intervals
    for (let i = 0; i < totalFrames; i++) {
      const timeOffset = i * frameInterval;
      
      try {
        // Calculate crop dimensions in pixels from percentages
        const videoWidth = videoInfo.width || 1920;
        const videoHeight = videoInfo.height || 1080;
        const cropXPx = Math.round((cropX || 0) * videoWidth / 100);
        const cropYPx = Math.round((cropY || 0) * videoHeight / 100);
        const cropWidthPx = Math.round((cropWidth || 100) * videoWidth / 100);
        const cropHeightPx = Math.round((cropHeight || 100) * videoHeight / 100);

        // Generate frame URL with crop transformation using Cloudinary's video transformation
        // For videos, we use 'crop' with x, y, w, h parameters
        // Use 'so_X' (start offset) for frame extraction at specific timestamp
        // Note: Cloudinary's start_offset creates a so_X transformation parameter
        const frameUrl = cloudinary.url(publicId, {
          resource_type: 'video',
          transformation: [
            {
              crop: 'crop',
              x: cropXPx,
              y: cropYPx,
              width: cropWidthPx,
              height: cropHeightPx,
            },
            {
              start_offset: Math.round(timeOffset), // This creates so_X parameter
              format: 'jpg',
            }
          ],
          secure: true,
        });

        extractedFrames.push(frameUrl);
      } catch (err) {
        console.error(`Failed to extract frame ${i}:`, err);
        // Continue with other frames even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      frames: extractedFrames.filter(Boolean),
    });
  } catch (error: unknown) {
    console.error('Frame extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract frames';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

