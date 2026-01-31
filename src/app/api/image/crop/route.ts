import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, cropX, cropY, cropWidth, cropHeight } = body;

    console.log("🖼️  [API] Triggering crop-image task via Trigger.dev");

    // Trigger and wait for the crop-image task
    const result = await tasks.triggerAndWait("crop-image", {
      imageUrl,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
    });

    console.log(`✅ [API] Crop task completed:`, result.ok);

    if (!result.ok) {
      throw new Error("Crop task failed");
    }

    return NextResponse.json({
      success: true,
      croppedImageUrl: result.output.croppedImageUrl,
    });

  } catch (error) {
    console.error("❌ [API] Crop error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Crop failed" },
      { status: 500 }
    );
  }
}
