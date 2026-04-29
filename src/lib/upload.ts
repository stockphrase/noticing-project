// src/lib/upload.ts
// Client-side upload helper. Fetches a signature from our API, then
// uploads directly to Cloudinary. Returns the URL and publicId to store.

export interface UploadedMedia {
  type: "image" | "audio";
  url: string;
  publicId: string;
}

export async function uploadToCloudinary(
  file: File,
  type: "image" | "audio"
): Promise<UploadedMedia> {
  // 1. Get a signed upload signature from our server
  const sigRes = await fetch("/api/media/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
  if (!sigRes.ok) throw new Error("Failed to get upload signature");

  const { signature, timestamp, cloudName, apiKey, folder, resourceType } =
    await sigRes.json();

  // 2. Upload directly to Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("signature", signature);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", apiKey);
  formData.append("folder", folder);

  if (type === "image") {
    formData.append("eager", "w_1200,c_limit,q_auto,f_auto");
  }

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );
  if (!uploadRes.ok) throw new Error("Cloudinary upload failed");

  const data = await uploadRes.json();

  return {
    type,
    // Use the eager transformation URL for images (auto-compressed)
    url: type === "image" && data.eager?.[0]?.secure_url
      ? data.eager[0].secure_url
      : data.secure_url,
    publicId: data.public_id,
  };
}

// Validate audio duration client-side before uploading
export function checkAudioDuration(
  file: File,
  maxSeconds: number
): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration <= maxSeconds);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve(true); // allow on error — server will validate
    });
  });
}
