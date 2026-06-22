import { inflateSync } from "node:zlib";

export const runtime = "nodejs";

type ScannedStoneRow = {
  description: string;
  size: string;
  qty: string;
  rate: string;
  setChrg: string;
};

function decodePdfLiteral(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
}

function decodeHexString(hexValue: string) {
  const clean = hexValue.replace(/\s+/g, "");
  if (clean.length < 2 || clean.length % 2 !== 0) return "";
  const bytes = Buffer.from(clean, "hex");
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let output = "";
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      output += String.fromCharCode((bytes[index] << 8) + bytes[index + 1]);
    }
    return output;
  }
  return bytes.toString("utf8");
}

function extractPdfText(buffer: Buffer) {
  const sources = [buffer.toString("latin1")];
  const raw = sources[0];
  const streamPattern = /<<(?:.|\n|\r)*?>>\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  let streamMatch: RegExpExecArray | null;
  while ((streamMatch = streamPattern.exec(raw)) !== null) {
    const dictionary = streamMatch[0].slice(0, Math.max(0, streamMatch[0].indexOf("stream")));
    if (!/\/FlateDecode\b/.test(dictionary)) continue;
    try {
      const streamBytes = Buffer.from(streamMatch[1], "latin1");
      sources.push(inflateSync(streamBytes).toString("latin1"));
    } catch {
      // Some PDFs include non-text streams; skip anything that cannot inflate.
    }
  }

  const pieces: string[] = [];
  for (const source of sources) {
    for (const match of source.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      pieces.push(decodePdfLiteral(match[0].slice(1, -1)));
    }
    for (const match of source.matchAll(/<([0-9A-Fa-f\s]{4,})>/g)) {
      const decoded = decodeHexString(match[1]);
      if (/[A-Za-z0-9]/.test(decoded)) pieces.push(decoded);
    }
  }

  return pieces
    .join("\n")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function findField(text: string, labels: string[]) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n\\r|]+)`, "i");
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function normalizeArtNumber(value: string) {
  const match = value.match(/\bLHR\s*[- ]?\s*(\d{4,})\b/i);
  return match ? `LHR-${match[1]}`.toUpperCase() : "";
}

function cleanReadableText(value: string) {
  return value
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function scanStoneRows(text: string): ScannedStoneRow[] {
  const rows: ScannedStoneRow[] = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9\s./-]{1,40})\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+X?\s+(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)/i);
    if (!match) continue;
    const [, description, size, qty, rate, setChrg] = match;
    rows.push({ description: description.trim(), size, qty, rate, setChrg });
  }
  return rows.slice(0, 20);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "PDF file is required" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = cleanReadableText(extractPdfText(buffer));
    const artMatch = text.match(/\bLHR\s*[- ]?\s*\d{4,}\b/i);
    const artNumber = artMatch ? normalizeArtNumber(artMatch[0]) : normalizeArtNumber(file.name);
    const productName = findField(text, ["Job Name", "Item Name", "Product Name", "Design Name"]) || "";
    const partyName = findField(text, ["Party Name", "Party", "Customer Name", "Customer"]) || "";
    const color = findField(text, ["Colour", "Color", "Stone Type"]) || "";
    const category = findField(text, ["Category"]) || "Necklace";
    const status = findField(text, ["Status"]) || "Ready";
    const qty = findField(text, ["Product Qty", "Qty", "Quantity"]) || "1";
    const date = findField(text, ["Date"]) || "";
    const grossWeight = findField(text, ["Gaht Weight", "Ghat Weight", "Total Gross Weight", "Gross Weight"]) || "";
    const polishRate = findField(text, ["Polish Cost", "Polish Rate", "Polish"]) || "";
    const rows = scanStoneRows(text);
    const hasReadableDetails = Boolean(productName || partyName || color || grossWeight || polishRate || rows.length);

    return Response.json({
      ok: true,
      fields: {
        designNo: artNumber,
        jobName: productName,
        partyName,
        color,
        category,
        status,
        qty,
        date,
        grossWeight,
        polishRate,
      },
      rows,
      textPreview: text.slice(0, 2000),
      message: hasReadableDetails
        ? "PDF scanned. Review the filled art number details, then click Save."
        : "PDF attached, but details could not be read from this image/scanned PDF. Use Scan Excel for automatic details, or enter them manually.",
    });
  } catch (error) {
    console.error("scan-pdf failed", error);
    const message = error instanceof Error ? error.message : "PDF scan failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
