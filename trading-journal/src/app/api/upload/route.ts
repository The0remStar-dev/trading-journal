import { NextRequest, NextResponse } from "next/server";

// POST /api/upload
// Body: { dataUri: string, filename?: string }
// If Cloudinary env vars are set, uploads there and returns the hosted URL.
// Otherwise, simply echoes back the base64 data URI so it can be stored
// directly on the Trade row (fine for a single-user, low-volume journal).
export async function POST(request: NextRequest) {
  const { dataUri } = await request.json().catch(() => ({ dataUri: null }));

  if (!dataUri || typeof dataUri !== "string" || !dataUri.startsWith("data:image/")) {
    return NextResponse.json({ error: "A base64 image data URI is required." }, { status: 400 });
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    try {
      const url = await uploadToCloudinary(dataUri, {
        cloudName: CLOUDINARY_CLOUD_NAME,
        apiKey: CLOUDINARY_API_KEY,
        apiSecret: CLOUDINARY_API_SECRET,
      });
      return NextResponse.json({ url });
    } catch (err) {
      console.error("Cloudinary upload failed, falling back to base64.", err);
    }
  }

  // Fallback: store the data URI as-is (works fine in SQLite/Postgres TEXT columns
  // for a single-user journal; swap in real object storage if screenshot volume grows).
  return NextResponse.json({ url: dataUri });
}

async function uploadToCloudinary(
  dataUri: string,
  creds: { cloudName: string; apiKey: string; apiSecret: string }
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary signed upload requires an SHA-1 signature of the params + secret.
  const crypto = await import("crypto");
  const paramsToSign = `timestamp=${timestamp}${creds.apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  const form = new FormData();
  form.append("file", dataUri);
  form.append("api_key", creds.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) throw new Error(`Cloudinary responded with ${res.status}`);
  const json = await res.json();
  return json.secure_url as string;
}
