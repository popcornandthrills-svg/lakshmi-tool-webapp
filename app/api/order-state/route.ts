import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { deleteProductImagePath, loadOrderEstimate, saveOrderEstimate, saveProductImagePath } from "../../../lib/storage";

export const runtime = "nodejs";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const CAD_DIR = path.join(UPLOADS_DIR, "cad");
const SAMPLE_DIR = path.join(UPLOADS_DIR, "sample");
const PDF_DIR = path.join(UPLOADS_DIR, "pdf");

async function ensureUploadDirs() {
  for (const dir of [UPLOADS_DIR, CAD_DIR, SAMPLE_DIR, PDF_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

function safeArtName(art: string) {
  return art.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
}

function extFromDataUrl(dataUrl: string) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
  const mime = match?.[1]?.toLowerCase() ?? "";
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
  if (dataUrl.startsWith("data:application/pdf")) return "pdf";
  return "png";
}

async function persistDataUrl(art: string, kind: "cad" | "sample" | "pdf", value: string) {
  if (!value || !value.startsWith("data:")) return value;
  await ensureUploadDirs();
  const ext = extFromDataUrl(value);
  const fileName = `${safeArtName(art)}-${kind}.${ext}`;
  const targetDir = kind === "cad" ? CAD_DIR : kind === "sample" ? SAMPLE_DIR : PDF_DIR;
  const targetPath = path.join(targetDir, fileName);
  const base64 = value.split(",")[1] ?? "";
  await writeFile(targetPath, Buffer.from(base64, "base64"));
  const publicPath = `/uploads/${kind}/${fileName}`;
  if (kind === "cad" || kind === "sample") {
    saveProductImagePath(art, kind, publicPath);
  }
  return publicPath;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const art = url.searchParams.get("art")?.trim();
    if (!art) {
      return Response.json({ error: "Missing art" }, { status: 400 });
    }

    const payload = loadOrderEstimate(art);
    return Response.json({ state: payload?.state ?? null, detailEdit: payload?.detailEdit ?? null }, { status: 200 });
  } catch (error) {
    console.error("order-state GET failed", error);
    const message = error instanceof Error ? error.message : "Unknown state error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const body = rawBody.trim() ? JSON.parse(rawBody) : {};
    const art = String(body?.art ?? "").trim();
    if (!art) {
      return Response.json({ error: "Missing art" }, { status: 400 });
    }

    const state = body?.state ?? {};
    const detailEdit = body?.detailEdit ?? null;
    const nextState = { ...state, images: { ...(state?.images ?? {}) } };

    if (typeof nextState.images?.cad === "string") {
      nextState.images.cad = await persistDataUrl(art, "cad", nextState.images.cad);
    }
    if (typeof nextState.images?.sample === "string") {
      nextState.images.sample = await persistDataUrl(art, "sample", nextState.images.sample);
    }
    if (typeof nextState.images?.templateFile === "string") {
      nextState.images.templateFile = await persistDataUrl(art, "pdf", nextState.images.templateFile);
    }

    if (nextState.images?.cad === "" || nextState.images?.cad == null) {
      deleteProductImagePath(art, "cad");
    }
    if (nextState.images?.sample === "" || nextState.images?.sample == null) {
      deleteProductImagePath(art, "sample");
    }

    saveOrderEstimate(art, { state: nextState, detailEdit });
    return Response.json({ ok: true, state: nextState, detailEdit }, { status: 200 });
  } catch (error) {
    console.error("order-state POST failed", error);
    const message = error instanceof Error ? error.message : "Unknown state error";
    return Response.json({ error: message }, { status: 500 });
  }
}
