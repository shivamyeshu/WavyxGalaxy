import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { videoUrl, frameNumber } = body;

    console.log("🎬 [API] Triggering extract-video-frames task via Trigger.dev");

    // Trigger and wait for the extract-video-frames task
    const result = await tasks.triggerAndWait("extract-video-frames", {
      videoUrl,
      cropX: 0,
      cropY: 0,
      cropWidth: 100,
      cropHeight: 100,
      framesPerSecond: frameNumber, // Use frameNumber as timestamp
    });

    console.log(`✅ [API] Extract task completed:`, result.ok);

    if (!result.ok || !result.output.frames || result.output.frames.length === 0) {
      throw new Error("Frame extraction failed");
    }

    return NextResponse.json({
      success: true,
      frameUrl: result.output.frames[0], // Return first frame
      frames: result.output.frames,
    });

  } catch (error: unknown) {
    console.error('❌ [API] Extract frame error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract frame';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

