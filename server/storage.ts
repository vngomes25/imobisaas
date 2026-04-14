import crypto from "crypto";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function sanitizeKey(relKey: string): string {
  return relKey.replace(/[^a-zA-Z0-9/_.-]/g, "_");
}

function appendHash(relKey: string): string {
  const hash = crypto.randomBytes(4).toString("hex");
  const dot = relKey.lastIndexOf(".");
  const slash = relKey.lastIndexOf("/");
  if (dot > slash) {
    return `${relKey.slice(0, dot)}_${hash}${relKey.slice(dot)}`;
  }
  return `${relKey}_${hash}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = appendHash(sanitizeKey(relKey));
  const dest = path.join(UPLOADS_DIR, key);

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (typeof data === "string") {
    fs.writeFileSync(dest, data, "utf-8");
  } else {
    fs.writeFileSync(dest, data);
  }

  const url = `/uploads/${key}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  return { key: relKey, url: `/uploads/${relKey}` };
}
