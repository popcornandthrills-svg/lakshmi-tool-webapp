import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const contentTypes: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const assetPath = url.searchParams.get("path");
    if (!assetPath) {
      return new Response("Missing path", { status: 400 });
    }

    const normalizedPath = assetPath.replaceAll("\\", "/");
    const fullPath = path.resolve(PUBLIC_DIR, `.${normalizedPath}`);
    if (!fullPath.startsWith(PUBLIC_DIR)) {
      return new Response("Forbidden", { status: 403 });
    }

    if (!existsSync(fullPath)) {
      return new Response("Not found", { status: 404 });
    }

    const file = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    return new Response(file, {
      headers: {
        "Content-Type": contentTypes[ext] ?? "application/octet-stream"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown asset error";
    return new Response(message, { status: 500 });
  }
}
