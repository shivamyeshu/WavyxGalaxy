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
    const { videoUrl, frameNumber } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    if (frameNumber === undefined || frameNumber === null || frameNumber < 0) {
      return NextResponse.json({ error: 'Frame number is required and must be >= 0' }, { status: 400 });
    }

    // Extract public ID from Cloudinary URL
    let publicId = videoUrl;
    if (videoUrl.includes('cloudinary.com')) {
      try {
        const uploadIndex = videoUrl.indexOf('/upload/');
        if (uploadIndex !== -1) {
          const afterUpload = videoUrl.substring(uploadIndex + 8);
          const versionMatch = afterUpload.match(/^v\d+\//);
          const afterVersion = versionMatch ? afterUpload.substring(versionMatch[0].length) : afterUpload;
          publicId = afterVersion.replace(/\.[^/.]+$/, '');
        }
      } catch (err) {
        console.error('Error extracting public ID:', err);
        const urlParts = videoUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        publicId = lastPart.split('.')[0];
      }
    }

    // Get video info to determine duration
    const videoInfo = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });

    const duration = videoInfo.duration || 10; // Duration in seconds

    // Validate frame number (frame number = seconds in this logic)
    // So frame 1 = 1 second, frame 2 = 2 seconds, etc.
    if (frameNumber > duration) {
      return NextResponse.json({ 
        error: `Frame number ${frameNumber} exceeds video duration (${duration.toFixed(2)}s). Maximum frame number is ${Math.floor(duration)}.` 
      }, { status: 400 });
    }

    // Direct mapping: frameNumber = timestamp in seconds
    // No FPS calculation needed - user specifies time directly
    const timestamp = frameNumber;
    
    // Round timestamp to 2 decimal places for Cloudinary
    const roundedTimestamp = Math.round(timestamp * 100) / 100;

    // Extract the frame at the calculated timestamp
    try {
      console.log('[ExtractFrame] Extracting frame:', { publicId, frameNumber, timestamp: roundedTimestamp, duration, method: 'direct_seconds' });
      
      // IMPORTANT: For Cloudinary, we MUST use direct URL construction with so_ parameter
      // The SDK's cloudinary.url() might not properly include the start_offset
      // Format: /upload/so_{seconds},f_jpg,q_auto/
      
      // Build the direct Cloudinary URL with all transformations in the correct order
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const directFrameUrl = `https://res.cloudinary.com/${cloudName}/video/upload/so_${roundedTimestamp},f_jpg,q_auto/${publicId}.jpg`;
      
      console.log('[ExtractFrame] Direct URL:', directFrameUrl);
      console.log('[ExtractFrame] URL contains so_: ', directFrameUrl.includes(`so_${roundedTimestamp}`));
      console.log('[ExtractFrame] URL contains f_jpg: ', directFrameUrl.includes('f_jpg'));

      return NextResponse.json({
        success: true,
        frameUrl: directFrameUrl,
        frameNumber,
        timestamp: roundedTimestamp,
        duration,
        publicId,
        method: 'direct_seconds',
      });
    } catch (err) {
      console.error('Failed to extract frame:', err);
      throw new Error('Failed to extract frame from video');
    }
  } catch (error: unknown) {
    console.error('Frame extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract frame';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

