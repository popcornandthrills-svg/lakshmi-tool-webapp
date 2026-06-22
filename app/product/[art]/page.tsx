"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import productsData from "../../../data/products.json";
import orderStateData from "../../../data/order-state.json";

type Product = {
  art_number: string;
  design_no?: string;
  product_name?: string;
  category?: string;
  material_type?: string;
  stone_type?: string;
  status?: string;
  customer?: string;
  party_name?: string;
  weight_per_grams?: string;
  stones_count?: number;
  stones_setting_cost?: number;
  polish_name?: string;
  polish_cost?: number;
  total_estimation_cost?: number;
  notes?: string;
  cad_image?: string;
  final_sample_image?: string;
  template_file?: string;
  created_at?: string;
  updated_at?: string;
  line_items?: Array<{
    description?: string;
    size?: string;
    qty?: number;
    rate?: number;
    set_chrg?: number;
  }>;
  party_names?: string[];
  partner_quotes?: Array<{
    name?: string;
    amount?: number;
    image?: string;
  }>;
};

type WorksheetRow = {
  id: string;
  description: string;
  size: string;
  qty: number;
  rate: number;
  setChrg: number;
};

type FooterFormulaRow = {
  id: string;
  label: string;
  qty: number;
  rate: number;
  setChrg: number;
  includeInGrandTotal?: boolean;
};

const STONE_SHAPE_OPTIONS = ["Round", "Oval", "Pear", "MQ", "Baguette", "Heart", "Princess"];

const STONE_COLOR_OPTIONS = [
  "White",
  "Red",
  "Green",
  "Blue",
  "Pink",
  "Yellow",
  "Black",
  "Champagne",
  "Emerald Green",
  "Ruby Red",
  "Sapphire Blue",
];

const STONE_NAME_OPTIONS = STONE_SHAPE_OPTIONS.flatMap((shape) =>
  STONE_COLOR_OPTIONS.map((color) => `${shape} ${color}`)
).concat([
  "POTA NANO GREEN",
  "POTA NANO RED",
  "POTA NANO WHITE",
  "POTA NANO BLUE",
  "POTA NANO PINK",
  "POTA NANO YELLOW",
  "OVEL POTA G NANO",
  "OVEL POTA R NANO",
  "OVEL POTA W NANO",
  "OVEL POTA B NANO",
  "PAN POTA G NANO",
  "PAN POTA R NANO",
  "PAN POTA W NANO",
  "PAN POTA B NANO",
  "MQ POTA G NANO",
  "MQ POTA R NANO",
  "MQ POTA W NANO",
  "MQ POTA B NANO",
  "OVEL W",
  "OVEL RED",
  "OVEL GREEN",
  "OVEL BLUE",
  "OVEL PINK",
  "OVEL YELLOW",
  "OVEL BLACK",
  "G NANO",
  "R NANO",
  "W NANO",
  "B NANO",
  "OVEL POTA W NANO",
  "OVEL POTA R NANO",
  "OVEL POTA G NANO",
  "OVEL POTA B NANO",
  "PAN POTA W NANO",
  "PAN POTA R NANO",
  "PAN POTA G NANO",
  "PAN POTA B NANO",
  "PAN WHITE",
  "PAN RED",
  "PAN GREEN",
  "PAN BLUE",
  "PAN PINK",
  "PAN YELLOW",
  "PAN BLACK",
  "ROUND W",
  "ROUND RED",
  "ROUND GREEN",
  "ROUND BLUE",
  "ROUND PINK",
  "ROUND YELLOW",
  "ROUND BLACK",
  "ROUND CHAMPAGNE",
  "ROUND W NANO",
  "ROUND R NANO",
  "ROUND G NANO",
  "ROUND B NANO",
]);

const STONE_SIZE_OPTIONS = [
  "0.80 mm",
  "0.90 mm",
  "1.00 mm",
  "1.10 mm",
  "1.20 mm",
  "1.30 mm",
  "1.40 mm",
  "1.50 mm",
  "1.75 mm",
  "2.00 mm",
  "2.25 mm",
  "2.50 mm",
  "2.75 mm",
  "3.00 mm",
  "3.50 mm",
  "4.00 mm",
  "4.50 mm",
  "5.00 mm",
  "6.00 mm",
  "7.00 mm",
  "8.00 mm",
  "10.00 mm",
];

const STONE_SIZE_OPTIONS_BY_SHAPE: Record<string, string[]> = {
  Round: ["0.80 mm", "0.90 mm", "1.00 mm", "1.10 mm", "1.20 mm", "1.30 mm", "1.50 mm", "1.75 mm", "2.00 mm", "2.25 mm", "2.50 mm", "2.75 mm", "3.00 mm", "3.25 mm", "3.50 mm", "4.00 mm", "5.00 mm", "6.00 mm", "8.00 mm", "10.00 mm"],
  Oval: ["2×3", "3×4", "4×5", "5×7", "6×8", "7×9", "8×10", "10×12"],
  Pear: ["2×3", "3×4", "3×5", "4×5", "4×6", "5×7", "6×8"],
  PAN: ["2×3", "3×4", "3×5", "4×5", "4×6", "5×7", "6×8"],
  MQ: ["2×4", "3×6", "4×8", "5×10"],
  Baguette: ["2×4", "3×5", "3×6", "4×8"],
  Heart: ["4×4", "5×5", "6×6", "8×8"],
  Princess: ["2×2", "3×3", "4×4", "5×5"],
};

const getStoneSizeOptions = (description: string) => {
  const normalized = description.trim().toLowerCase();
  if (normalized.startsWith("round")) return ["0.80", "0.90", "1.00", "1.10", "1.20", "1.30", "1.40", "1.50", "1.75", "2.00", "2.25", "2.50", "2.75", "3.00", "3.25", "3.50", "4.00", "4.50", "5.00", "6.00", "7.00", "8.00", "10.00"];
  if (normalized.startsWith("oval") || normalized.startsWith("ovel")) return ["2x3", "3x4", "4x5", "5x4", "6x4", "7x5", "8x6", "9x7", "10x8", "12x10", "14x10"];
  if (normalized.startsWith("pear")) return ["2x3", "3x4", "3x5", "4x5", "4x6", "5x7", "6x8", "7x9"];
  if (normalized.startsWith("pan")) return ["2x3", "3x4", "3x5", "4x5", "4x6", "5x7", "6x8", "7x9", "8x10"];
  if (normalized === "g nano" || normalized.startsWith("g nano ")) return ["2x3", "3x4", "3x5", "4x5", "4x6", "5x7", "6x8", "7x9"];
  if (normalized.startsWith("mq")) return ["2x4", "3x6", "4x8", "5x10", "6x12", "7x14", "8x16"];
  if (normalized.startsWith("baguette")) return ["2x4", "3x5", "3x6", "4x8", "5x10"];
  if (normalized.startsWith("heart")) return ["4x4", "5x5", "6x6", "8x8", "10x10"];
  if (normalized.startsWith("princess")) return ["2x2", "3x3", "4x4", "5x5", "6x6"];
  if (normalized.includes("pota") && normalized.includes("nano")) {
    if (normalized.includes("ovel")) return ["2x3", "3x4", "4x5", "5x4", "6x4", "7x5", "8x6", "9x7", "10x8", "12x10", "14x10"];
    if (normalized.includes("pan")) return ["2x3", "3x4", "3x5", "4x5", "4x6", "5x7", "6x8", "7x9", "8x10", "10x12"];
    if (normalized.includes("mq")) return ["2x4", "3x6", "4x8", "5x10", "6x12", "7x14", "8x16"];
    if (normalized.includes("g nano")) return ["2x3", "3x4", "3x5", "4x5", "4x6", "5x7", "6x8", "7x9"];
    return ["1.00", "1.20", "1.50", "1.75", "2.00", "2.25", "2.50", "2.75", "3.00", "3.25", "3.50", "3.75", "4.00", "4.50", "5.00", "6.00", "7.00", "8.00", "10.00"];
  }
  return STONE_SIZE_OPTIONS;
};

const normalizeStoneSize = (value: string) => value.trim().toLowerCase().replace(/[×*]/g, "x").replace(/\s+/g, "");

const isValidStoneSize = (description: string, size: string) => {
  if (!size.trim()) return true;
  return getStoneSizeOptions(description).some((option) => normalizeStoneSize(option) === normalizeStoneSize(size));
};

const getStoneNameSuggestions = (query: string) => {
  const normalized = query.trim().toLowerCase();
  const uniqueOptions = Array.from(new Set(STONE_NAME_OPTIONS));
  if (!normalized) {
    return uniqueOptions;
  }
  return uniqueOptions
    .filter((option) => option.toLowerCase().includes(normalized))
    .sort((left, right) => {
      const leftText = left.toLowerCase();
      const rightText = right.toLowerCase();
      const leftStarts = leftText.startsWith(normalized) ? 0 : 1;
      const rightStarts = rightText.startsWith(normalized) ? 0 : 1;
      if (leftStarts !== rightStarts) return leftStarts - rightStarts;
      return leftText.length - rightText.length;
    });
};

type ProductDetailRow = {
  id: string;
  label: string;
  value: string;
};

type ProductDetailEdit = {
  artNo: string;
  partyName: string;
  grossWeight: string;
  stonesCount: string;
  stoneSettingCost: string;
  polishCost: string;
  totalCost: string;
  productDetailRows: ProductDetailRow[];
  deletedProductDetailLabels: string[];
};

function isWorksheetRowEmpty(row: WorksheetRow) {
  return !row.description.trim() && !row.size.trim() && !row.qty && !row.rate && !row.setChrg;
}

type OrderEstimateState = {
  details: {
    designNo: string;
    jobName: string;
    color: string;
    category: string;
    qty: number;
    status: string;
    date: string;
    rodiumWeight: number;
    rodiumRate: number;
    grossWeight: number;
    makingChargeRate: number;
    polishRate: number;
  };
  rows: WorksheetRow[];
  footerRows?: FooterFormulaRow[];
  locked: boolean;
  showDetails: boolean;
  images: {
    cad: string;
    sample: string;
  };
};

type ImageViewerState = {
  src: string;
  title: string;
  x: number;
  y: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  dragging: boolean;
  dragStartX: number;
  dragStartY: number;
  baseOffsetX: number;
  baseOffsetY: number;
} | null;

type GalleryEntry = {
  key: "cad" | "sample";
  title: string;
  src: string;
  alt: string;
  emptyLabel: string;
};

const DEFAULT_DATE = "25-05-2026";

const CATLOG_OPTIONS = [
  "Sun & Moon",
  "Headset",
  "Jada",
  "Hair Clip",
  "Kuppulu",
  "Ragidi",
  "Tikka",
  "Tops",
  "Ear Rings",
  "Jumki",
  "Mattal",
  "Ear Set",
  "Ear Cuffs",
  "Champaswaralu",
  "Nose Pin",
  "Addigai",
  "Jigini",
  "Chowker",
  "Necklace",
  "Mini Haram",
  "Haram",
  "Ball Jigini, Necklace, Haram",
  "Pendent Set",
  "Tiger Nail Pendent",
  "Mothi Mala",
  "Beads Mala",
  "BBC Pendent",
  "Baju Band",
  "Vankey",
  "Chain Belt",
  "Vaddanam",
  "Saree Pin",
  "Bangle",
  "Bracelet",
  "Kada",
  "Finger Ring",
  "Only Balls",
  "Pocket Brooch",
];

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseProductDateValue(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  const time = parsed.getTime();
  return Number.isFinite(time) ? time : null;
}

function parseDateInputBoundary(value: string, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  const time = parsed.getTime();
  return Number.isFinite(time) ? time : null;
}

function formatValue(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "";
}

function createProductDetailRowId() {
  return `detail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildProductDetailRows(values: Array<[string, string]>) {
  return values.map(([label, value], index) => ({
    id: `detail-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label,
    value,
  }));
}

function isMeaningfulNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) && parsed > 0;
}

function pickNumberValue(preferred: unknown, fallback: unknown) {
  return isMeaningfulNumber(preferred) ? toNumber(preferred, 0) : toNumber(fallback, 0);
}

function pickTextValue(preferred: unknown, fallback: string) {
  const text = String(preferred ?? "").trim();
  return text ? text : fallback;
}

function mergeDetailEditWithDefaults(
  saved: Partial<ProductDetailEdit> | null | undefined,
  defaults: ProductDetailEdit,
  loadedState?: Partial<OrderEstimateState["details"]> | null
): ProductDetailEdit {
  const grossWeight = pickNumberValue(saved?.grossWeight, defaults.grossWeight);
  const stonesCount = pickNumberValue(saved?.stonesCount, defaults.stonesCount);
  const stoneSettingCost = pickNumberValue(saved?.stoneSettingCost, defaults.stoneSettingCost);
  const polishCost = pickNumberValue(saved?.polishCost, defaults.polishCost);
  const totalCost = pickNumberValue(saved?.totalCost, defaults.totalCost);
  const partyName = pickTextValue(saved?.partyName, defaults.partyName);
  const artNo = pickTextValue(saved?.artNo, defaults.artNo);
  const productDetailRows = normalizeProductDetailRows(
    saved?.productDetailRows ?? defaults.productDetailRows,
    buildProductDetailRows([
      ["Art No", artNo],
      ["Party Name", partyName],
      ["Total Gross Weight", formatValue(loadedState?.grossWeight ?? grossWeight, 2)],
      ["Ghat Rate", formatValue(loadedState?.makingChargeRate ?? 0, 2)],
      ["1pc Stone Setting Cost", formatValue(stoneSettingCost, 2)],
      ["Total Stones Count", formatValue(stonesCount, 2)],
      ["Total Kg of Charge", formatValue(stoneSettingCost, 2)],
      ["Polish Cost", formatValue(loadedState?.polishRate ?? polishCost, 2)],
      ["Grand total", formatValue(totalCost, 2)],
    ]),
    saved?.deletedProductDetailLabels ?? defaults.deletedProductDetailLabels
  );

  return {
    ...defaults,
    ...saved,
    artNo,
    partyName,
    grossWeight: formatValue(grossWeight, 2),
    stonesCount: formatValue(stonesCount, 2),
    stoneSettingCost: formatValue(stoneSettingCost, 2),
    polishCost: formatValue(polishCost, 2),
    totalCost: formatValue(totalCost, 2),
    productDetailRows,
    deletedProductDetailLabels: saved?.deletedProductDetailLabels ?? defaults.deletedProductDetailLabels,
  };
}

function getSeedOrderState(artNumber: string) {
  const key = artNumber.trim().toLowerCase();
  const item = (orderStateData as Array<{ art_number?: string; payload_json?: string }>).find(
    (entry) => String(entry.art_number ?? "").trim().toLowerCase() === key
  );
  if (!item?.payload_json) return null;
  try {
    return JSON.parse(item.payload_json) as {
      state?: Partial<OrderEstimateState>;
      detailEdit?: Partial<ProductDetailEdit>;
    };
  } catch {
    return null;
  }
}

function isSuspiciousDetailEdit(detailEdit?: Partial<ProductDetailEdit> | null) {
  if (!detailEdit) return true;
  return (
    !isMeaningfulNumber(detailEdit.stonesCount) ||
    !isMeaningfulNumber(detailEdit.stoneSettingCost) ||
    !isMeaningfulNumber(detailEdit.totalCost) ||
    toNumber(detailEdit.totalCost, 0) < 1000
  );
}

function readProductDetailValue(rows: ProductDetailRow[], label: string, fallback = "") {
  const normalizedLabel = label.trim().toLowerCase();
  const row = rows.find((item) => item.label.trim().toLowerCase() === normalizedLabel);
  return row?.value.trim() || fallback;
}

function readProductDetailValueAny(rows: ProductDetailRow[], labels: string[], fallback = "") {
  for (const label of labels) {
    const value = readProductDetailValue(rows, label, "");
    if (value) return value;
  }
  return fallback;
}

function isEmptyProductDetailValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === "detail value";
}

function isMissingTextValue(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return !normalized || normalized === "-" || normalized === "detail value";
}

function isMissingPositiveNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return !Number.isFinite(parsed) || parsed <= 0;
}

const PRODUCT_DETAIL_BASE_ALIASES = [
  ["Art No", "ART NO"],
  ["Party Name", "PARTY NAME"],
  ["Total Gross Weight", "GHAT WEIGHT", "Ghat Weight", "TOTAL GROSS WEIGHT"],
  ["Ghat Rate", "GHAT RATE"],
  ["1pc Stone Setting Cost", "1PC STONE SETTING COST"],
  ["Total Stones Count", "STONE COUNT", "TOTAL STONES COUNT"],
  ["Total Kg of Charge", "TOTAL KG OF CHARGE"],
  ["Polish Cost", "POLISH COST"],
  ["Grand total", "GRAND TOTAL"],
];

const PRODUCT_DETAIL_FORMULA_LABELS = new Set([
  "total stones count",
  "stone count",
  "total kg of charge",
  "polish cost",
  "grand total",
]);

const PRODUCT_DETAIL_REMOVED_LABELS = new Set(["product name", "category", "stone type", "status"]);

function isProductDetailFormulaLabel(label: string) {
  return PRODUCT_DETAIL_FORMULA_LABELS.has(label.trim().toLowerCase());
}

function isMissingProductDetailRow(row: ProductDetailRow) {
  const label = row.label.trim().toLowerCase();
  if (["art no", "party name"].includes(label)) return isMissingTextValue(row.value);
  if (
    [
      "total gross weight",
      "ghat weight",
      "ghat rate",
      "1pc stone setting cost",
      "total stones count",
      "stone count",
      "total kg of charge",
      "polish cost",
      "grand total",
    ].includes(label)
  ) {
    return isMissingPositiveNumber(row.value);
  }
  return false;
}

function canonicalProductDetailBaseLabel(label: string) {
  const group = PRODUCT_DETAIL_BASE_ALIASES.find((aliases) =>
    aliases.some((alias) => alias.trim().toLowerCase() === label.trim().toLowerCase())
  );
  return (group?.[0] ?? "").trim().toLowerCase();
}

function normalizeProductDetailRows(existingRows: ProductDetailRow[], baseRows: ProductDetailRow[], deletedLabels: string[] = []) {
  const knownLabels = new Set(PRODUCT_DETAIL_BASE_ALIASES.flat().map((label) => label.trim().toLowerCase()));
  const deletedLabelSet = new Set(deletedLabels.map((label) => label.trim().toLowerCase()));
  const normalizedBaseRows = baseRows.filter((baseRow) => !deletedLabelSet.has(canonicalProductDetailBaseLabel(baseRow.label))).map((baseRow) => {
    if (isProductDetailFormulaLabel(baseRow.label)) return baseRow;
    const aliases = PRODUCT_DETAIL_BASE_ALIASES.find((group) =>
      group.some((label) => label.trim().toLowerCase() === baseRow.label.trim().toLowerCase())
    ) ?? [baseRow.label];
    const savedValue = readProductDetailValueAny(existingRows, aliases, "");
    return {
      ...baseRow,
      value: isEmptyProductDetailValue(savedValue) ? baseRow.value : savedValue,
    };
  });
  const customRows = existingRows.filter((row) => {
    const normalizedLabel = row.label.trim().toLowerCase();
    return normalizedLabel && !knownLabels.has(normalizedLabel) && !PRODUCT_DETAIL_REMOVED_LABELS.has(normalizedLabel);
  });
  return [...normalizedBaseRows, ...customRows];
}

function normalizeAssetPath(pathName?: string | null) {
  if (!pathName) return "";
  return pathName.startsWith("/") ? pathName : `/${pathName.replace(/^\/+/, "")}`;
}

function parseWeightPair(weightPerGrams?: string) {
  const [left, right] = String(weightPerGrams ?? "").split("*").map((part) => part.trim());
  return {
    grossWeight: toNumber(left, 0),
    sampleWeight: toNumber(right, 0),
  };
}

async function imageSourceToDataUrl(source: string) {
  if (!source) return "";
  if (source.startsWith("data:")) return source;
  const response = await fetch(source);
  if (!response.ok) return "";
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function ImageGalleryCard({
  entry,
  locked,
  onOpen,
  onUpload,
  onDownload,
  onDelete,
}: {
  entry: GalleryEntry;
  locked: boolean;
  onOpen: (src: string, title: string) => void;
  onUpload: (kind: "cad" | "sample", file?: File | null) => void;
  onDownload: (src: string) => void;
  onDelete: (kind: "cad" | "sample") => void;
}) {
  return (
    <article className="gallery-card">
      <div className="gallery-card-head">
        <h3>{entry.title}</h3>
        <button
          type="button"
          className="gallery-mini-action"
          onClick={() => onOpen(entry.src, entry.title)}
          disabled={!entry.src}
        >
          Open Full Screen Viewer
        </button>
      </div>

      <button
        type="button"
        className="gallery-image-wrap"
        onClick={() => onOpen(entry.src, entry.title)}
        disabled={!entry.src}
      >
        {entry.src ? (
          <img src={entry.src} alt={entry.alt} className="gallery-image" />
        ) : (
          <div className="gallery-placeholder">{entry.emptyLabel}</div>
        )}
      </button>

      {locked ? null : (
        <div className="gallery-actions">
          <label className="gallery-action upload">
            Add Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onUpload(entry.key, e.target.files?.[0])}
            />
          </label>
          <label className="gallery-action replace">
            Replace Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onUpload(entry.key, e.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            className="gallery-action"
            disabled={!entry.src}
            onClick={() => onDownload(entry.src)}
          >
            Download Image
          </button>
          <button
            type="button"
            className="gallery-action danger"
            disabled={!entry.src}
            onClick={() => onDelete(entry.key)}
          >
            Delete Image
          </button>
        </div>
      )}
    </article>
  );
}

function buildRows(product?: Product): WorksheetRow[] {
  if (product?.line_items?.length) {
    return product.line_items.map((item, index) => ({
      id: `row-${index + 1}`,
      description: item.description ?? "",
      size: item.size ?? "",
      qty: toNumber(item.qty, 0),
      rate: toNumber(item.rate, 0),
      setChrg: toNumber(item.set_chrg, 0),
    }));
  }
  return [
    { id: "row-1", description: "", size: "", qty: 0, rate: 0, setChrg: 0 },
    { id: "row-2", description: "", size: "", qty: 0, rate: 0, setChrg: 0 },
    { id: "row-3", description: "", size: "", qty: 0, rate: 0, setChrg: 0 },
  ];
}

function buildLocalState(product?: Product): OrderEstimateState {
  return {
    details: {
      designNo: product?.design_no ?? product?.art_number ?? "",
      jobName: product?.product_name ?? "",
      color: product?.stone_type ?? "",
      category: product?.category ?? "",
      qty: 1,
      status: product?.status ?? "",
      date: DEFAULT_DATE,
      rodiumWeight: 0,
      rodiumRate: 0,
      grossWeight: parseWeightPair(product?.weight_per_grams).grossWeight,
      makingChargeRate: 5,
      polishRate: toNumber(product?.polish_cost, 0),
    },
    rows: buildRows(product),
    footerRows: [],
    locked: true,
    showDetails: false,
    images: {
      cad: normalizeAssetPath(product?.cad_image),
      sample: normalizeAssetPath(product?.final_sample_image),
    },
  };
}

function safeArt(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams<{ art: string }>();
  const art = decodeURIComponent(safeArt(params?.art)).trim();
  const jumpSearchInputRef = useRef<HTMLInputElement | null>(null);
  const pageRef = useRef<HTMLElement | null>(null);
  const [products, setProducts] = useState<Product[]>(productsData as Product[]);
  const product = useMemo(() => {
    const list = products;
    const lowerArt = art.toLowerCase();
    return list.find((item) => {
      const candidates = [
        item.art_number,
        item.design_no,
        item.product_name,
        item.party_name,
        item.customer,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return candidates.some((value) => value === lowerArt || value.includes(lowerArt));
    });
  }, [art, products]);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const currentArt = product?.art_number ?? art;
  const [state, setState] = useState<OrderEstimateState>(() => buildLocalState(product));
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [storageStatus, setStorageStatus] = useState("Loading saved data...");
  const [imageEditOpen, setImageEditOpen] = useState(false);
  const [imageViewer, setImageViewer] = useState<ImageViewerState>(null);
  const [imageDraft, setImageDraft] = useState<{ cad: string; sample: string }>({
    cad: normalizeAssetPath(product?.cad_image),
    sample: normalizeAssetPath(product?.final_sample_image),
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        jumpSearchInputRef.current?.focus();
        jumpSearchInputRef.current?.select();
        return;
      }
      if (event.key === "Escape" && document.activeElement === jumpSearchInputRef.current) {
        event.preventDefault();
        setJumpQuery("");
        pageRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const templateFileSrc = normalizeAssetPath(product?.template_file);
  const [detailEdit, setDetailEdit] = useState<ProductDetailEdit>({
    artNo: product?.art_number ?? "",
    partyName: product?.party_name ?? product?.customer ?? "",
    grossWeight: "",
    stonesCount: "",
    stoneSettingCost: "",
    polishCost: "",
    totalCost: "",
    productDetailRows: [],
    deletedProductDetailLabels: [],
  });
  const [jumpQuery, setJumpQuery] = useState("");
  const [jumpMode, setJumpMode] = useState<"all" | "art_number" | "party_name" | "product_name" | "status" | "category">("all");
  const [jumpCatlog, setJumpCatlog] = useState("");
  const [jumpDateFrom, setJumpDateFrom] = useState("");
  const [jumpDateTo, setJumpDateTo] = useState("");
  const [selectedJumpArts, setSelectedJumpArts] = useState<Set<string>>(() => new Set());
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
  const [openFooterMenuId, setOpenFooterMenuId] = useState<string | null>(null);
  const lastSavedSnapshotRef = useRef("");
  const hydratedFromStorageRef = useRef(false);
  const dragRowIdRef = useRef<string | null>(null);
  const cadImageSrc = imageDraft.cad || normalizeAssetPath(product?.cad_image);
  const sampleImageSrc = imageDraft.sample || normalizeAssetPath(product?.final_sample_image);
  const galleryEntries: GalleryEntry[] = [
    {
      key: "cad",
      title: "CAD Image",
      src: cadImageSrc,
      alt: `${product?.art_number ?? currentArt} CAD`,
      emptyLabel: "No CAD image",
    },
    {
      key: "sample",
      title: "Sample Image",
      src: sampleImageSrc,
      alt: `${product?.art_number ?? currentArt} final sample`,
      emptyLabel: "No sample image",
    },
  ];

  const buildDefaultDetailEdit = () => {
    const { grossWeight } = parseWeightPair(product?.weight_per_grams);
    const productDetailRows = buildProductDetailRows([
      ["Art No", product?.art_number ?? currentArt],
      ["Party Name", product?.party_name ?? product?.customer ?? ""],
      ["Total Gross Weight", formatValue(grossWeight, 2)],
      ["Ghat Rate", "5.00"],
      ["1pc Stone Setting Cost", formatValue(toNumber(product?.stones_setting_cost, 0), 2)],
      ["Total Stones Count", formatValue(toNumber(product?.stones_count, 0), 2)],
      ["Total Kg of Charge", formatValue(toNumber(product?.stones_setting_cost, 0), 2)],
      ["Polish Cost", formatValue(toNumber(product?.polish_cost, 0), 2)],
      ["Grand total", formatValue(toNumber(product?.total_estimation_cost, 0), 2)],
    ]);
    return {
      artNo: product?.art_number ?? currentArt,
      partyName: product?.party_name ?? product?.customer ?? "",
      grossWeight: formatValue(grossWeight, 2),
      stonesCount: formatValue(toNumber(product?.stones_count, 0), 2),
      stoneSettingCost: formatValue(toNumber(product?.stones_setting_cost, 0), 2),
      polishCost: formatValue(toNumber(product?.polish_cost, 0), 2),
      totalCost: formatValue(toNumber(product?.total_estimation_cost, 0), 2),
      productDetailRows,
      deletedProductDetailLabels: [],
    };
  };

  useEffect(() => {
    const defaults = buildLocalState(product);
    setState(defaults);
    setImageDraft(defaults.images);
    const detailDefaults = buildDefaultDetailEdit();
    setDetailEdit(detailDefaults);
    setStorageStatus("Loading saved data...");
    setReady(false);
  }, [art]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImageViewer();
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    const closeMenus = (event: globalThis.PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-row-menu]")) return;
      setOpenRowMenuId(null);
      setOpenFooterMenuId(null);
    };
    window.addEventListener("pointerdown", closeMenus);
    return () => window.removeEventListener("pointerdown", closeMenus);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) return;
        const data = (await response.json()) as Product[];
        if (mounted && Array.isArray(data) && data.length) {
          setProducts(data);
        }
      } catch {
        // keep fallback data
      }
    }
    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadState() {
      try {
        const response = await fetch(`/api/order-state?art=${encodeURIComponent(currentArt)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Load failed with status ${response.status}`);
        }
        const data = (await response.json()) as {
          state?: OrderEstimateState | null;
          detailEdit?: typeof detailEdit | null;
        };
        if (!mounted) return;
        const loadedDefaults = buildDefaultDetailEdit();
        const seedOrderState = getSeedOrderState(currentArt);
        if (data.state) {
            const loadedState: OrderEstimateState = {
              ...data.state,
              locked: true,
              showDetails: false,
            };
            setState((prev) => ({
              ...prev,
              ...loadedState,
              details: {
                ...prev.details,
                ...(loadedState.details ?? {}),
              },
              footerRows: Array.isArray(loadedState.footerRows) ? loadedState.footerRows : prev.footerRows ?? [],
              images: {
                cad: normalizeAssetPath(loadedState.images?.cad ?? prev.images.cad),
                sample: normalizeAssetPath(loadedState.images?.sample ?? prev.images.sample),
              },
          }));
            setImageDraft({
              cad: normalizeAssetPath(loadedState.images?.cad ?? ""),
              sample: normalizeAssetPath(loadedState.images?.sample ?? ""),
            });
            const detailSource =
              !isSuspiciousDetailEdit(data.detailEdit) ? data.detailEdit : seedOrderState?.detailEdit ?? data.detailEdit ?? null;
            setDetailEdit((prev) => mergeDetailEditWithDefaults(detailSource ?? prev, loadedDefaults, loadedState.details));
            if (seedOrderState?.state?.rows?.length) {
              const seededState = seedOrderState.state;
              setState((prev) => ({
                ...prev,
                details: {
                  ...prev.details,
                  ...(seededState?.details ?? {}),
                },
                rows: (seededState?.rows as WorksheetRow[]) ?? prev.rows,
                footerRows: Array.isArray(seededState?.footerRows) ? (seededState.footerRows as FooterFormulaRow[]) : prev.footerRows ?? [],
                images: {
                  cad: normalizeAssetPath(seededState?.images?.cad ?? loadedState.images?.cad ?? prev.images.cad),
                  sample: normalizeAssetPath(seededState?.images?.sample ?? loadedState.images?.sample ?? prev.images.sample),
                },
              }));
            }
            lastSavedSnapshotRef.current = JSON.stringify({
              state: loadedState,
              detailEdit: detailSource ?? null,
            });
            hydratedFromStorageRef.current = true;
            setStorageStatus("Loaded from storage");
        } else {
            hydratedFromStorageRef.current = false;
            setStorageStatus("No saved data found");
            const fallbackDefaults = buildDefaultDetailEdit();
            setDetailEdit(fallbackDefaults);
            void saveState(true, true).catch(() => {
              // Keep defaults even if the seed save fails.
            });
        }
      } catch {
        // Keep defaults if shared state fails.
        hydratedFromStorageRef.current = false;
        setStorageStatus("Storage load failed");
      } finally {
        if (mounted) setReady(true);
      }
    }
    if (currentArt) loadState();
    return () => {
      mounted = false;
    };
  }, [currentArt]);

  useEffect(() => {
    if (!product) return;
    const { grossWeight, sampleWeight } = parseWeightPair(product.weight_per_grams);
    setDetailEdit((prev) => ({
      ...prev,
      artNo: product.art_number ?? prev.artNo,
      partyName: product.party_name ?? product.customer ?? prev.partyName,
      grossWeight: prev.grossWeight || formatValue(grossWeight, 2),
      stonesCount: prev.stonesCount || formatValue(toNumber(product.stones_count, 0), 2),
      stoneSettingCost: prev.stoneSettingCost || formatValue(toNumber(product.stones_setting_cost, 0), 2),
      polishCost: prev.polishCost || formatValue(toNumber(product.polish_cost, 0), 2),
      totalCost: prev.totalCost || formatValue(toNumber(product.total_estimation_cost, 0), 2),
      productDetailRows: normalizeProductDetailRows(
        prev.productDetailRows,
        buildProductDetailRows([
          ["Art No", product.art_number ?? ""],
          ["Party Name", product.party_name ?? product.customer ?? ""],
          ["Total Gross Weight", formatValue(grossWeight, 2)],
          ["Ghat Rate", formatValue(state.details.makingChargeRate, 2)],
          ["1pc Stone Setting Cost", formatValue(toNumber(product.stones_setting_cost, 0), 2)],
          ["Total Stones Count", formatValue(toNumber(product.stones_count, 0), 2)],
          ["Total Kg of Charge", formatValue(toNumber(product.stones_setting_cost, 0), 2)],
          ["Polish Cost", formatValue(toNumber(product.polish_cost, 0), 2)],
          ["Grand total", formatValue(toNumber(product.total_estimation_cost, 0), 2)],
        ]),
        prev.deletedProductDetailLabels
      ),
    }));
    if (!hydratedFromStorageRef.current) {
      setImageDraft((prev) => ({
        cad: prev.cad || normalizeAssetPath(product.cad_image),
        sample: prev.sample || normalizeAssetPath(product.final_sample_image),
      }));
    }
  }, [product]);

  const rowsWithTotals = useMemo(() => {
    return state.rows.map((row) => {
      const stoneRate = row.qty * row.rate;
      const totalCharge = row.qty * row.setChrg;
      return { ...row, stoneRate, totalCharge };
    });
  }, [state.rows]);
  const footerRowsWithTotals = useMemo(() => {
    return (state.footerRows ?? []).map((row) => ({
      ...row,
      stoneRate: row.qty * row.rate,
      totalCharge: row.qty * row.setChrg,
      includeInGrandTotal: row.includeInGrandTotal === true,
    }));
  }, [state.footerRows]);

  const totalKgStone = useMemo(
    () => rowsWithTotals.reduce((sum, row) => sum + row.stoneRate, 0),
    [rowsWithTotals]
  );
  const totalStoneCount = useMemo(
    () => rowsWithTotals.reduce((sum, row) => sum + row.qty, 0),
    [rowsWithTotals]
  );
  const totalChargeBase = useMemo(
    () => rowsWithTotals.reduce((sum, row) => sum + row.totalCharge, 0),
    [rowsWithTotals]
  );
  const polishQty = state.details.qty || 0;
  const grossWeight = state.details.grossWeight;
  const rodiumWeight = grossWeight;
  const rodiumRate = state.details.rodiumRate || 0;
  const shouldShowRodiumRow = !state.locked;
  const sampleWeight = parseWeightPair(product?.weight_per_grams).sampleWeight;
  const makingChargeRate = state.details.makingChargeRate;
  const polishRate = state.details.polishRate;
  const productDetailRowsForView = detailEdit.productDetailRows;
  const detailArtNo = readProductDetailValueAny(productDetailRowsForView, ["ART NO", "Art No"], detailEdit.artNo.trim() || currentArt);
  const detailPartyName = readProductDetailValueAny(
    productDetailRowsForView,
    ["PARTY NAME", "Party Name"],
    detailEdit.partyName.trim() || product?.party_name || product?.customer || "-"
  );
  const detailStoneSettingCost = readProductDetailValueAny(
    productDetailRowsForView,
    ["1PC STONE SETTING COST", "1pc Stone Setting Cost"],
    detailEdit.stoneSettingCost
  );
  const stoneSettingCostOnePc = detailStoneSettingCost.trim()
    ? toNumber(detailStoneSettingCost, totalChargeBase)
    : totalChargeBase;
  const rodiumValue = rodiumWeight * rodiumRate;
  const makingChargeValue = grossWeight * makingChargeRate;
  const polishValue = polishQty * polishRate;
  const totalKgOnePcCharge = totalChargeBase + rodiumValue + makingChargeValue + polishValue;
  const totalKgStoneForQty = totalKgStone * polishQty;
  const totalKgGramsOnePcCharge = totalKgOnePcCharge * polishQty;
  const includedFooterTotal = useMemo(
    () => footerRowsWithTotals.reduce((sum, row) => sum + (row.includeInGrandTotal ? row.totalCharge : 0), 0),
    [footerRowsWithTotals]
  );
  const grandTotal = totalKgStoneForQty + totalKgGramsOnePcCharge + includedFooterTotal;
  const assembledProductDetailDefaults = buildProductDetailRows([
    ["Art No", detailArtNo],
    ["Party Name", detailPartyName],
    ["Total Gross Weight", readProductDetailValueAny(productDetailRowsForView, ["Total Gross Weight", "GHAT WEIGHT", "Ghat Weight"], formatValue(grossWeight, 2))],
    ["Ghat Rate", readProductDetailValueAny(productDetailRowsForView, ["Ghat Rate", "GHAT RATE"], formatValue(makingChargeRate, 2))],
    ["1pc Stone Setting Cost", readProductDetailValueAny(productDetailRowsForView, ["1pc Stone Setting Cost", "1PC STONE SETTING COST"], formatValue(stoneSettingCostOnePc, 2))],
    ["Total Stones Count", formatValue(totalStoneCount, 2)],
    ["Total Kg of Charge", formatValue(totalChargeBase, 2)],
    ["Polish Cost", formatValue(polishValue, 2)],
    ["Grand total", formatValue(grandTotal, 2)],
  ]);
  const assembledProductDetailRows = normalizeProductDetailRows(
    productDetailRowsForView,
    assembledProductDetailDefaults,
    detailEdit.deletedProductDetailLabels
  );

  const focusFirstMissingDetailField = () => {
    const selectors: Array<[boolean, string]> = [
      [!state.details.date.trim(), ".detail-shell .estimate-date-box"],
      [isMissingProductDetailRow(assembledProductDetailRows[0]), ".detail-shell .product-detail-edit-row:nth-of-type(1) .product-detail-value-input, .detail-shell .product-detail-read-row:nth-of-type(1)"],
      [isMissingProductDetailRow(assembledProductDetailRows[1]), ".detail-shell .product-detail-edit-row:nth-of-type(2) .product-detail-value-input, .detail-shell .product-detail-read-row:nth-of-type(2)"],
      [isMissingProductDetailRow(assembledProductDetailRows[2]), ".detail-shell .product-detail-edit-row:nth-of-type(3) .product-detail-value-input, .detail-shell .product-detail-read-row:nth-of-type(3)"],
      [isMissingProductDetailRow(assembledProductDetailRows[3]), ".detail-shell .product-detail-edit-row:nth-of-type(4) .product-detail-value-input, .detail-shell .product-detail-read-row:nth-of-type(4)"],
      [isMissingProductDetailRow(assembledProductDetailRows[4]), ".detail-shell .product-detail-edit-row:nth-of-type(5) .product-detail-value-input, .detail-shell .product-detail-read-row:nth-of-type(5)"],
      [isMissingProductDetailRow(assembledProductDetailRows[5]), ".detail-shell .product-detail-edit-row:nth-of-type(6) .product-detail-value-input, .detail-shell .product-detail-read-row:nth-of-type(6)"],
      [isMissingProductDetailRow(assembledProductDetailRows[6]), ".detail-shell .product-detail-edit-row:nth-of-type(7), .detail-shell .product-detail-read-row:nth-of-type(7)"],
      [isMissingProductDetailRow(assembledProductDetailRows[7]), ".detail-shell .product-detail-edit-row:nth-of-type(8), .detail-shell .product-detail-read-row:nth-of-type(8)"],
    ];
    for (const [missing, selector] of selectors) {
      if (!missing) continue;
      const target = document.querySelector<HTMLElement>(selector);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = target?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
      input?.focus();
      if (input && "select" in input) {
        input.select?.();
      }
      break;
    }
  };

  const openProduct = (nextArt: string) => {
    router.push(`/product/${encodeURIComponent(nextArt)}`);
  };

  const toggleSelectedJumpArt = (artNumber: string) => {
    setSelectedJumpArts((prev) => {
      const next = new Set(prev);
      if (next.has(artNumber)) {
        next.delete(artNumber);
      } else {
        next.add(artNumber);
      }
      return next;
    });
  };

  const jumpMatches = useMemo(() => {
    const q = jumpQuery.trim().toLowerCase();
    const catlog = jumpCatlog.trim().toLowerCase();
    const fromMs = parseDateInputBoundary(jumpDateFrom);
    const toMs = parseDateInputBoundary(jumpDateTo, true);
    if (!q && !catlog && fromMs === null && toMs === null) return [];
    return products
      .filter((item) => {
        const fields: Record<typeof jumpMode, Array<string | undefined>> = {
          all: [
            item.art_number,
            item.design_no,
            item.product_name,
            item.party_name,
            item.customer,
            item.stone_type,
            item.category,
            item.status,
          ],
          art_number: [item.art_number, item.design_no],
          party_name: [item.party_name, item.customer],
          product_name: [item.product_name],
          status: [item.status],
          category: [item.category],
        };
        const matchesSearch = !q || fields[jumpMode]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
        const matchesCatlog = !catlog || String(item.category ?? "").trim().toLowerCase() === catlog;
        const productDate = parseProductDateValue(item.updated_at) ?? parseProductDateValue(item.created_at);
        const matchesDate = (fromMs === null && toMs === null) || (
          productDate !== null &&
          (fromMs === null || productDate >= fromMs) &&
          (toMs === null || productDate <= toMs)
        );
        return matchesSearch && matchesCatlog && matchesDate;
      })
      .sort((a, b) => {
        const aArt = String(a.art_number ?? "").toLowerCase();
        const bArt = String(b.art_number ?? "").toLowerCase();
        const aStarts = aArt.startsWith(q) ? 0 : 1;
        const bStarts = bArt.startsWith(q) ? 0 : 1;
        return aStarts - bStarts || aArt.localeCompare(bArt);
      });
  }, [products, jumpQuery, jumpMode, jumpCatlog, jumpDateFrom, jumpDateTo]);

  const handleJumpSearch = () => {
    const next = jumpQuery.trim();
    if (!next) return;
    const q = next.toLowerCase();
    const exact = products.find((item) => {
      const artNo = String(item.art_number ?? "").toLowerCase();
      const designNo = String(item.design_no ?? "").toLowerCase();
      return artNo === q || designNo === q;
    });
    const matched = exact ?? jumpMatches[0];
    openProduct(matched?.art_number ?? next);
  };

  const handleJumpClear = () => {
    setJumpQuery("");
    setJumpMode("all");
    setJumpCatlog("");
    setJumpDateFrom("");
    setJumpDateTo("");
    setSelectedJumpArts(new Set());
    router.push("/");
  };

  const handleJumpDateFilterChange = (field: "from" | "to", value: string) => {
    if (field === "from") {
      setJumpDateFrom(value);
    } else {
      setJumpDateTo(value);
    }
  };

  const updateRow = (id: string, patch: Partial<WorksheetRow>) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  const createWorksheetRow = (): WorksheetRow => ({
    id: `row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: "",
    size: "",
    qty: 0,
    rate: 0,
    setChrg: 0,
  });

  const createFooterFormulaRow = (includeInGrandTotal = false): FooterFormulaRow => ({
    id: `footer-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: "NEW FORMULA",
    qty: 0,
    rate: 0,
    setChrg: 0,
    includeInGrandTotal,
  });

  const updateFooterRow = (id: string, patch: Partial<FooterFormulaRow>) => {
    setState((prev) => ({
      ...prev,
      footerRows: (prev.footerRows ?? []).map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  const addFooterRowAfter = (id?: string) => {
    const includeInGrandTotal = window.confirm(
      "Do you want to add this footer formula value in GRAND TOTAL?\n\nOK = Add in Grand Total\nCancel = Keep only in Product Details"
    );
    setState((prev) => {
      const footerRows = [...(prev.footerRows ?? [])];
      const nextRow = createFooterFormulaRow(includeInGrandTotal);
      if (!id) return { ...prev, footerRows: [...footerRows, nextRow] };
      const index = footerRows.findIndex((row) => row.id === id);
      footerRows.splice(index < 0 ? footerRows.length : index + 1, 0, nextRow);
      return { ...prev, footerRows };
    });
    setOpenFooterMenuId(null);
  };

  const deleteFooterRow = (id: string) => {
    setState((prev) => ({
      ...prev,
      footerRows: (prev.footerRows ?? []).filter((row) => row.id !== id),
    }));
    setOpenFooterMenuId(null);
  };

  const insertRowAt = (index: number) => {
    setState((prev) => ({
      ...prev,
      rows: [
        ...prev.rows.slice(0, Math.max(0, Math.min(index, prev.rows.length))),
        createWorksheetRow(),
        ...prev.rows.slice(Math.max(0, Math.min(index, prev.rows.length))),
      ],
    }));
  };

  const addRow = () => insertRowAt(Number.POSITIVE_INFINITY);

  const addRowAfter = (id: string) => {
    setState((prev) => {
      const index = prev.rows.findIndex((row) => row.id === id);
      if (index < 0) return prev;
      const rows = [...prev.rows];
      rows.splice(index + 1, 0, createWorksheetRow());
      return { ...prev, rows };
    });
  };

  const updateDetailField = (field: keyof OrderEstimateState["details"], value: string | number) => {
    setState((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [field]: typeof prev.details[field] === "number" ? toNumber(value, 0) : value,
      },
    }));
  };

  const syncProductDetailLegacyFields = (edit: ProductDetailEdit): ProductDetailEdit => ({
    ...edit,
    artNo: readProductDetailValueAny(edit.productDetailRows, ["ART NO", "Art No"], edit.artNo),
    partyName: readProductDetailValueAny(edit.productDetailRows, ["PARTY NAME", "Party Name"], edit.partyName),
    grossWeight: readProductDetailValueAny(edit.productDetailRows, ["GHAT WEIGHT", "Ghat Weight", "Total Gross Weight"], edit.grossWeight),
    stonesCount: readProductDetailValueAny(edit.productDetailRows, ["STONE COUNT", "Total Stones Count"], edit.stonesCount),
    stoneSettingCost: readProductDetailValueAny(edit.productDetailRows, ["1PC STONE SETTING COST", "1pc Stone Setting Cost"], edit.stoneSettingCost),
    polishCost: readProductDetailValueAny(edit.productDetailRows, ["POLISH COST", "Polish Cost"], edit.polishCost),
    totalCost: readProductDetailValueAny(edit.productDetailRows, ["GRAND TOTAL", "Grand total"], edit.totalCost),
  });

  const updateProductDetailRow = (id: string, field: "label" | "value", value: string) => {
    const currentRow = detailEdit.productDetailRows.find((row) => row.id === id);
    const nextLabel = field === "label" ? value : currentRow?.label ?? "";
    setDetailEdit((prev) => {
      const productDetailRows = prev.productDetailRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      );
      return syncProductDetailLegacyFields({ ...prev, productDetailRows });
    });
    if (field === "value") {
      const normalizedLabel = nextLabel.trim().toLowerCase();
      if (["total gross weight", "ghat weight"].includes(normalizedLabel)) {
        updateDetailField("grossWeight", value);
      }
      if (normalizedLabel === "ghat rate") {
        updateDetailField("makingChargeRate", value);
      }
      if (normalizedLabel === "polish cost") {
        updateDetailField("polishRate", value);
      }
    }
  };

  const addProductDetailRow = () => {
    setDetailEdit((prev) => ({
      ...prev,
      productDetailRows: [
        ...prev.productDetailRows,
        { id: createProductDetailRowId(), label: "NEW DETAIL", value: "" },
      ],
    }));
  };

  const deleteProductDetailRow = (id: string) => {
    setDetailEdit((prev) => {
      const rowToDelete = assembledProductDetailRows.find((row) => row.id === id) ?? prev.productDetailRows.find((row) => row.id === id);
      const baseLabel = rowToDelete ? canonicalProductDetailBaseLabel(rowToDelete.label) : "";
      const deletedProductDetailLabels = baseLabel
        ? Array.from(new Set([...prev.deletedProductDetailLabels, baseLabel]))
        : prev.deletedProductDetailLabels;
      return syncProductDetailLegacyFields({
        ...prev,
        deletedProductDetailLabels,
        productDetailRows: prev.productDetailRows.filter((row) => row.id !== id),
      });
    });
  };

  const deleteRow = (id: string) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.length > 1 ? prev.rows.filter((row) => row.id !== id) : prev.rows,
    }));
  };

  const moveRow = (id: string, direction: -1 | 1) => {
    setState((prev) => {
      const index = prev.rows.findIndex((row) => row.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.rows.length) return prev;
      const rows = [...prev.rows];
      [rows[index], rows[target]] = [rows[target], rows[index]];
      return { ...prev, rows };
    });
  };

  const moveRowTo = (fromId: string, toId: string) => {
    setState((prev) => {
      const fromIndex = prev.rows.findIndex((row) => row.id === fromId);
      const toIndex = prev.rows.findIndex((row) => row.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;
      const rows = [...prev.rows];
      const [moving] = rows.splice(fromIndex, 1);
      rows.splice(toIndex, 0, moving);
      return { ...prev, rows };
    });
  };

  const saveState = async (cleanupEmptyRows = false, skipValidation = false) => {
    if (!skipValidation && !state.details.date.trim()) {
      setStorageStatus("Complete the missing fields");
      focusFirstMissingDetailField();
      return;
    }
    if (!skipValidation && assembledProductDetailRows.some((row) => isMissingProductDetailRow(row))) {
      setStorageStatus("Complete the missing fields");
      focusFirstMissingDetailField();
      return;
    }
    const nonEmptyRows = state.rows.filter((row) => !isWorksheetRowEmpty(row));
    const rowsForSave = cleanupEmptyRows ? (nonEmptyRows.length ? nonEmptyRows : [createWorksheetRow()]) : state.rows;
    const payload: OrderEstimateState = {
      ...state,
      details: {
        ...state.details,
        rodiumWeight,
      },
      rows: rowsForSave,
      images: {
        cad: imageDraft.cad,
        sample: imageDraft.sample,
      },
    };
    setSaving(true);
    try {
      const response = await fetch(`/api/order-state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ art: detailArtNo, state: payload, detailEdit }),
      });
      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Save failed with status ${response.status}`);
      }
      if (product) {
        const productResponse = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upsert",
            product: {
              ...product,
              art_number: detailArtNo,
              design_no: detailArtNo,
              product_name: readProductDetailValue(productDetailRowsForView, "PRODUCT NAME", product.product_name ?? ""),
              party_name: detailPartyName,
              customer: detailPartyName,
              category: readProductDetailValue(productDetailRowsForView, "CATEGORY", payload.details.category),
              stone_type: readProductDetailValue(productDetailRowsForView, "STONE TYPE", product.stone_type ?? ""),
              status: readProductDetailValue(productDetailRowsForView, "STATUS", payload.details.status),
              weight_per_grams: `${readProductDetailValueAny(productDetailRowsForView, ["GHAT WEIGHT", "Ghat Weight", "Total Gross Weight"], formatValue(grossWeight, 2))} * ${formatValue(sampleWeight, 2)}`,
              stones_count: Number(totalStoneCount.toFixed(2)),
              stones_setting_cost: Number(totalChargeBase.toFixed(2)),
              polish_cost: Number(polishValue.toFixed(2)),
              total_estimation_cost: Number(grandTotal.toFixed(2)),
            },
          }),
        });
        if (!productResponse.ok) {
          const message = await productResponse.text().catch(() => "");
          throw new Error(message || `Product category save failed with status ${productResponse.status}`);
        }
        const productData = (await productResponse.json()) as { products?: Product[] };
        if (Array.isArray(productData.products)) {
          setProducts(productData.products);
        }
      }
      setState(payload);
      setStorageStatus("Saved");
    } catch (error) {
      console.error("saveState failed", error);
      setStorageStatus("Save failed");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    const snapshot = JSON.stringify({
      state: {
        ...state,
        images: {
          cad: imageDraft.cad,
          sample: imageDraft.sample,
        },
      },
      detailEdit,
    });
    if (snapshot === lastSavedSnapshotRef.current) return;
    const timer = window.setTimeout(() => {
      void saveState(false).then(() => {
        lastSavedSnapshotRef.current = snapshot;
      }).catch(() => {
        // saveState already updates the status and logs the failure
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [ready, state, detailEdit, imageDraft.cad, imageDraft.sample]);

  const handleImageUpload = (kind: "cad" | "sample", file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDraft((prev) => ({
        ...prev,
        [kind]: String(reader.result ?? ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const openImageViewer = (src: string, title: string) => {
    if (!src) return;
    setImageViewer({
      src,
      title,
      x: 50,
      y: 50,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      baseOffsetX: 0,
      baseOffsetY: 0,
    });
  };

  const closeImageViewer = () => setImageViewer(null);

  const updateViewerScale = (delta: number) => {
    setImageViewer((prev) => {
      if (!prev) return prev;
      const nextScale = Math.max(1, Math.min(5, Number((prev.scale + delta).toFixed(2))));
      return { ...prev, scale: nextScale };
    });
  };

  const handleViewerWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateViewerScale(event.deltaY > 0 ? -0.2 : 0.2);
  };

  const handleViewerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const pointerId = event.pointerId;
    const clientX = event.clientX;
    const clientY = event.clientY;
    setImageViewer((prev) => {
      if (!prev || prev.scale <= 1) return prev;
      target.setPointerCapture?.(pointerId);
      return {
        ...prev,
        dragging: true,
        dragStartX: clientX,
        dragStartY: clientY,
        baseOffsetX: prev.offsetX,
        baseOffsetY: prev.offsetY,
      };
    });
  };

  const handleViewerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setImageViewer((prev) => {
      if (!prev) return prev;
      const nextScale = prev.scale <= 1.05 ? 2.25 : prev.scale;
      const next: ImageViewerState = { ...prev, x, y, scale: nextScale };
      if (!prev.dragging || prev.scale <= 1) return next;
      const dx = event.clientX - prev.dragStartX;
      const dy = event.clientY - prev.dragStartY;
      return {
        ...next,
        offsetX: prev.baseOffsetX + dx,
        offsetY: prev.baseOffsetY + dy,
      };
    });
  };

  const handleViewerUp = (event?: ReactPointerEvent<HTMLDivElement>) => {
    if (event?.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    setImageViewer((prev) => (prev ? { ...prev, dragging: false } : prev));
  };

  const resetViewer = () => {
    setImageViewer((prev) => (prev ? { ...prev, scale: 1, offsetX: 0, offsetY: 0, dragging: false } : prev));
  };

  const downloadImage = (src: string) => {
    if (!src) return;
    window.open(src, "_blank", "noopener,noreferrer");
  };

  const waitForExportReady = async () => {
    await (document.fonts?.ready ?? Promise.resolve());
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  };

  const createExportSnapshot = () => {
    if (!sheetRef.current) return null;
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-100000px";
    host.style.top = "0";
    host.style.width = "1965px";
    host.style.background = "#fff";
    host.style.pointerEvents = "none";
    host.style.overflow = "visible";
    host.setAttribute("aria-hidden", "true");

    const sheet = sheetRef.current.cloneNode(true) as HTMLElement;
    sheet.classList.remove("export-mode");
    sheet.style.width = "1965px";
    sheet.style.maxWidth = "none";
    sheet.style.minHeight = "2720px";
    sheet.style.transform = "none";
    sheet.style.transformOrigin = "top left";
    sheet.style.boxSizing = "border-box";
    sheet.style.background = "#ffffff";
    host.appendChild(sheet);
    document.body.appendChild(host);
    return { host, sheet };
  };

  const deleteImage = (kind: "cad" | "sample") => {
    setImageDraft((prev) => ({ ...prev, [kind]: "" }));
  };

  const downloadPdf = async () => {
    let exportSnapshotHost: HTMLElement | null = null;
    try {
      setExporting(true);
      const snapshot = createExportSnapshot();
      if (!snapshot) return;
      exportSnapshotHost = snapshot.host;
      await waitForExportReady();
      const images = Array.from(snapshot.sheet.querySelectorAll("img"));
      await Promise.all(
        images.map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                image.onload = () => resolve();
                image.onerror = () => resolve();
              })
        )
      );
      const canvas = await html2canvas(snapshot.sheet, {
        scale: 1,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 1965,
        height: 2720,
        windowWidth: 1965,
        windowHeight: 2720,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = pageHeight;
      const imgWidth = (canvas.width / canvas.height) * imgHeight;
      const x = (pageWidth - imgWidth) / 2;
      pdf.addImage(imgData, "PNG", x, 12, imgWidth, imgHeight);
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${detailArtNo || currentArt || "art"}-details.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) {
      console.error("PDF download failed", error);
      alert("PDF download failed. Please try again.");
    } finally {
      exportSnapshotHost?.remove();
      setExporting(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      workbook.calcProperties.fullCalcOnLoad = true;
      const sheet = workbook.addWorksheet("Order Estimate");
      sheet.pageSetup = {
        orientation: "landscape",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        horizontalCentered: true,
        verticalCentered: false,
        margins: {
          left: 0.15,
          right: 0.15,
          top: 0.15,
          bottom: 0.15,
          header: 0,
          footer: 0,
        },
      };
      sheet.views = [{ showGridLines: false }];
      sheet.columns = [
        { width: 20 },
        { width: 14 },
        { width: 14 },
        { width: 10 },
        { width: 8 },
        { width: 10 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
      ];

      sheet.mergeCells("A1:I1");
      sheet.getCell("A1").value = `${detailArtNo || "ART"} ART NUMBER DETAILS`;
      sheet.getCell("A1").font = { bold: true, size: 14 };
      sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
      sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
      sheet.getRow(1).height = 22;

      const cadImageData = await imageSourceToDataUrl(imageDraft.cad || normalizeAssetPath(product?.cad_image));
      const sampleImageData = await imageSourceToDataUrl(imageDraft.sample || normalizeAssetPath(product?.final_sample_image));
      const topHeaderRow = sheet.addRow(["PRODUCT DETAILS", "", "", "CAD IMAGE", "", "", "SAMPLE IMAGE", "", ""]);
      sheet.mergeCells(`A${topHeaderRow.number}:C${topHeaderRow.number}`);
      sheet.mergeCells(`D${topHeaderRow.number}:F${topHeaderRow.number}`);
      sheet.mergeCells(`G${topHeaderRow.number}:I${topHeaderRow.number}`);
      topHeaderRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
      });
      topHeaderRow.height = 20;

      const topStartRow = topHeaderRow.number + 1;
      const excelProductDetailRows = assembledProductDetailRows;

      excelProductDetailRows.forEach((detailRow) => {
        const row = sheet.addRow([detailRow.label, detailRow.value, ""]);
        sheet.mergeCells(`B${row.number}:C${row.number}`);
        row.getCell(1).font = { bold: true };
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        row.height = 20;
      });

      const topEndRow = sheet.lastRow?.number ?? topStartRow;
      sheet.mergeCells(`D${topStartRow}:F${topEndRow}`);
      sheet.mergeCells(`G${topStartRow}:I${topEndRow}`);
      if (cadImageData) {
        const ext = cadImageData.startsWith("data:image/png") ? "png" : "jpeg";
        const imageId = workbook.addImage({ base64: cadImageData.split(",")[1] ?? "", extension: ext });
        sheet.addImage(imageId, { tl: { col: 3, row: topStartRow - 1 }, br: { col: 6, row: topEndRow } } as any);
      }
      if (sampleImageData) {
        const ext = sampleImageData.startsWith("data:image/png") ? "png" : "jpeg";
        const imageId = workbook.addImage({ base64: sampleImageData.split(",")[1] ?? "", extension: ext });
        sheet.addImage(imageId, { tl: { col: 6, row: topStartRow - 1 }, br: { col: 9, row: topEndRow } } as any);
      }

      const orderTitleRow = sheet.addRow(["ORDER ESTIMATE", "", "", "", "", "", "", "", ""]);
      sheet.mergeCells(`A${orderTitleRow.number}:I${orderTitleRow.number}`);
      orderTitleRow.getCell(1).font = { bold: true };
      orderTitleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      orderTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
      orderTitleRow.height = 20;

      const metaHeaderRow = sheet.addRow(["DESIGN NO", "", "JOB NAME", "", "COLOUR", "", "QTY", "STATUS", "CATEGORY"]);
      sheet.mergeCells(`A${metaHeaderRow.number}:B${metaHeaderRow.number}`);
      sheet.mergeCells(`C${metaHeaderRow.number}:D${metaHeaderRow.number}`);
      sheet.mergeCells(`E${metaHeaderRow.number}:F${metaHeaderRow.number}`);
      metaHeaderRow.getCell(1).font = { bold: true };
      metaHeaderRow.getCell(3).font = { bold: true };
      metaHeaderRow.getCell(5).font = { bold: true };
      metaHeaderRow.getCell(7).font = { bold: true };
      metaHeaderRow.getCell(8).font = { bold: true };
      metaHeaderRow.getCell(9).font = { bold: true };
      metaHeaderRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
      });
      metaHeaderRow.height = 18;

      const metaValueRow = sheet.addRow([
        detailArtNo,
        "",
        state.details.jobName || product?.product_name || "",
        "",
        state.details.color,
        "",
        state.details.qty,
        state.details.status,
        state.details.category,
      ]);
      sheet.mergeCells(`A${metaValueRow.number}:B${metaValueRow.number}`);
      sheet.mergeCells(`C${metaValueRow.number}:D${metaValueRow.number}`);
      sheet.mergeCells(`E${metaValueRow.number}:F${metaValueRow.number}`);
      metaValueRow.getCell(1).font = { bold: true };
      metaValueRow.getCell(3).font = { bold: true };
      metaValueRow.getCell(5).font = { bold: true };
      metaValueRow.getCell(7).font = { bold: true };
      metaValueRow.getCell(8).font = { bold: true };
      metaValueRow.getCell(9).font = { bold: true };
      metaValueRow.height = 20;

      const headerRow = sheet.addRow(["STONES", "", "SIZE", "QTY", "X", "RATE", "STN RATE", "SET CHRG", "TOTAL CHRG"]);
      sheet.mergeCells(`A${headerRow.number}:B${headerRow.number}`);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
      });
      headerRow.height = 18;

      rowsWithTotals.forEach((row, index) => {
        const excelRow = sheet.addRow([
          row.description,
          "",
          row.size,
          row.qty,
          "X",
          row.rate,
          "",
          row.setChrg,
          "",
        ]);
        sheet.mergeCells(`A${excelRow.number}:B${excelRow.number}`);
        excelRow.getCell(1).value = row.description;
        excelRow.getCell(3).value = row.size;
        excelRow.getCell(4).value = row.qty;
        excelRow.getCell(5).value = "X";
        excelRow.getCell(6).value = row.rate;
        excelRow.getCell(7).value = { formula: `D${excelRow.number}*F${excelRow.number}`, result: row.stoneRate };
        excelRow.getCell(8).value = row.setChrg;
        excelRow.getCell(9).value = { formula: `D${excelRow.number}*H${excelRow.number}`, result: row.totalCharge };
        excelRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        excelRow.getCell(4).alignment = { horizontal: "center" };
        excelRow.eachCell((cell, colNumber) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colNumber === 1 ? "FFFFFFFF" : "FFFDFDFD" },
          };
        });
        excelRow.height = 18;
      });

      const firstStoneRow = headerRow.number + 1;
      const lastStoneRow = firstStoneRow + rowsWithTotals.length - 1;
      const stoneRateTotalFormula = `SUM(G${firstStoneRow}:G${lastStoneRow})`;
      const totalChargeFormula = `SUM(I${firstStoneRow}:I${lastStoneRow})`;

      const footRows = [
        ["RODIUM WEIGHT", "", "", rodiumWeight, "X", rodiumRate, "", "", null],
        ["GAHT WEIGHT", "", "", grossWeight, "X", makingChargeRate, "", "", null],
        ["POLISH", "", "", polishQty, "X", polishRate, "", "", null],
        ["TOTAL K.G. 1 PC", "", "", "", "", null, "", "", ""],
        ["TOTAL QTY", "", "", state.details.qty, "", "", "", "", ""],
        ["TOTAL K.G.", "", "", "", "", null, "", "", ""],
        ["TOTAL K.G. GRAMS 1 PC", "", "", "", "", "", "", "", ""],
        ["TOTAL K.G. GRAMS", "", "", "", "", "", "", null, ""],
        ["GRAND TOTAL", "", null, "", "", "", "", "", ""],
      ];

      footRows.forEach((values) => {
        const row = sheet.addRow(values);
        sheet.mergeCells(`A${row.number}:B${row.number}`);
        row.getCell(1).font = { bold: true };
        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
        });
        row.height = 18;
      });

      const rodiumRow = lastStoneRow + 1;
      const gahtRow = rodiumRow + 1;
      const polishRow = gahtRow + 1;
      const totalKgOnePcRow = polishRow + 1;
      const totalQtyRow = totalKgOnePcRow + 1;
      const totalKgRow = totalQtyRow + 1;
      const totalKgGramsOnePcRow = totalKgRow + 1;
      const totalKgGramsRow = totalKgGramsOnePcRow + 1;
      const grandTotalRow = totalKgGramsRow + 1;

      sheet.getCell(`I${rodiumRow}`).value = { formula: `D${rodiumRow}*F${rodiumRow}`, result: rodiumValue };
      sheet.getCell(`I${gahtRow}`).value = { formula: `D${gahtRow}*F${gahtRow}`, result: makingChargeValue };
      sheet.getCell(`I${polishRow}`).value = { formula: `D${polishRow}*F${polishRow}`, result: polishValue };
      sheet.getCell(`G${totalKgOnePcRow}`).value = { formula: stoneRateTotalFormula, result: totalKgStone };
      sheet.getCell(`I${totalKgOnePcRow}`).value = {
        formula: `${totalChargeFormula}+I${rodiumRow}+I${gahtRow}+I${polishRow}`,
        result: totalKgOnePcCharge,
      };
      sheet.getCell(`G${totalKgRow}`).value = {
        formula: `G${totalKgOnePcRow}*D${totalQtyRow}`,
        result: totalKgStoneForQty,
      };
      sheet.getCell(`I${totalKgRow}`).value = {
        formula: `I${totalKgOnePcRow}*D${totalQtyRow}`,
        result: totalKgGramsOnePcCharge,
      };
      const customFooterRowsForExcel: Array<{ rowNumber: number; includeInGrandTotal: boolean }> = [];
      footerRowsWithTotals.forEach((footerRow) => {
        const row = sheet.addRow([footerRow.label, "", "", footerRow.qty, "X", footerRow.rate, "", footerRow.setChrg, ""]);
        customFooterRowsForExcel.push({ rowNumber: row.number, includeInGrandTotal: footerRow.includeInGrandTotal });
        sheet.mergeCells(`A${row.number}:B${row.number}`);
        row.getCell(1).font = { bold: true };
        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(7).value = { formula: `D${row.number}*F${row.number}`, result: footerRow.stoneRate };
        row.getCell(9).value = { formula: `D${row.number}*H${row.number}`, result: footerRow.totalCharge };
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
        });
        row.height = 18;
      });

      const includedCustomFooterFormula = customFooterRowsForExcel
        .filter((row) => row.includeInGrandTotal)
        .map((row) => `I${row.rowNumber}`)
        .join("+");
      const grandTotalFormula = includedCustomFooterFormula
        ? `G${totalKgRow}+I${totalKgRow}+${includedCustomFooterFormula}`
        : `G${totalKgRow}+I${totalKgRow}`;
      sheet.getCell(`H${totalKgGramsRow}`).value = {
        formula: grandTotalFormula,
        result: grandTotal,
      };
      sheet.getCell(`C${grandTotalRow}`).value = { formula: `H${totalKgGramsRow}`, result: grandTotal };

      sheet.getColumn(1).alignment = { horizontal: "left", vertical: "middle" };
      for (const col of [2, 3, 4, 5, 6, 7, 8, 9]) {
        sheet.getColumn(col).alignment = { horizontal: "center", vertical: "middle" };
      }

      sheet.eachRow((row) => {
        for (let col = 1; col <= 9; col += 1) {
          const cell = row.getCell(col);
          cell.border = {
            top: { style: "thin", color: { argb: "FF1F2937" } },
            left: { style: "thin", color: { argb: "FF1F2937" } },
            bottom: { style: "thin", color: { argb: "FF1F2937" } },
            right: { style: "thin", color: { argb: "FF1F2937" } },
          };
          if (typeof cell.value === "number") {
            cell.numFmt = "0.00";
          }
        }
      });

      const file = await workbook.xlsx.writeBuffer();
      const blob = new Blob([file], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${detailArtNo || currentArt || "art"}-details.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) {
      console.error("Excel download failed", error);
      alert("Excel download failed. Please try again.");
    }
  };

  const lockToggle = () => {
    const nextLocked = !state.locked;
    setState((prev) => ({ ...prev, locked: nextLocked }));
  };

  const productSearchHeader = (
    <section className="search-card search-only search-minimal detail-search-card">
      <div className="search-minimal-head">
        <div>
          <p className="eyebrow search-brand-title">Lakshmi Tool</p>
        </div>
        <div className="search-meta compact">
          <button type="button" className="search-meta-toggle" onClick={() => router.push("/")}>
            <span>Products</span>
            <strong>{products.length}</strong>
          </button>
          <button type="button" className="search-meta-action" onClick={() => router.push("/?add=1")}>
            Add new art number
          </button>
        </div>
      </div>

        <div className="search-bar search-bar-premium">
          <input
            ref={jumpSearchInputRef}
            value={jumpQuery}
            onChange={(e) => setJumpQuery(e.target.value)}
            placeholder="Search by art number, party name, item name, status, category..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleJumpSearch();
            }
          }}
        />
        <div className="search-actions">
          <button type="button" className="primary-btn" onClick={handleJumpSearch}>
            Search
          </button>
          <button type="button" className="delete-btn subtle-btn" onClick={handleJumpClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="search-modes compact-modes">
        <button type="button" className={`mode-chip ${jumpMode === "all" ? "active" : ""}`} onClick={() => setJumpMode("all")}>All fields</button>
        <button type="button" className={`mode-chip ${jumpMode === "art_number" ? "active" : ""}`} onClick={() => setJumpMode("art_number")}>Art number</button>
        <button type="button" className={`mode-chip ${jumpMode === "party_name" ? "active" : ""}`} onClick={() => setJumpMode("party_name")}>Party name</button>
        <button type="button" className={`mode-chip ${jumpMode === "product_name" ? "active" : ""}`} onClick={() => setJumpMode("product_name")}>Item name</button>
        <button type="button" className={`mode-chip ${jumpMode === "status" ? "active" : ""}`} onClick={() => setJumpMode("status")}>Status</button>
        <button type="button" className={`mode-chip ${jumpMode === "category" ? "active" : ""}`} onClick={() => setJumpMode("category")}>Category</button>
        <label className="solid-filter-box catlog-filter-box">
          <span>Catlog</span>
          <select
            value={jumpCatlog}
            onMouseDown={(event) => {
              event.preventDefault();
              router.push(`/?catlog=1&return=${encodeURIComponent(`/product/${encodeURIComponent(currentArt)}`)}`);
            }}
            onFocus={() => router.push(`/?catlog=1&return=${encodeURIComponent(`/product/${encodeURIComponent(currentArt)}`)}`)}
            onChange={(event) => setJumpCatlog(event.target.value)}
          >
            <option value="">All catlog</option>
            {CATLOG_OPTIONS.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </select>
        </label>
        <span className="solid-filter-box date-filter-box">
          <span>Date</span>
          <label>
            From
            <input
              type="date"
              className={`date-picker-input ${jumpDateFrom ? "has-date" : "empty-date"}`}
              value={jumpDateFrom}
              onFocus={(event) => (event.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
              onClick={(event) => (event.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
              onChange={(event) => handleJumpDateFilterChange("from", event.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              className={`date-picker-input ${jumpDateTo ? "has-date" : "empty-date"}`}
              value={jumpDateTo}
              onFocus={(event) => (event.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
              onClick={(event) => (event.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
              onChange={(event) => handleJumpDateFilterChange("to", event.target.value)}
            />
          </label>
        </span>
        <span className="mode-toolbar-spacer"></span>
        <button type="button" className="bulk-action-trigger detail-search-menu-trigger" aria-label="Product search menu" onClick={() => router.push("/")}>
          <svg className="hamburger-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14" />
            <path d="M5 12h14" />
            <path d="M5 17h14" />
          </svg>
        </button>
      </div>

      {jumpMatches.length > 0 && (
        <div className="search-results recommended-results">
          <div className="recommended-label">Recommended</div>
          {jumpMatches.map((item) => (
            <button type="button" className="result-row premium-result compact-search-result" key={item.art_number} onClick={() => openProduct(item.art_number)}>
              <span
                className={`select-chip ${selectedJumpArts.has(item.art_number) ? "selected" : ""}`}
                role="checkbox"
                aria-checked={selectedJumpArts.has(item.art_number)}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleSelectedJumpArt(item.art_number);
                }}
              >
                <span>Select</span><span className="select-check" aria-hidden="true"></span>
              </span>
              <div className="result-main">
                <strong>{item.product_name ?? "Untitled product"}</strong>
                <span>{item.art_number}</span>
              </div>
              <div>
                <span>Party</span>
                <strong>{item.party_name ?? item.customer ?? "-"}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{item.status ?? "-"}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{item.category ?? "-"}</strong>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );

  if (!product) {
    return (
      <main className="page-shell" ref={pageRef} tabIndex={-1}>
        {productSearchHeader}
        <section className="detail-shell">
          <div className="panel">
            <p className="eyebrow">Lakshmi Tool</p>
            <h1>Product not available</h1>
            <p className="lede">Unable to load product data right now.</p>
          </div>
        </section>
      </main>
    );
  }

  const { grossWeight: detailGross } = parseWeightPair(product.weight_per_grams);

  return (
    <main className="page-shell" ref={pageRef} tabIndex={-1}>
      {productSearchHeader}
      <section className={`detail-shell print-sheet compact-print ${exporting ? "export-mode" : ""}`} ref={sheetRef}>
        <div className="detail-top">
          <div className="panel detail-left">
            <div className="detail-topbar">
              <div className="detail-topbar-left">
                <p className="eyebrow">Product Details</p>
              </div>
              <div className="detail-actions">
                <button type="button" className="icon-btn" onClick={lockToggle} aria-label="Toggle edit lock">
                  {state.locked ? "🔒" : "🔓"}
                </button>
                <button type="button" className="icon-btn" onClick={() => saveState(true)} aria-label="Save product details">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button type="button" className="icon-btn" onClick={downloadPdf} aria-label="Download PDF">
                  Download PDF
                </button>
                <button type="button" className="icon-btn" onClick={downloadExcel} aria-label="Download Excel">
                  Download Excel
                </button>
                <span className={`storage-status ${storageStatus === "Loaded from storage" ? "status-good" : storageStatus.includes("fail") ? "status-bad" : ""}`}>
                  {storageStatus}
                </span>
              </div>
            </div>

            <h1 className="detail-title">{product.product_name ?? currentArt}</h1>
            <p className="lede">{product.notes ?? "Reference piece based on the provided CAD and sample image."}</p>

            <div className="detail-summary compact-detail-list">
              {assembledProductDetailRows.map((row) =>
                state.locked ? (
                  <div className={`summary-row product-detail-read-row ${isMissingProductDetailRow(row) ? "missing-detail-row" : ""}`} key={row.id}>
                    <span>{row.label || "-"}</span>
                    <strong className={isMissingProductDetailRow(row) ? "missing-detail-value" : ""}>{row.value || "-"}</strong>
                    {isMissingProductDetailRow(row) && <em className="missing-detail-indicator">Missing value</em>}
                  </div>
                ) : (
                  <div className={`summary-row composer-edit-row product-detail-edit-row ${isMissingProductDetailRow(row) ? "missing-detail-row" : ""}`} key={row.id}>
                    {isProductDetailFormulaLabel(row.label) ? (
                      <span className="product-detail-formula-label">{row.label || "-"}</span>
                    ) : (
                      <input
                        className="product-detail-label-input"
                        value={row.label}
                        placeholder="Detail name"
                        onChange={(event) => updateProductDetailRow(row.id, "label", event.target.value)}
                      />
                    )}
                    {isProductDetailFormulaLabel(row.label) ? (
                      <strong className={`product-detail-formula-value ${isMissingProductDetailRow(row) ? "missing-detail-value" : ""}`}>{row.value || "-"}</strong>
                    ) : (
                      <input
                        className={`composer-summary-input product-detail-value-input ${isMissingProductDetailRow(row) ? "missing-detail-input" : ""}`}
                        value={row.value}
                        placeholder="Detail value"
                        onChange={(event) => updateProductDetailRow(row.id, "value", event.target.value)}
                      />
                    )}
                    {isMissingProductDetailRow(row) && <em className="missing-detail-indicator">Missing value</em>}
                    <button
                      type="button"
                      className="product-detail-row-action"
                      onClick={() => deleteProductDetailRow(row.id)}
                      aria-label={`Delete ${row.label || "product detail"} row`}
                    >
                      Delete
                    </button>
                  </div>
                )
              )}
              {!state.locked && (
                <button type="button" className="product-detail-add-row" onClick={addProductDetailRow}>
                  Add Product Detail Row
                </button>
              )}
            </div>

            <div className="detail-actions-block detail-actions-block-inline">
              <button
                type="button"
                className="view-details-btn"
                onClick={() => setState((prev) => ({ ...prev, showDetails: !prev.showDetails }))}
              >
                {state.showDetails ? "Hide Details" : "View Details"}
              </button>
            </div>

          </div>

          <div className="panel image-panel">
            <h2>CAD and Final Sample</h2>
            <div className="gallery-intro">
              Click an image to open the full-screen viewer. Use the mouse wheel to zoom and drag when zoomed in.
            </div>
            <div className="image-gallery-grid">
              {galleryEntries.map((entry) => (
                <ImageGalleryCard
                  key={entry.key}
                  entry={entry}
                  locked={state.locked}
                  onOpen={openImageViewer}
                  onUpload={handleImageUpload}
                  onDownload={downloadImage}
                  onDelete={deleteImage}
                />
              ))}
            </div>
          </div>
        </div>

        {state.showDetails && (
          <div className="order-panel">
            <div className="worksheet-head order-estimate-head">
              <div>
                <h2>Order Estimate</h2>
              </div>
              <div className="worksheet-head-actions">
                <input
                  className={`estimate-date-box ${!state.details.date.trim() ? "invalid-stone-input" : ""}`}
                  value={state.details.date}
                  placeholder="Date"
                  disabled={state.locked}
                  onChange={(e) => updateDetailField("date", e.target.value)}
                />
                <button type="button" className="primary-btn" onClick={addRow} disabled={state.locked}>
                  Add Row
                </button>
              </div>
            </div>

            <table className="estimate-table excel-table order-estimate-table" role="table" aria-label="Order estimate spreadsheet">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <tbody>
                <tr className="worksheet-title-row">
                  <th colSpan={9}>ORDER ESTIMATE</th>
                </tr>
                <tr className="estimate-top-row">
                  <th colSpan={2}>DESIGN NO</th>
                  <th colSpan={2}>JOB NAME</th>
                  <th colSpan={2}>COLOUR</th>
                  <th>QTY</th>
                  <th>STATUS</th>
                  <th>CATEGORY</th>
                </tr>
                <tr className="estimate-meta-values">
                  <td colSpan={2}>
                    <input
                      value={state.details.designNo}
                      disabled={state.locked}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          details: { ...prev.details, designNo: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td colSpan={2}>
                    <input
                      value={state.details.jobName}
                      disabled={state.locked}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          details: { ...prev.details, jobName: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td colSpan={2}>
                    <input
                      value={state.details.color}
                      disabled={state.locked}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          details: { ...prev.details, color: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={state.details.qty}
                      disabled={state.locked}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          details: { ...prev.details, qty: toNumber(e.target.value, 0) },
                        }))
                      }
                    />
                  </td>
                  <td>
                    {state.locked ? (
                      <strong>{state.details.status}</strong>
                    ) : (
                      <input
                        value={state.details.status}
                        onChange={(e) => updateDetailField("status", e.target.value)}
                      />
                    )}
                  </td>
                  <td>
                    {state.locked ? (
                      <strong>{state.details.category}</strong>
                    ) : (
                      <input
                        value={state.details.category}
                        onChange={(e) => updateDetailField("category", e.target.value)}
                      />
                    )}
                  </td>
                </tr>
                <tr className="worksheet-head-row">
                  <th colSpan={2}>STONES</th>
                  <th>SIZE</th>
                  <th>QTY</th>
                  <th>X</th>
                  <th>RATE</th>
                  <th>STN RATE</th>
                  <th>SET CHRG</th>
                  <th>TOTAL CHRG</th>
                </tr>
                {rowsWithTotals.map((row, index) => (
                  <tr
                    key={row.id}
                    className="worksheet-data-row"
                  >
                    <td
                      colSpan={2}
                      className="description-cell"
                      draggable={!state.locked}
                      onDragStart={() => {
                        dragRowIdRef.current = row.id;
                      }}
                      onDragOver={(event) => {
                        if (state.locked) return;
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (state.locked) return;
                        event.preventDefault();
                        const draggedRowId = dragRowIdRef.current;
                        if (!draggedRowId || draggedRowId === row.id) return;
                        moveRowTo(draggedRowId, row.id);
                        dragRowIdRef.current = null;
                      }}
                      onDragEnd={() => {
                        dragRowIdRef.current = null;
                      }}
                    >
                      {state.locked ? (
                        <span className="locked-text-value" aria-label={`Description for row ${index + 1}`}>
                          {row.description || "-"}
                        </span>
                      ) : (
                        <>
                          <input
                            className={`table-input stone-search-input ${row.description && !STONE_NAME_OPTIONS.includes(row.description) ? "invalid-stone-input" : ""}`}
                            list={`stone-name-options-${row.id}`}
                            value={row.description}
                            onChange={(e) => updateRow(row.id, { description: e.target.value })}
                            aria-label={`Description for row ${index + 1}`}
                            placeholder="Select stone"
                          />
                          <datalist id={`stone-name-options-${row.id}`}>
                            {getStoneNameSuggestions(row.description).map((option) => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </>
                      )}
                      {!state.locked && (
                        <div className="order-row-actions" data-row-menu>
                          <button
                            type="button"
                            className="order-row-menu-btn"
                            aria-label={`Row actions for ${row.description || index + 1}`}
                            aria-expanded={openRowMenuId === row.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenRowMenuId((prev) => (prev === row.id ? null : row.id));
                            }}
                          >
                            ⋮
                          </button>
                          {openRowMenuId === row.id && (
                            <div className="order-row-menu-pop" onClick={(event) => event.stopPropagation()}>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => {
                                  moveRow(row.id, -1);
                                  setOpenRowMenuId(null);
                                }}
                              >
                                Move Up
                              </button>
                              <button
                                type="button"
                                disabled={index === rowsWithTotals.length - 1}
                                onClick={() => {
                                  moveRow(row.id, 1);
                                  setOpenRowMenuId(null);
                                }}
                              >
                                Move Down
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  addRowAfter(row.id);
                                  setOpenRowMenuId(null);
                                }}
                              >
                                Add Row
                              </button>
                              <span className="row-menu-separator" aria-hidden="true">
                                |
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteRow(row.id);
                                  setOpenRowMenuId(null);
                                }}
                              >
                                Delete Row
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {state.locked ? (
                        <span className="locked-text-value">{row.size || "-"}</span>
                      ) : (
                        <input
                          className={`table-input stone-search-input ${!isValidStoneSize(row.description, row.size) ? "invalid-stone-input" : ""}`}
                          list={`stone-size-options-${row.id}`}
                          value={row.size}
                          placeholder="Select size"
                          onChange={(e) => updateRow(row.id, { size: e.target.value })}
                        />
                      )}
                      <datalist id={`stone-size-options-${row.id}`}>
                        {getStoneSizeOptions(row.description).map((option) => (
                          <option key={option} value={option} />
                        ))}
                        {!isValidStoneSize(row.description, row.size) && (
                          <option value={row.size} />
                        )}
                      </datalist>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.qty}
                        disabled={state.locked}
                        onChange={(e) => updateRow(row.id, { qty: toNumber(e.target.value, 0) })}
                      />
                    </td>
                    <td className="worksheet-x-cell">X</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.rate}
                        disabled={state.locked}
                        onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value, 0) })}
                      />
                    </td>
                    <td className={`readonly-field ${!row.stoneRate ? "invalid-stone-input" : ""}`}>{row.stoneRate ? formatValue(row.stoneRate, 2) : ""}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.setChrg}
                        disabled={state.locked}
                        onChange={(e) => updateRow(row.id, { setChrg: toNumber(e.target.value, 0) })}
                      />
                    </td>
                    <td className={`readonly-field ${!row.totalCharge ? "invalid-stone-input" : ""}`}>{row.totalCharge ? formatValue(row.totalCharge, 2) : ""}</td>
                  </tr>
                ))}
                {shouldShowRodiumRow && (
                  <tr className="footer-data-row">
                    <th colSpan={2}>
                      <div className="stone-name-wrap footer-formula-label-wrap">
                        <span>RODIUM WEIGHT</span>
                        {!state.locked && (
                          <button
                            type="button"
                            className="stone-dots-btn vertical-dots-btn"
                            aria-label="Footer formula options"
                            onClick={() => setOpenFooterMenuId((current) => (current === "rodium-weight" ? null : "rodium-weight"))}
                          >
                            {"\u22EE"}
                          </button>
                        )}
                        {!state.locked && openFooterMenuId === "rodium-weight" && (
                          <div className="stone-row-menu" role="menu" data-row-menu>
                            <button type="button" role="menuitem" onClick={() => addFooterRowAfter()}>Add Formula Row</button>
                          </div>
                        )}
                      </div>
                    </th>
                    <td />
                    <td>
                      <span>{formatValue(rodiumWeight, 2)}</span>
                    </td>
                    <td>X</td>
                    <td>
                      {state.locked ? (
                        <span>{formatValue(rodiumRate, 2)}</span>
                      ) : (
                        <input
                          className="table-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={state.details.rodiumRate}
                          onChange={(e) => updateDetailField("rodiumRate", e.target.value)}
                        />
                      )}
                    </td>
                    <td />
                    <td />
                    <td className="readonly-field">{formatValue(rodiumValue, 2)}</td>
                  </tr>
                )}
                {footerRowsWithTotals.map((footerRow) => (
                  <tr className={`footer-data-row custom-footer-formula-row ${footerRow.includeInGrandTotal ? "" : "not-in-grand-total-row"}`} key={footerRow.id}>
                    <th colSpan={2}>
                      <div className="stone-name-wrap footer-formula-label-wrap">
                        {state.locked ? (
                          <span>{footerRow.label}</span>
                        ) : (
                          <input
                            className="table-input"
                            value={footerRow.label}
                            onChange={(event) => updateFooterRow(footerRow.id, { label: event.target.value })}
                          />
                        )}
                        {!footerRow.includeInGrandTotal && <em className="footer-grand-total-indicator">Not in Grand Total</em>}
                        {!state.locked && (
                          <button
                            type="button"
                            className="stone-dots-btn vertical-dots-btn"
                            aria-label="Footer formula row options"
                            onClick={() => setOpenFooterMenuId((current) => (current === footerRow.id ? null : footerRow.id))}
                          >
                            {"\u22EE"}
                          </button>
                        )}
                        {!state.locked && openFooterMenuId === footerRow.id && (
                          <div className="stone-row-menu" role="menu" data-row-menu>
                            <button type="button" role="menuitem" onClick={() => addFooterRowAfter(footerRow.id)}>Add Formula Row</button>
                            <button type="button" role="menuitem" onClick={() => deleteFooterRow(footerRow.id)}>Delete Formula Row</button>
                          </div>
                        )}
                      </div>
                    </th>
                    <td />
                    <td>
                      {state.locked ? (
                        <span>{formatValue(footerRow.qty, 2)}</span>
                      ) : (
                        <input className="table-input" type="number" step="0.01" value={footerRow.qty} onChange={(event) => updateFooterRow(footerRow.id, { qty: toNumber(event.target.value, 0) })} />
                      )}
                    </td>
                    <td>X</td>
                    <td>
                      {state.locked ? (
                        <span>{formatValue(footerRow.rate, 2)}</span>
                      ) : (
                        <input className="table-input" type="number" step="0.01" value={footerRow.rate} onChange={(event) => updateFooterRow(footerRow.id, { rate: toNumber(event.target.value, 0) })} />
                      )}
                    </td>
                    <td className={`readonly-field ${!footerRow.stoneRate ? "invalid-stone-input" : ""}`}>{formatValue(footerRow.stoneRate, 2)}</td>
                    <td>
                      {state.locked ? (
                        <span>{formatValue(footerRow.setChrg, 2)}</span>
                      ) : (
                        <input className="table-input" type="number" step="0.01" value={footerRow.setChrg} onChange={(event) => updateFooterRow(footerRow.id, { setChrg: toNumber(event.target.value, 0) })} />
                      )}
                    </td>
                    <td className={`readonly-field ${!footerRow.totalCharge ? "invalid-stone-input" : ""}`}>{formatValue(footerRow.totalCharge, 2)}</td>
                  </tr>
                ))}
                <tr className="footer-data-row">
                  <th colSpan={2}>GAHT WEIGHT</th>
                  <td />
                  <td>
                    {state.locked ? (
                      <span>{formatValue(grossWeight, 2)}</span>
                    ) : (
                      <input
                        className="table-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={state.details.grossWeight}
                        onChange={(e) => updateDetailField("grossWeight", e.target.value)}
                      />
                    )}
                  </td>
                  <td>X</td>
                  <td>
                    {state.locked ? (
                      <span>{formatValue(makingChargeRate, 2)}</span>
                    ) : (
                      <input
                        className="table-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={state.details.makingChargeRate}
                        onChange={(e) => updateDetailField("makingChargeRate", e.target.value)}
                      />
                    )}
                  </td>
                  <td />
                  <td />
                  <td className="readonly-field">{formatValue(makingChargeValue, 2)}</td>
                </tr>
                <tr className="footer-data-row">
                  <th colSpan={2}>POLISH</th>
                  <td />
                  <td>
                    <span>{formatValue(polishQty, 2)}</span>
                  </td>
                  <td>X</td>
                  <td>
                    {state.locked ? (
                      <span>{formatValue(polishRate, 2)}</span>
                    ) : (
                      <input
                        className="table-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={state.details.polishRate}
                        onChange={(e) => updateDetailField("polishRate", e.target.value)}
                      />
                    )}
                  </td>
                  <td />
                  <td />
                  <td className="readonly-field">{formatValue(polishValue, 2)}</td>
                </tr>
                <tr className="footer-data-row">
                  <th colSpan={2}>TOTAL K.G. 1 PC</th>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td className="readonly-field">{formatValue(totalKgStone, 2)}</td>
                  <td />
                  <td className="readonly-field">{formatValue(totalKgOnePcCharge, 2)}</td>
                </tr>
                <tr className="footer-data-row">
                  <th colSpan={2}>TOTAL QTY</th>
                  <td />
                  <td>{formatValue(state.details.qty, 2)}</td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
                <tr className="footer-data-row">
                  <th colSpan={2}>TOTAL K.G.</th>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td className="readonly-field">{formatValue(totalKgStoneForQty, 2)}</td>
                  <td />
                  <td className="readonly-field">{formatValue(totalKgGramsOnePcCharge, 2)}</td>
                </tr>
                <tr className="footer-data-row">
                  <th colSpan={2}>TOTAL K.G. GRAMS 1 PC</th>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
                <tr className="footer-data-row">
                  <th colSpan={2}>TOTAL K.G. GRAMS</th>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td className="readonly-field">{formatValue(grandTotal, 2)}</td>
                  <td />
                </tr>
                <tr className="footer-data-row grand-total-row">
                  <th colSpan={2}>GRAND TOTAL</th>
                  <td>{formatValue(grandTotal, 2)}</td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
      {imageViewer && (
        <div
          className="zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={imageViewer.title}
          onClick={closeImageViewer}
        >
          <div className="zoom-frame" onClick={(e) => e.stopPropagation()}>
            <div className="zoom-toolbar">
              <div className="zoom-title">{imageViewer.title}</div>
              <div className="zoom-tools">
                <button type="button" className="zoom-tool-btn" onClick={() => updateViewerScale(-0.25)}>
                  -
                </button>
                <span className="zoom-readout">{Math.round(imageViewer.scale * 100)}%</span>
                <button type="button" className="zoom-tool-btn" onClick={() => updateViewerScale(0.25)}>
                  +
                </button>
                <button type="button" className="zoom-tool-btn" onClick={resetViewer}>
                  Reset
                </button>
                <button type="button" className="zoom-close" onClick={closeImageViewer}>
                  Close
                </button>
              </div>
            </div>
            <div
              className="zoom-stage"
              onPointerDown={handleViewerDown}
              onPointerMove={handleViewerMove}
              onPointerUp={handleViewerUp}
              onPointerLeave={handleViewerUp}
              onWheel={handleViewerWheel}
            >
              <img
                src={imageViewer.src}
                alt={imageViewer.title}
                className="zoom-image zoom-image-active"
                style={{
                  transformOrigin: `${imageViewer.x}% ${imageViewer.y}%`,
                  transform: `translate(${imageViewer.offsetX}px, ${imageViewer.offsetY}px) scale(${imageViewer.scale})`,
                  cursor: imageViewer.scale > 1 ? (imageViewer.dragging ? "grabbing" : "grab") : "zoom-in",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

