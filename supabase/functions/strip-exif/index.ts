import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * EXIF stripper — Supabase Edge Function.
 *
 * Strips EXIF metadata from uploaded images as defense-in-depth.
 * Client-side stripping is the primary defense; this function handles
 * cases where the client is bypassed or the browser lacks canvas support.
 *
 * Supports: JPEG (removes APP1/EXIF marker), PNG (removes eXIf chunk),
 * WebP (removes EXIF chunk). Other formats pass through unchanged.
 *
 * Usage: POST /functions/v1/strip-exif
 * Body: multipart/form-data with "file" field
 * Returns: { path: string, size: number, exif_stripped: boolean }
 */

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ---------------------------------------------------------------------------
// JPEG EXIF stripping
// ---------------------------------------------------------------------------

function stripJpegExif(data: Uint8Array): Uint8Array {
  // JPEG structure: SOI (FF D8) + segments (FF XX) + EOI (FF D9)
  // APP1 (FF E1) contains EXIF. Remove all APP1 segments.
  const result: number[] = [0xff, 0xd8]; // SOI
  let i = 2;

  while (i < data.length) {
    if (data[i] !== 0xff) {
      // Not a marker — copy rest
      for (let j = i; j < data.length; j++) result.push(data[j]);
      break;
    }

    // Skip padding bytes (0xFF)
    while (i < data.length && data[i] === 0xff) i++;
    if (i >= data.length) break;

    const marker = data[i];
    i++;

    // EOI
    if (marker === 0xd9) {
      result.push(0xff, 0xd9);
      break;
    }

    // SOI, TEM, RST markers have no length field
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      result.push(0xff, marker);
      continue;
    }

    // Read segment length
    if (i + 2 > data.length) break;
    const length = (data[i] << 8) | data[i + 1];
    const segmentEnd = i + length;

    // APP1 (0xE1) = EXIF — skip it
    if (marker === 0xe1) {
      i = segmentEnd;
      continue;
    }

    // Copy segment
    for (let j = i - 2; j < segmentEnd; j++) {
      if (j >= 0 && j < data.length) result.push(data[j]);
    }
    i = segmentEnd;
  }

  return new Uint8Array(result);
}

// ---------------------------------------------------------------------------
// PNG EXIF stripping
// ---------------------------------------------------------------------------

function stripPngExif(data: Uint8Array): Uint8Array {
  // PNG signature: 8 bytes
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const result: number[] = [...signature];
  let i = 8;

  while (i < data.length) {
    if (i + 12 > data.length) break;

    const length = (data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3];
    const type = String.fromCharCode(data[i + 4], data[i + 5], data[i + 6], data[i + 7]);
    const chunkEnd = i + 12 + length;

    // Skip eXIf chunks (EXIF metadata)
    if (type === "eXIf") {
      i = chunkEnd;
      continue;
    }

    // Copy chunk (length + type + data + CRC)
    for (let j = i; j < chunkEnd && j < data.length; j++) {
      result.push(data[j]);
    }
    i = chunkEnd;

    // IEND chunk — end of file
    if (type === "IEND") break;
  }

  return new Uint8Array(result);
}

// ---------------------------------------------------------------------------
// WebP EXIF stripping
// ---------------------------------------------------------------------------

function stripWebpExif(data: Uint8Array): Uint8Array {
  // WebP: RIFF header (12 bytes) + chunks
  // Each chunk: 4-byte type + 4-byte size + data (padded to even)
  const result: number[] = [];
  for (let i = 0; i < 12; i++) result.push(data[i]); // RIFF header

  let i = 12;
  while (i < data.length) {
    if (i + 8 > data.length) break;

    const type = String.fromCharCode(data[i], data[i + 1], data[i + 2], data[i + 3]);
    const size = data[i + 4] | (data[i + 5] << 8) | (data[i + 6] << 16) | (data[i + 7] << 24);
    const chunkEnd = i + 8 + size + (size % 2);

    // Skip EXIF chunks
    if (type === "EXIF") {
      i = chunkEnd;
      continue;
    }

    // Copy chunk
    for (let j = i; j < chunkEnd && j < data.length; j++) {
      result.push(data[j]);
    }
    i = chunkEnd;
  }

  // Update RIFF size
  const newSize = result.length - 8;
  result[4] = newSize & 0xff;
  result[5] = (newSize >> 8) & 0xff;
  result[6] = (newSize >> 16) & 0xff;
  result[7] = (newSize >> 24) & 0xff;

  return new Uint8Array(result);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "public-media";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: "File too large (max 10 MB)" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: "Unsupported file type" }), {
        status: 415,
        headers: { "Content-Type": "application/json" },
      });
    }

    const originalData = new Uint8Array(await file.arrayBuffer());
    let stripped: Uint8Array;
    let exifStripped = false;

    if (file.type === "image/jpeg") {
      stripped = stripJpegExif(originalData);
      exifStripped = stripped.length < originalData.length;
    } else if (file.type === "image/png") {
      stripped = stripPngExif(originalData);
      exifStripped = stripped.length < originalData.length;
    } else if (file.type === "image/webp") {
      stripped = stripWebpExif(originalData);
      exifStripped = stripped.length < originalData.length;
    } else {
      stripped = originalData;
      exifStripped = false;
    }

    // Upload to storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: stripped,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return new Response(JSON.stringify({ error: `Upload failed: ${err}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        path,
        bucket,
        size: stripped.length,
        original_size: originalData.length,
        exif_stripped: exifStripped,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
