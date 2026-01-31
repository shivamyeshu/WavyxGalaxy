import { v2 as cloudinary } from "cloudinary";

export async function getVideoDuration(publicId: string): Promise<number | null> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "video",
    });
    if (result && result.duration) {
      return result.duration;
    }
    return null;
  } catch (error) {
    console.error("[ERROR] Failed to fetch video duration from Cloudinary:", error);
    return null;
  }
}
