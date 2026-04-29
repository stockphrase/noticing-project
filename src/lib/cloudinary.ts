// src/lib/cloudinary.ts
// Server-side Cloudinary helpers.
// Media is uploaded directly from the browser using a signed upload URL
// generated here, so the Next.js server never handles binary file data.

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Limits enforced server-side (also enforced client-side for UX)
export const MEDIA_LIMITS = {
  imageSizeBytes: 20 * 1024 * 1024,   // 20 MB
  audioSizeBytes: 10 * 1024 * 1024,   // ~10 MB (covers 60s at 128kbps)
  photosPerEntry: 3,
  audioDurationSec: 60,
  videoDurationSec: 60,
};

// Image upload options — auto-compress and cap width at 1200px.
// This reduces a typical iPhone photo from ~4 MB to ~300–500 KB.
export const IMAGE_UPLOAD_OPTIONS = {
  folder: "noticing-project/images",
  eager: [{ width: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }],
  eager_async: false,
};

// Audio upload options
export const AUDIO_UPLOAD_OPTIONS = {
  folder: "noticing-project/audio",
  resource_type: "video" as const, // Cloudinary uses "video" for audio files
};

// Generate a signed upload signature for client-side uploads.
// The client sends file directly to Cloudinary; only the resulting URL
// is stored in the database.
export function generateUploadSignature(params: Record<string, string>) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { ...params, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );
  return { signature, timestamp };
}

// Delete a media asset from Cloudinary (called when an entry or spot is deleted)
export async function deleteMedia(publicId: string, resourceType: "image" | "video" = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export default cloudinary;
