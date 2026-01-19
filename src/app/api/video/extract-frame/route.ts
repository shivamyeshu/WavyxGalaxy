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

    // Get video info to determine FPS and duration
    const videoInfo = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });

    const duration = videoInfo.duration || 10; // Duration in seconds
    
    // Try to get FPS from video info, or use a default
    // Cloudinary might not always provide FPS, so we'll estimate based on frame count
    // Common video FPS: 24, 30, 60
    // If we don't have FPS info, we'll estimate: assume 30 fps for calculation
    const estimatedFPS = 30; // Default FPS assumption
    const totalEstimatedFrames = Math.floor(duration * estimatedFPS);

    // Validate frame number
    if (frameNumber >= totalEstimatedFrames) {
      return NextResponse.json({ 
        error: `Frame number ${frameNumber} exceeds estimated total frames (${totalEstimatedFrames}) for video duration ${duration.toFixed(2)}s` 
      }, { status: 400 });
    }

    // Calculate timestamp from frame number
    // frameNumber / fps = timestamp in seconds
    const timestamp = frameNumber / estimatedFPS;
    
    // Round timestamp to avoid very long decimal values that might cause issues
    // Cloudinary accepts decimal values, but let's round to 3 decimal places for precision
    const roundedTimestamp = Math.round(timestamp * 1000) / 1000;

    // Extract the frame at the calculated timestamp
    try {
      console.log('[ExtractFrame] Extracting frame:', { publicId, frameNumber, timestamp, roundedTimestamp, duration });
      
      // Use Cloudinary's video transformation to extract frame at specific timestamp
      // Based on extract-frames route pattern: use number for start_offset and format together
      // Cloudinary uses so_X parameter where X is the start offset in seconds
      // The format parameter converts video frame to JPG image
      const frameUrl = cloudinary.url(publicId, {
        resource_type: 'video',
        transformation: [
          {
            start_offset: Math.round(roundedTimestamp * 100) / 100, // Round to 2 decimal places like extract-frames
            format: 'jpg', // This is CRITICAL - converts video frame to JPG image
          }
        ],
        secure: true,
      });

      // Verify that format is in the URL - if not, manually add it
      // Cloudinary URL should have f_jpg in the transformation path for image extraction
      let finalUrl = frameUrl;
      if (!frameUrl.includes('f_jpg') && !frameUrl.includes('/jpg')) {
        // If format isn't applied, manually add it to the URL
        // Cloudinary URL structure: .../upload/so_X/f_jpg/v1/... or .../upload/so_X,f_jpg/v1/...
        console.warn('[ExtractFrame] Format not found in URL, fixing manually:', frameUrl);
        
        // Insert f_jpg after start_offset (so_X)
        // Pattern: /upload/so_X/v1/... should become /upload/so_X/f_jpg/v1/...
        if (frameUrl.includes('/upload/so_')) {
          finalUrl = frameUrl.replace(/\/upload\/(so_\d+\.?\d*)\//, '/upload/$1/f_jpg/');
        } else {
          // Alternative pattern if structure is different
          finalUrl = frameUrl.replace(/(so_\d+\.?\d*)/, '$1/f_jpg');
        }
        
        // Also ensure the URL ends with .jpg extension for proper image serving
        if (!finalUrl.match(/\.jpg(\?|$)/)) {
          // Remove query parameters and file extension, then add .jpg
          const urlWithoutQuery = finalUrl.split('?')[0];
          const baseUrl = urlWithoutQuery.replace(/\.[^/.]+$/, '');
          const queryString = frameUrl.includes('?') ? frameUrl.split('?')[1] : '';
          finalUrl = baseUrl + '.jpg' + (queryString ? '?' + queryString : '');
        }
      }

      console.log('[ExtractFrame] Final frame URL:', finalUrl);
      console.log('[ExtractFrame] Original frame URL:', frameUrl);

      return NextResponse.json({
        success: true,
        frameUrl: finalUrl, // Return the fixed URL with format
        frameNumber,
        timestamp: roundedTimestamp.toFixed(3),
        duration,
        estimatedFPS,
        totalEstimatedFrames,
        publicId, // For debugging
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

