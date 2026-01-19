import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate Cloudinary configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary configuration missing:', {
        hasCloudName: !!cloudName,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
      });
      return NextResponse.json(
        { 
          error: 'Cloudinary CDN not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env.local file.' 
        },
        { status: 500 }
      );
    }

    // Configure Cloudinary (do it here to ensure env vars are loaded)
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Strict validation: Only allow video files, reject images and audio
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/mpeg',
      'video/x-matroska',
      'video/3gpp',
    ];
    
    const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.mpeg', '.mpg', '.mkv', '.3gp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!file.type.startsWith('video/') || !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only video files are allowed (MP4, WebM, MOV, AVI, etc.). Images and audio files are not supported.' },
        { status: 400 }
      );
    }
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type not supported. Allowed extensions: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<{
      public_id: string;
      secure_url: string;
      duration?: number;
      width?: number;
      height?: number;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: `weavy-videos/${userId}`,
          public_id: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}`,
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error('Upload failed: No result returned'));
        }
      );
      uploadStream.end(buffer);
    });

    // Get video metadata from Cloudinary
    const videoInfo = await cloudinary.api.resource(uploadResult.public_id, {
      resource_type: 'video',
    });

    // Ensure user exists in database
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
      }

      user = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@temp.com`,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
        },
      });
    }

    // Store video metadata in database
    // @ts-expect-error - Video model exists in schema but Prisma client needs regeneration
    const videoRecord = await prisma.video.create({
      data: {
        userId: user.id,
        filename: uploadResult.public_id,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        duration: videoInfo.duration || null,
        width: videoInfo.width || null,
        height: videoInfo.height || null,
        cdnUrl: uploadResult.secure_url,
        cdnPublicId: uploadResult.public_id,
      },
    });

    return NextResponse.json({
      success: true,
      video: {
        id: videoRecord.id,
        cdnUrl: videoRecord.cdnUrl,
        cdnPublicId: videoRecord.cdnPublicId,
        originalName: videoRecord.originalName,
        duration: videoRecord.duration,
        width: videoRecord.width,
        height: videoRecord.height,
        size: videoRecord.size,
      },
    });
  } catch (error: unknown) {
    console.error('Video upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload video';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

