export const runtime = "nodejs";

type ScannedStoneRow = {
  description: string;
  size: string;
  qty: string;
  rate: string;
  setChrg: string;
};

type ExtractedExcelImages = {
  cadImage: string;
  sampleImage: string;
};

type DumpFormatValidation = {
  ok: boolean;
  error?: string;
  metaHeaderIndex: number;
  stoneHeaderIndex: number;
};

function normalizeArtNumber(value: string) {
  const match = value.match(/\bLHR\s*[- ]?\s*(\d{4,})\b/i);
  return match ? `LHR-${match[1]}`.toUpperCase() : "";
}

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeHeader(value: unknown) {
  return toText(value).replace(/\s+/g, " ").trim().toUpperCase();
}

function findHeaderIndex(row: unknown[], labels: string[]) {
  const normalizedLabels = labels.map((label) => normalizeHeader(label));
  return row.findIndex((cell) => normalizedLabels.includes(normalizeHeader(cell)));
}

function getCell(row: unknown[] | undefined, index: number) {
  return index >= 0 ? toText(row?.[index]) : "";
}

function findDetailValue(rows: unknown[][], labels: string[]) {
  const normalizedLabels = labels.map((label) => normalizeHeader(label));
  for (const row of rows) {
    if (!normalizedLabels.includes(normalizeHeader(row[0]))) continue;
    for (let index = 1; index < row.length; index += 1) {
      const value = toText(row[index]);
      if (value) return value;
    }
  }
  return "";
}

function rowHasAll(row: unknown[] | undefined, labels: string[]) {
  if (!row) return false;
  const normalizedRow = row.map(normalizeHeader);
  return labels.every((label) => normalizedRow.includes(normalizeHeader(label)));
}

function hasTitleRow(rows: unknown[][]) {
  return rows.some((row) => row.some((cell) => /ART NUMBER DETAILS/i.test(toText(cell))));
}

function hasSectionRow(rows: unknown[][], label: string) {
  const normalizedLabel = normalizeHeader(label);
  return rows.some((row) => row.some((cell) => normalizeHeader(cell) === normalizedLabel));
}

function findRequiredHeaderRow(rows: unknown[][], labels: string[]) {
  return rows.findIndex((row) => rowHasAll(row, labels));
}

function validateDumpFormat(rows: unknown[][]): DumpFormatValidation {
  const metaHeaderIndex = findRequiredHeaderRow(rows, ["DESIGN NO", "JOB NAME", "QTY", "STATUS", "CATEGORY"]);
  const stoneHeaderIndex = findRequiredHeaderRow(rows, ["STONES", "SIZE", "QTY", "RATE", "STN RATE", "SET CHRG", "TOTAL CHRG"]);
  const missing: string[] = [];

  if (!hasTitleRow(rows)) missing.push("ART NUMBER DETAILS title");
  if (!hasSectionRow(rows, "PRODUCT DETAILS")) missing.push("PRODUCT DETAILS section");
  if (!hasSectionRow(rows, "CAD IMAGE")) missing.push("CAD IMAGE section");
  if (!hasSectionRow(rows, "SAMPLE IMAGE")) missing.push("SAMPLE IMAGE section");
  if (!hasSectionRow(rows, "ORDER ESTIMATE")) missing.push("ORDER ESTIMATE section");
  if (metaHeaderIndex < 0) missing.push("DESIGN NO / JOB NAME / QTY / STATUS / CATEGORY header row");
  if (stoneHeaderIndex < 0) missing.push("STONES / SIZE / QTY / RATE / STN RATE / SET CHRG / TOTAL CHRG header row");

  if (metaHeaderIndex >= 0 && stoneHeaderIndex >= 0 && metaHeaderIndex >= stoneHeaderIndex) {
    missing.push("ORDER ESTIMATE meta row before STONES header");
  }

  if (missing.length) {
    return {
      ok: false,
      error: `Invalid Excel format. Upload only the Lakshmi Tool dumped Excel format. Missing/invalid: ${missing.join(", ")}.`,
      metaHeaderIndex,
      stoneHeaderIndex,
    };
  }

  return { ok: true, metaHeaderIndex, stoneHeaderIndex };
}

function extractRows(rows: unknown[][], headerIndex: number): ScannedStoneRow[] {
  const output: ScannedStoneRow[] = [];
  const header = rows[headerIndex] ?? [];
  const descriptionIndex = findHeaderIndex(header, ["STONES"]);
  const sizeIndex = findHeaderIndex(header, ["SIZE"]);
  const qtyIndex = findHeaderIndex(header, ["QTY"]);
  const rateIndex = findHeaderIndex(header, ["RATE"]);
  const setChrgIndex = findHeaderIndex(header, ["SET CHRG", "SET CHARGE"]);

  for (const row of rows.slice(headerIndex + 1)) {
    const description = getCell(row, descriptionIndex);
    const size = getCell(row, sizeIndex);
    const qty = getCell(row, qtyIndex);
    const rate = getCell(row, rateIndex);
    const setChrg = getCell(row, setChrgIndex);
    const label = normalizeHeader(description);

    if (/^(RODIUM|RHODIUM|GAHT|GHAT|POLISH|TOTAL|GRAND)\b/.test(label)) break;
    if (!description || !qty || !rate || !setChrg) continue;
    if (/^(DESIGN NO|JOB NAME|COLOUR|COLOR|STONES|SIZE|QTY|RATE|STATUS|CATEGORY)$/.test(label)) continue;
    if (!/^\d+(?:\.\d+)?$/.test(qty) || !/^\d+(?:\.\d+)?$/.test(rate) || !/^\d+(?:\.\d+)?$/.test(setChrg)) continue;

    output.push({
      description,
      size,
      qty,
      rate,
      setChrg,
    });
  }
  return output;
}

async function extractEmbeddedImages(buffer: Buffer): Promise<ExtractedExcelImages> {
  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { cadImage: "", sampleImage: "" };

    const media = ((workbook as unknown as { model?: { media?: Array<{
      index?: number;
      extension?: string;
      buffer?: Buffer;
      base64?: string;
    }> } }).model?.media ?? []);

    const images = sheet.getImages()
      .map((image) => {
        const imageId = Number(image.imageId);
        const imageMedia = media.find((item) => Number(item.index) === imageId);
        const extension = imageMedia?.extension || "png";
        const base64 = imageMedia?.base64 || imageMedia?.buffer?.toString("base64") || "";
        const nativeCol = image.range.tl.nativeCol;
        return {
          nativeCol,
          dataUrl: base64 ? `data:image/${extension === "jpg" ? "jpeg" : extension};base64,${base64}` : "",
        };
      })
      .filter((image) => image.dataUrl)
      .sort((left, right) => left.nativeCol - right.nativeCol);

    return {
      cadImage: images[0]?.dataUrl ?? "",
      sampleImage: images[1]?.dataUrl ?? "",
    };
  } catch {
    return { cadImage: "", sampleImage: "" };
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Excel file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { read, utils } = await import("xlsx");
    const workbook = read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return Response.json({ error: "No worksheet found" }, { status: 400 });
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" }) as unknown[][];
    const validation = validateDumpFormat(rows);
    if (!validation.ok) {
      return Response.json({
        error: validation.error,
        formatValid: false,
        code: "INVALID_EXCEL_DUMP_FORMAT",
      }, { status: 400 });
    }
    const embeddedImages = await extractEmbeddedImages(buffer);

    let artNumber = "";
    let jobName = "";
    let partyName = "";
    let color = "";
    let category = "Necklace";
    let status = "Ready";
    let qty = "1";
    let date = "";
    let grossWeight = "";
    let makingChargeRate = "";
    let stoneSettingCost = "";
    let polishRate = "";
    let metaHeaderIndex = validation.metaHeaderIndex;
    let stoneHeaderIndex = validation.stoneHeaderIndex;

    for (let index = 0; index < rows.length; index += 1) {
      const line = rows[index].map(toText);
      if (!artNumber) {
        const found = line.find((cell) => normalizeArtNumber(cell));
        if (found) artNumber = normalizeArtNumber(found);
      }
    }

    if (metaHeaderIndex >= 0) {
      const header = rows[metaHeaderIndex];
      const values = rows[metaHeaderIndex + 1];
      artNumber = normalizeArtNumber(getCell(values, findHeaderIndex(header, ["DESIGN NO"]))) || artNumber;
      jobName = getCell(values, findHeaderIndex(header, ["JOB NAME"])) || jobName;
      color = getCell(values, findHeaderIndex(header, ["COLOUR", "COLOR"])) || color;
      qty = getCell(values, findHeaderIndex(header, ["QTY"])) || qty;
      status = getCell(values, findHeaderIndex(header, ["STATUS"])) || status;
      category = getCell(values, findHeaderIndex(header, ["CATEGORY"])) || category;
    }

    partyName = findDetailValue(rows, ["Party Name", "Party", "Customer"]) || partyName;
    grossWeight = findDetailValue(rows, ["Total Gross Weight", "Gross Weight", "Ghat Weight", "Gaht Weight"]) || grossWeight;
    makingChargeRate = findDetailValue(rows, ["Ghat Rate", "Gaht Rate", "Making Charge Rate"]) || makingChargeRate;
    stoneSettingCost = findDetailValue(rows, ["1pc Stone Setting Cost", "1 PC Stone Setting Cost"]) || stoneSettingCost;
    polishRate = findDetailValue(rows, ["Polish Cost", "Polish Rate", "Polish"]) || polishRate;

    const scannedRows = stoneHeaderIndex >= 0 ? extractRows(rows, stoneHeaderIndex) : [];

    return Response.json({
      ok: true,
      fields: {
        designNo: artNumber,
        jobName,
        partyName,
        color,
        category,
        status,
        qty,
        date,
        grossWeight,
        makingChargeRate,
        stoneSettingCost,
        polishRate,
        cadImage: embeddedImages.cadImage,
        sampleImage: embeddedImages.sampleImage,
      },
      rows: scannedRows,
      formatValid: true,
      message: `Excel scanned. Imported all ${scannedRows.length} stone row${scannedRows.length === 1 ? "" : "s"}. Review the filled art number details, then click Save.`,
    });
  } catch (error) {
    console.error("scan-excel failed", error);
    const message = error instanceof Error ? error.message : "Excel scan failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
