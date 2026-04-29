// src/app/api/media/sign/route.ts
// Generates a signed Cloudinary upload signature.
// The browser uploads directly to Cloudinary using this signature —
// the Next.js server never handles binary file data.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateUploadSignature, IMAGE_UPLOAD_OPTIONS, AUDIO_UPLOAD_OPTIONS } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { type } = await req.json(); // "image" | "audio"

    const folder =
      type === "audio"
        ? AUDIO_UPLOAD_OPTIONS.folder
        : IMAGE_UPLOAD_OPTIONS.folder;

    const resourceType = type === "audio" ? "video" : "image";

    const params: Record<string, string> = { folder };

    // For images, add eager transformation for auto-compression
    if (type === "image") {
      params.eager = "w_1200,c_limit,q_auto,f_auto";
    }

    const { signature, timestamp } = generateUploadSignature(params);

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      resourceType,
    });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
