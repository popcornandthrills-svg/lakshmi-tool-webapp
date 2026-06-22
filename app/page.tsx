"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import productsData from "../data/products.json";

type Product = {
  art_number: string;
  design_no?: string;
  product_name?: string;
  category?: string;
  stone_type?: string;
  status?: string;
  customer?: string;
  party_name?: string;
  notes?: string;
  final_sample_image?: string;
  cad_image?: string;
  weight_per_grams?: string;
  stones_count?: number;
  stones_setting_cost?: number;
  polish_name?: string;
  polish_cost?: number;
  total_estimation_cost?: number;
  template_file?: string;
  material_details?: unknown;
  line_items?: unknown;
  party_names?: string[];
  partner_quotes?: Array<{
    name?: string;
    amount?: number;
    image?: string;
  }>;
  created_at?: string;
  updated_at?: string;
};

type ProductDraft = {
  art_number: string;
  design_no: string;
  product_name: string;
  category: string;
  stone_type: string;
  status: string;
  customer: string;
  party_name: string;
  final_sample_image: string;
  cad_image: string;
  weight_per_grams: string;
  stones_count: string;
  stones_setting_cost: string;
  polish_name: string;
  polish_cost: string;
  total_estimation_cost: string;
  notes: string;
  template_file: string;
};

type ComposerRow = {
  description: string;
  size: string;
  qty: string;
  rate: string;
  setChrg: string;
};

type ComposerFooterFormulaRow = {
  id: string;
  label: string;
  qty: string;
  rate: string;
  setChrg: string;
  includeInGrandTotal?: boolean;
};

type ComposerEstimate = {
  details: {
    designNo: string;
    jobName: string;
    partyName: string;
    color: string;
    category: string;
    status: string;
    qty: string;
    date: string;
    cadImage: string;
    sampleImage: string;
    scanPdf: string;
    rodiumWeight: string;
    rodiumRate: string;
    grossWeight: string;
    makingChargeRate: string;
    stoneSettingCost: string;
    polishRate: string;
  };
  rows: ComposerRow[];
  footerRows: ComposerFooterFormulaRow[];
};

type ScanStatusKind = "idle" | "loading" | "success" | "error";

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
  if (normalized.startsWith("pan")) return ["2x3", "3x4", "3x5", "4x5", "4x6", "5x7", "6x8", "7x9", "8x10", "10x12"];
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

const EMPTY_COMPOSER_ROW: ComposerRow = {
  description: "",
  size: "",
  qty: "",
  rate: "",
  setChrg: "",
};

const EMPTY_COMPOSER_FOOTER_ROW: ComposerFooterFormulaRow = {
  id: "footer-1",
  label: "NEW FORMULA",
  qty: "",
  rate: "",
  setChrg: "",
  includeInGrandTotal: false,
};

const EMPTY_DRAFT: ProductDraft = {
  art_number: "",
  design_no: "",
  product_name: "",
  category: "",
  stone_type: "",
  status: "",
  customer: "",
  party_name: "",
  final_sample_image: "",
  cad_image: "",
  weight_per_grams: "",
  stones_count: "",
  stones_setting_cost: "",
  polish_name: "",
  polish_cost: "",
  total_estimation_cost: "",
  notes: "",
  template_file: "",
};

const EMPTY_COMPOSER: ComposerEstimate = {
  details: {
    designNo: "",
    jobName: "",
    partyName: "",
    color: "",
    category: "Necklace",
    status: "",
    qty: "",
    date: "",
    cadImage: "",
    sampleImage: "",
    scanPdf: "",
    rodiumWeight: "",
    rodiumRate: "",
    grossWeight: "",
    makingChargeRate: "",
    stoneSettingCost: "",
    polishRate: "",
  },
  rows: [
    { description: "ROUND W", size: "2.50", qty: "32", rate: "0.39", setChrg: "0.22" },
    { description: "1 pc", size: "", qty: "", rate: "", setChrg: "" },
    { description: "", size: "", qty: "", rate: "", setChrg: "" },
  ],
  footerRows: [],
};

function formatProductDate(value?: string) {
  if (!value) return "-";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function parseProductDateValue(value?: string) {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const directDate = new Date(normalized);
  if (!Number.isNaN(directDate.getTime())) return directDate.getTime();
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, day, month, year, hours = "0", minutes = "0"] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function parseDateInputBoundary(value: string, endOfDay = false) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function isMissingTextValue(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return !normalized || normalized === "-" || normalized === "detail value";
}

function isMissingPositiveNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return !Number.isFinite(parsed) || parsed <= 0;
}

function normalizeCatalogColorToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function colorTokenToHex(token: string) {
  const normalized = normalizeCatalogColorToken(token);
  if (!normalized) return "#cbd5e1";
  if (normalized.includes("green")) return "#16a34a";
  if (normalized.includes("red") || normalized.includes("ruby") || normalized.includes("pink")) return "#dc2626";
  if (normalized.includes("blue") || normalized.includes("sapphire")) return "#2563eb";
  if (normalized.includes("yellow") || normalized.includes("gold")) return "#ca8a04";
  if (normalized.includes("white") || normalized.includes("cz") || normalized.includes("diamond")) return "#f8fafc";
  if (normalized.includes("black") || normalized.includes("onyx")) return "#111827";
  if (normalized.includes("purple") || normalized.includes("amethyst")) return "#7c3aed";
  if (normalized.includes("orange")) return "#f97316";
  if (normalized.includes("brown")) return "#92400e";
  return "#64748b";
}

function extractCatalogColorTokens(product: Product) {
  const tokens = new Set<string>();
  const addTokens = (value?: string | null) => {
    String(value ?? "")
      .split(/,|\/|&| and |\+/i)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => tokens.add(item));
  };

  addTokens(product.stone_type);

  if (Array.isArray(product.material_details)) {
    product.material_details.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const record = item as Record<string, unknown>;
      addTokens(typeof record.type === "string" ? record.type : "");
      addTokens(typeof record.material === "string" ? record.material : "");
      addTokens(typeof record.color === "string" ? record.color : "");
    });
  }

  return Array.from(tokens).slice(0, 6);
}

function extractCatalogPartyNames(product: Product) {
  if (Array.isArray(product.party_names) && product.party_names.length > 0) {
    return product.party_names.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (Array.isArray(product.partner_quotes) && product.partner_quotes.length > 0) {
    return product.partner_quotes.map((item) => String(item?.name ?? "").trim()).filter(Boolean);
  }
  const raw = String(product.party_name ?? product.customer ?? "").trim();
  if (!raw) return [];
  return raw
    .split(/,|\/|&| and |\+/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractPartnerQuotes(product: Product) {
  if (Array.isArray(product.partner_quotes) && product.partner_quotes.length > 0) {
    return product.partner_quotes
      .map((item) => ({
        name: String(item?.name ?? "").trim(),
        amount: Number(item?.amount ?? product.total_estimation_cost ?? 0),
        image: String(item?.image ?? product.cad_image ?? product.final_sample_image ?? "").trim(),
      }))
      .filter((item) => item.name);
  }

  const partyNames = extractCatalogPartyNames(product);
  const fallbackAmount = Number(product.total_estimation_cost ?? 0);
  if (partyNames.length > 1) {
    return partyNames.map((name) => ({
      name,
      amount: fallbackAmount,
      image: String(product.cad_image ?? product.final_sample_image ?? "").trim(),
    }));
  }

  return [
    {
      name: partyNames[0] ?? String(product.party_name ?? product.customer ?? "-").trim(),
      amount: fallbackAmount,
      image: String(product.cad_image ?? product.final_sample_image ?? "").trim(),
    },
  ].filter((item) => item.name);
}

export default function Home() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const pageRef = useRef<HTMLElement | null>(null);
  const [products, setProducts] = useState<Product[]>(productsData as Product[]);
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"all" | "art_number" | "party_name" | "product_name" | "status" | "category">("all");
  const [selectedCatlog, setSelectedCatlog] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [catalogMode, setCatalogMode] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [composer, setComposer] = useState<ComposerEstimate>(EMPTY_COMPOSER);
  const [composerSaveStatus, setComposerSaveStatus] = useState("");
  const [composerActionMenuOpen, setComposerActionMenuOpen] = useState(false);
  const composerPdfInputRef = useRef<HTMLInputElement | null>(null);
  const composerExcelInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfScanStatus, setPdfScanStatus] = useState("");
  const [scanStatusKind, setScanStatusKind] = useState<ScanStatusKind>("idle");
  const [selectedArtNumbers, setSelectedArtNumbers] = useState<Set<string>>(() => new Set());
  const [openDownloadMenu, setOpenDownloadMenu] = useState<string | null>(null);
  const [openStoneMenu, setOpenStoneMenu] = useState<number | null>(null);
  const [openFooterMenuId, setOpenFooterMenuId] = useState<string | null>(null);
  const [draggingStoneIndex, setDraggingStoneIndex] = useState<number | null>(null);
  const [dragOverStoneIndex, setDragOverStoneIndex] = useState<number | null>(null);
  const loading = false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "1") {
      setCatalogMode(false);
      setShowComposer(true);
      setShowResults(false);
      return;
    }
    if (params.get("catlog") === "1") {
      setCatalogMode(true);
      setShowComposer(false);
      setShowResults(true);
      return;
    }
    setCatalogMode(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      if (event.key === "Escape") {
        if (document.activeElement === searchInputRef.current) {
          event.preventDefault();
          setQuery("");
          pageRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    if (!openDownloadMenu) return;
    const closeMenuOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(".bulk-action-menu, .row-download-menu")) return;
      setOpenDownloadMenu(null);
    };
    document.addEventListener("pointerdown", closeMenuOnOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", closeMenuOnOutsideClick);
    };
  }, [openDownloadMenu]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const catlog = selectedCatlog.trim().toLowerCase();
    const fromMs = parseDateInputBoundary(dateFrom);
    const toMs = parseDateInputBoundary(dateTo, true);
    return products.filter((product) => {
      const fields: Record<typeof searchMode, Array<string | undefined>> = {
        all: [
          product.art_number,
          product.design_no,
          product.product_name,
          product.party_name,
          product.customer,
          product.stone_type,
          product.category,
          product.status,
        ],
        art_number: [product.art_number, product.design_no],
        party_name: [product.party_name, product.customer],
        product_name: [product.product_name],
        status: [product.status],
        category: [product.category],
      };
      const matchesSearch = !q || fields[searchMode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      const matchesCatlog = !catlog || String(product.category ?? "").trim().toLowerCase() === catlog;
      const productDate = parseProductDateValue(product.updated_at) ?? parseProductDateValue(product.created_at);
      const matchesDate = (!fromMs && !toMs) || (
        productDate !== null &&
        (fromMs === null || productDate >= fromMs) &&
        (toMs === null || productDate <= toMs)
      );
      return matchesSearch && matchesCatlog && matchesDate;
    });
  }, [products, query, searchMode, selectedCatlog, dateFrom, dateTo]);

  const recommendedProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || (searchMode !== "all" && searchMode !== "art_number")) return [];
    const matches = products.filter((product) => {
      const art = String(product.art_number ?? "").toLowerCase();
      const design = String(product.design_no ?? "").toLowerCase();
      return art.includes(q) || design.includes(q);
    });
    return matches.sort((a, b) => {
      const aArt = String(a.art_number ?? "").toLowerCase();
      const bArt = String(b.art_number ?? "").toLowerCase();
      const aStarts = aArt.startsWith(q) ? 0 : 1;
      const bStarts = bArt.startsWith(q) ? 0 : 1;
      return aStarts - bStarts || aArt.localeCompare(bArt);
    });
  }, [products, query]);

  const recommendedKeys = useMemo(
    () => new Set(recommendedProducts.map((product) => product.art_number)),
    [recommendedProducts]
  );
  const allFilteredSelected = useMemo(
    () => filtered.length > 0 && filtered.every((product) => selectedArtNumbers.has(product.art_number)),
    [filtered, selectedArtNumbers]
  );

  const composerRowsWithTotals = useMemo(() => {
    return composer.rows.map((row) => {
      const qty = Number(row.qty || 0);
      const rate = Number(row.rate || 0);
      const setChrg = Number(row.setChrg || 0);
      const stoneValue = qty * rate;
      const setValue = qty * setChrg;
      const totalCharge = setValue;
      return { ...row, qty, rate, setChrg, stoneValue, setValue, totalCharge };
    });
  }, [composer.rows]);
  const composerFooterRowsWithTotals = useMemo(() => {
    return (composer.footerRows ?? []).map((row) => {
      const qty = Number(row.qty || 0);
      const rate = Number(row.rate || 0);
      const setChrg = Number(row.setChrg || 0);
      return {
        ...row,
        qty,
        rate,
        setChrg,
        stoneValue: qty * rate,
        setValue: qty * setChrg,
        includeInGrandTotal: row.includeInGrandTotal === true,
      };
    });
  }, [composer.footerRows]);

  const composerTotalKgStone = useMemo(
    () => composerRowsWithTotals.reduce((sum, row) => sum + row.stoneValue, 0),
    [composerRowsWithTotals]
  );
  const composerTotalStoneCount = useMemo(
    () => composerRowsWithTotals.reduce((sum, row) => sum + row.qty, 0),
    [composerRowsWithTotals]
  );
  const composerTotalChargeBase = useMemo(
    () => composerRowsWithTotals.reduce((sum, row) => sum + row.setValue, 0),
    [composerRowsWithTotals]
  );
  const composerPolishQty = Number(composer.details.qty || 0);
  const composerGrossWeight = Number(composer.details.grossWeight || 0);
  const composerRodiumRate = Number(composer.details.rodiumRate || 0);
  const composerMakingChargeRate = Number(composer.details.makingChargeRate || 0);
  const composerManualStoneSettingCostOnePc = composer.details.stoneSettingCost.trim()
    ? Number(composer.details.stoneSettingCost || 0)
    : 0;
  const composerStoneChargeOnePc = composerTotalChargeBase || composerManualStoneSettingCostOnePc;
  const composerPolishRate = Number(composer.details.polishRate || 0);
  const composerRodiumValue = composerGrossWeight * composerRodiumRate;
  const composerMakingChargeValue = composerGrossWeight * composerMakingChargeRate;
  const composerPolishValue = composerPolishQty * composerPolishRate;
  const composerTotalKgStoneForQty = composerTotalKgStone * composerPolishQty;
  const composerTotalChargeOnePc = composerStoneChargeOnePc + composerRodiumValue + composerMakingChargeValue + composerPolishValue;
  const composerTotalCharge = composerTotalChargeOnePc * composerPolishQty;
  const composerIncludedFooterTotal = useMemo(
    () => composerFooterRowsWithTotals.reduce((sum, row) => sum + (row.includeInGrandTotal ? row.setValue : 0), 0),
    [composerFooterRowsWithTotals]
  );
  const composerTotalKgGrams = composerTotalKgStoneForQty + composerTotalCharge + composerIncludedFooterTotal;
  const composerGrandTotal = composerTotalKgGrams;
  const composerMissing = {
    artNo: isMissingTextValue(composer.details.designNo),
    partyName: isMissingTextValue(composer.details.partyName),
    date: isMissingTextValue(composer.details.date),
    grossWeight: isMissingPositiveNumber(composer.details.grossWeight),
    makingChargeRate: isMissingPositiveNumber(composer.details.makingChargeRate),
    stoneSettingCost: isMissingPositiveNumber(composerStoneChargeOnePc),
    polishRate: isMissingPositiveNumber(composer.details.polishRate),
    stoneCount: isMissingPositiveNumber(composerTotalStoneCount),
    grandTotal: isMissingPositiveNumber(composerGrandTotal),
  };

  const focusFirstMissingComposerField = () => {
    const selectors: Array<[keyof typeof composerMissing, string]> = [
      ["artNo", ".composer-shell .composer-edit-row:nth-of-type(1) .composer-summary-input"],
      ["partyName", ".composer-shell .composer-edit-row:nth-of-type(2) .composer-summary-input"],
      ["date", ".composer-shell .estimate-date-box"],
      ["grossWeight", ".composer-shell .composer-edit-row:nth-of-type(4) .composer-summary-input"],
      ["makingChargeRate", ".composer-shell .composer-edit-row:nth-of-type(5) .composer-summary-input"],
      ["stoneSettingCost", ".composer-shell .composer-edit-row:nth-of-type(6) .composer-summary-input"],
      ["polishRate", ".composer-shell .composer-edit-row:nth-of-type(7) .composer-summary-input"],
      ["stoneCount", ".composer-shell .summary-row:nth-of-type(8)"],
      ["grandTotal", ".composer-shell .summary-row.summary-total"],
    ];
    for (const [key, selector] of selectors) {
      if (!composerMissing[key]) continue;
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

  const openArt = (artNumber: string) => {
    setOpenDownloadMenu(null);
    router.push(`/product/${encodeURIComponent(artNumber)}`);
  };

  const toggleSelectedArt = (artNumber: string) => {
    setSelectedArtNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(artNumber)) {
        next.delete(artNumber);
      } else {
        next.add(artNumber);
      }
      return next;
    });
    if (openDownloadMenu === `row:${artNumber}`) {
      setOpenDownloadMenu(null);
    }
  };

  const toggleSelectAllProducts = () => {
    if (allFilteredSelected) {
      setOpenDownloadMenu(null);
    }
    setSelectedArtNumbers((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((product) => next.delete(product.art_number));
      } else {
        filtered.forEach((product) => next.add(product.art_number));
      }
      return next;
    });
  };

  const unselectAllProducts = () => {
    setSelectedArtNumbers((prev) => {
      const next = new Set(prev);
      filtered.forEach((product) => next.delete(product.art_number));
      return next;
    });
    setOpenDownloadMenu(null);
  };

  const deleteSelectedArtNumbers = async () => {
    const selected = Array.from(selectedArtNumbers);
    if (!selected.length) {
      window.alert("Select at least one art number to delete.");
      setOpenDownloadMenu(null);
      return;
    }
    const confirmed = window.confirm(`Delete ${selected.length} selected art number${selected.length === 1 ? "" : "s"}?`);
    if (!confirmed) return;
    try {
      for (const artNumber of selected) {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ action: "delete", art_number: artNumber }),
        });
        if (!response.ok) {
          const message = await response.text().catch(() => "");
          throw new Error(message || `Delete failed for ${artNumber}`);
        }
      }
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = response.ok ? ((await response.json()) as Product[]) : null;
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts((prev) => prev.filter((product) => !selectedArtNumbers.has(product.art_number)));
      }
      setSelectedArtNumbers(new Set());
      setOpenDownloadMenu(null);
    } catch (error) {
      console.error("deleteSelectedArtNumbers failed", error);
      window.alert(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const downloadProductList = async (label: "pdf" | "excel", scopeProducts = filtered, filenameArt?: string) => {
    const modeLabels: Record<typeof searchMode, string> = {
      all: "Search",
      art_number: "Art number",
      party_name: "Party name",
      product_name: "Item name",
      status: "Status",
      category: "Category",
    };
    const cleanCell = (value: string | number | undefined | null) =>
      String(value ?? "-")
        .replace(/\s+/g, " ")
        .replace(/\|/g, "/")
        .trim() || "-";
    const mainHeading = filenameArt
      ? `ART NUMBER: ${filenameArt}`
      : query.trim()
        ? `${modeLabels[searchMode].toUpperCase()}: ${query.trim()}`
        : searchMode === "all"
          ? "PRODUCT LIST"
          : `${modeLabels[searchMode].toUpperCase()} LIST`;
    const baseColumns = [
      { mode: "art_number", header: "Art number", width: 105, excelWidth: 18, getValue: (product: Product) => product.art_number },
      { mode: "product_name", header: "Item name", width: 220, excelWidth: 34, getValue: (product: Product) => product.product_name ?? "Untitled product" },
      { mode: "party_name", header: "Party name", width: 175, excelWidth: 28, getValue: (product: Product) => product.party_name ?? product.customer },
      { mode: "status", header: "Status", width: 155, excelWidth: 24, getValue: (product: Product) => product.status },
      { mode: "category", header: "Category", width: 130, excelWidth: 22, getValue: (product: Product) => product.category },
    ];
    const exportColumns = searchMode === "all"
      ? baseColumns
      : [
          ...baseColumns.filter((column) => column.mode === searchMode),
          ...baseColumns.filter((column) => column.mode !== searchMode),
        ];
    const headers = exportColumns.map((column) => column.header);
    const rows = scopeProducts.map((product) => exportColumns.map((column) => cleanCell(column.getValue(product))));
    const safeName = cleanCell(filenameArt ?? `${modeLabels[searchMode]}-${query.trim() || "products"}`)
      .replace(/[^a-z0-9-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    if (label === "pdf") {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const widths = exportColumns.map((column) => column.width);
      const tableWidth = widths.reduce((sum, width) => sum + width, 0);
      const startX = (pageWidth - tableWidth) / 2;
      const drawCell = (text: string, x: number, y: number, width: number, height: number, fill?: [number, number, number]) => {
        if (fill) {
          pdf.setFillColor(...fill);
          pdf.rect(x, y, width, height, "F");
        }
        pdf.setDrawColor(31, 41, 55);
        pdf.rect(x, y, width, height);
        const lines = pdf.splitTextToSize(text, width - 14);
        pdf.text(lines, x + 7, y + 17);
      };
      const drawHeader = (y: number) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(255, 255, 255);
        let x = startX;
        headers.forEach((header, index) => {
          drawCell(header.toUpperCase(), x, y, widths[index], 28, [31, 111, 85]);
          x += widths[index];
        });
        pdf.setTextColor(17, 24, 39);
      };

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("LAKSHMI TOOL", margin, 42);
      pdf.setFontSize(14);
      pdf.text(mainHeading, margin, 66);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Total products: ${scopeProducts.length}`, margin, 84);
      pdf.text(`Generated: ${formatProductDate(new Date().toISOString())}`, margin + 130, 84);

      let y = 106;
      drawHeader(y);
      y += 28;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      rows.forEach((row) => {
        const rowLines = row.map((cell, index) => pdf.splitTextToSize(cell, widths[index] - 14).length);
        const rowHeight = Math.max(30, Math.max(...rowLines) * 11 + 14);
        if (y + rowHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
          drawHeader(y);
          y += 28;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
        }
        let x = startX;
        row.forEach((cell, index) => {
          drawCell(cell, x, y, widths[index], rowHeight);
          x += widths[index];
        });
        y += rowHeight;
      });

      pdf.save(`lakshmi-${safeName || "products"}.pdf`);
      return;
    }

    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    workbook.creator = "Lakshmi Tool";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Product List");
    sheet.columns = exportColumns.map((column, index) => ({
      key: `col${index + 1}`,
      width: column.excelWidth,
    }));
    sheet.mergeCells("A1:E1");
    sheet.getCell("A1").value = "LAKSHMI TOOL";
    sheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FF1F6F55" } };
    sheet.mergeCells("A2:E2");
    sheet.getCell("A2").value = mainHeading;
    sheet.getCell("A2").font = { bold: true, size: 13 };
    sheet.mergeCells("A3:E3");
    sheet.getCell("A3").value = `Total products: ${scopeProducts.length}    Generated: ${formatProductDate(new Date().toISOString())}`;
    sheet.getCell("A3").font = { size: 10, color: { argb: "FF667085" } };
    sheet.addRow([]);
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F6F55" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    rows.forEach((row) => {
      const excelRow = sheet.addRow(row);
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD6DEE6" } },
          left: { style: "thin", color: { argb: "FFD6DEE6" } },
          bottom: { style: "thin", color: { argb: "FFD6DEE6" } },
          right: { style: "thin", color: { argb: "FFD6DEE6" } },
        };
      });
    });
    sheet.views = [{ state: "frozen", ySplit: 5 }];
    const file = await workbook.xlsx.writeBuffer();
    const blob = new Blob([file], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    downloadBlob(blob, `lakshmi-${safeName || "products"}.xlsx`);
  };

  const renderRowDownloadMenu = (product: Product) => {
    const menuKey = `row:${product.art_number}`;
    const isOpen = openDownloadMenu === menuKey;
    const handleDownload = (label: "pdf" | "excel") => {
      void downloadProductList(label, [product], product.art_number);
      setOpenDownloadMenu(null);
    };
    return (
      <span className="row-download-menu" aria-label={`Download ${product.art_number}`}>
        <span
          role="button"
          tabIndex={0}
          className={`row-download-trigger ${isOpen ? "active" : ""}`}
          title="Download list"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpenDownloadMenu((prev) => (prev === menuKey ? null : menuKey));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              setOpenDownloadMenu((prev) => (prev === menuKey ? null : menuKey));
            }
          }}
        >
          <svg className="hamburger-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14" />
            <path d="M5 12h14" />
            <path d="M5 17h14" />
          </svg>
        </span>
        {isOpen && (
          <span className="row-download-options" role="menu">
            <span
              role="menuitem"
              tabIndex={0}
              className="product-export-symbol pdf"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleDownload("pdf");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleDownload("pdf");
                }
              }}
            >
              PDF
            </span>
            <span
              role="menuitem"
              tabIndex={0}
              className="product-export-symbol excel"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleDownload("excel");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleDownload("excel");
                }
              }}
            >
              XLS
            </span>
          </span>
        )}
      </span>
    );
  };

  const renderBulkActionMenu = () => {
    const isOpen = openDownloadMenu === "bulk" || openDownloadMenu === "bulk-download";
    const downloadOptionsOpen = openDownloadMenu === "bulk-download";
    const handleBulkDownload = (label: "pdf" | "excel") => {
      void downloadProductList(label, filtered);
      setOpenDownloadMenu(null);
    };
    return (
      <span className="bulk-action-menu" aria-label="List actions">
        <span
          role="button"
          tabIndex={0}
          className={`bulk-action-trigger ${isOpen ? "active" : ""}`}
          title="List actions"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpenDownloadMenu((prev) => (prev === "bulk" || prev === "bulk-download" ? null : "bulk"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              setOpenDownloadMenu((prev) => (prev === "bulk" || prev === "bulk-download" ? null : "bulk"));
            }
          }}
        >
          <svg className="hamburger-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14" />
            <path d="M5 12h14" />
            <path d="M5 17h14" />
          </svg>
        </span>
        {isOpen && (
          <span className="bulk-action-options" role="menu">
            <span
              role="menuitem"
              tabIndex={0}
              className={`bulk-action-option ${allFilteredSelected ? "active" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleSelectAllProducts();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleSelectAllProducts();
                }
              }}
            >
              Select all
            </span>
            <span
              role="menuitem"
              tabIndex={0}
              className="bulk-action-option"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                unselectAllProducts();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  unselectAllProducts();
                }
              }}
            >
              Unselect all
            </span>
            <span
              role="menuitem"
              tabIndex={0}
              className={`bulk-action-option ${downloadOptionsOpen ? "active" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpenDownloadMenu("bulk-download");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpenDownloadMenu("bulk-download");
                }
              }}
            >
              Download
            </span>
            <span
              role="menuitem"
              tabIndex={0}
              className="bulk-action-option danger"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void deleteSelectedArtNumbers();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  void deleteSelectedArtNumbers();
                }
              }}
            >
              Delete Art Number
            </span>
            {downloadOptionsOpen && (
              <span className="bulk-download-row">
                <span
                  role="menuitem"
                  tabIndex={0}
                  className="product-export-symbol pdf"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleBulkDownload("pdf");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      handleBulkDownload("pdf");
                    }
                  }}
                >
                  Download as PDF
                </span>
              <span
                role="menuitem"
                tabIndex={0}
                className="product-export-symbol excel"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleBulkDownload("excel");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    handleBulkDownload("excel");
                  }
                }}
              >
                Download as Excel
              </span>
            </span>
            )}
          </span>
        )}
      </span>
    );
  };

  const handleSearch = () => {
    const hasSearchCriteria = Boolean(
      query.trim() ||
      selectedCatlog.trim() ||
      dateFrom ||
      dateTo
    );
    setShowResults(hasSearchCriteria);
    setShowComposer(false);
    setCatalogMode(false);
    setOpenDownloadMenu(null);
  };

  const handleDateFilterChange = (field: "from" | "to", value: string) => {
    if (field === "from") {
      setDateFrom(value);
    } else {
      setDateTo(value);
    }
    setShowResults(true);
    setShowComposer(false);
    setCatalogMode(false);
    setOpenDownloadMenu(null);
  };

  const handleCatlogFilterChange = (value: string) => {
    setSelectedCatlog(value);
    setCatalogMode(true);
    const isAllCatlog = !value;
    if (isAllCatlog) {
      setQuery("");
      setSearchMode("all");
      setDateFrom("");
      setDateTo("");
      setShowComposer(false);
      setSelectedArtNumbers(new Set());
      setOpenDownloadMenu(null);
      setOpenStoneMenu(null);
      setOpenFooterMenuId(null);
    }
    setShowResults(true);
    setShowComposer(false);
    setOpenDownloadMenu(null);
  };

  const handleClear = () => {
    const returnTo = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("return")
      : null;
    if (returnTo?.startsWith("/product/")) {
      router.push(returnTo);
      return;
    }
    if (typeof window !== "undefined") {
      const cleanUrl = window.location.pathname;
      if (window.location.search) {
        window.history.replaceState(null, "", cleanUrl);
      }
    }
    setQuery("");
    setSearchMode("all");
    setSelectedCatlog("");
    setDateFrom("");
    setDateTo("");
    setCatalogMode(false);
    setShowComposer(false);
    setSelectedArtNumbers(new Set());
    setOpenDownloadMenu(null);
    setOpenStoneMenu(null);
    setDraggingStoneIndex(null);
    setDragOverStoneIndex(null);
    setPdfScanStatus("");
    setScanStatusKind("idle");
    setShowResults(false);
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.setSelectionRange?.(0, 0);
    });
  };

  const updateComposerRow = (index: number, patch: Partial<ComposerRow>) => {
    setComposer((prev) => ({
      ...prev,
      rows: prev.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }));
  };

  const createComposerFooterRow = (includeInGrandTotal = false): ComposerFooterFormulaRow => ({
    ...EMPTY_COMPOSER_FOOTER_ROW,
    id: `footer-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    includeInGrandTotal,
  });

  const updateComposerFooterRow = (id: string, patch: Partial<ComposerFooterFormulaRow>) => {
    setComposer((prev) => ({
      ...prev,
      footerRows: (prev.footerRows ?? []).map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  const addComposerFooterRow = (afterId?: string) => {
    const includeInGrandTotal = window.confirm(
      "Do you want to add this footer formula value in GRAND TOTAL?\n\nOK = Add in Grand Total\nCancel = Keep only in Product Details"
    );
    setComposer((prev) => {
      const rows = [...(prev.footerRows ?? [])];
      const nextRow = createComposerFooterRow(includeInGrandTotal);
      if (!afterId) return { ...prev, footerRows: [...rows, nextRow] };
      const index = rows.findIndex((row) => row.id === afterId);
      rows.splice(index < 0 ? rows.length : index + 1, 0, nextRow);
      return { ...prev, footerRows: rows };
    });
    setOpenFooterMenuId(null);
  };

  const deleteComposerFooterRow = (id: string) => {
    setComposer((prev) => ({
      ...prev,
      footerRows: (prev.footerRows ?? []).filter((row) => row.id !== id),
    }));
    setOpenFooterMenuId(null);
  };

  const addComposerRow = (index: number) => {
    setComposer((prev) => {
      const rows = [...prev.rows];
      rows.splice(index + 1, 0, { ...EMPTY_COMPOSER_ROW });
      return { ...prev, rows };
    });
    setOpenStoneMenu(null);
  };

  const deleteComposerRow = (index: number) => {
    setComposer((prev) => {
      if (prev.rows.length === 1) return { ...prev, rows: [{ ...EMPTY_COMPOSER_ROW }] };
      return { ...prev, rows: prev.rows.filter((_, rowIndex) => rowIndex !== index) };
    });
    setOpenStoneMenu(null);
  };

  const moveComposerRow = (index: number, direction: -1 | 1) => {
    setComposer((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.rows.length) return prev;
      const rows = [...prev.rows];
      [rows[index], rows[nextIndex]] = [rows[nextIndex], rows[index]];
      return { ...prev, rows };
    });
    setOpenStoneMenu(null);
  };

  const reorderComposerRow = (fromIndex: number, toIndex: number) => {
    setComposer((prev) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.rows.length || toIndex >= prev.rows.length) {
        return prev;
      }
      const rows = [...prev.rows];
      const [movedRow] = rows.splice(fromIndex, 1);
      rows.splice(toIndex, 0, movedRow);
      return { ...prev, rows };
    });
    setDraggingStoneIndex(null);
    setDragOverStoneIndex(null);
    setOpenStoneMenu(null);
  };

  const updateComposerImage = (field: "cadImage" | "sampleImage", file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setComposer((prev) => ({
        ...prev,
        details: { ...prev.details, [field]: String(reader.result ?? "") },
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearComposerImage = (field: "cadImage" | "sampleImage") => {
    setComposer((prev) => ({
      ...prev,
      details: { ...prev.details, [field]: "" },
    }));
  };

  const downloadComposerImage = (field: "cadImage" | "sampleImage", label: string) => {
    const image = composer.details[field];
    if (!image) return;
    const link = document.createElement("a");
    link.href = image;
    link.download = `${composer.details.designNo || "new-art-number"}-${label}.png`;
    link.click();
  };

  const openComposerImage = (field: "cadImage" | "sampleImage") => {
    const image = composer.details[field];
    if (!image) return;
    window.open(image, "_blank", "noopener,noreferrer");
  };

  const handlePdfScan = async (file?: File) => {
    if (!file) return;
    setPdfScanStatus("Scanning PDF...");
    setScanStatusKind("loading");
    setComposerSaveStatus("");
    try {
      const pdfDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/scan-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "PDF scan failed");
      }
      const fields = (data.fields ?? {}) as Partial<ComposerEstimate["details"]>;
      const scannedRows = Array.isArray(data.rows) ? data.rows : [];
      setComposer((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          designNo: fields.designNo || prev.details.designNo,
          jobName: fields.jobName || prev.details.jobName,
          partyName: fields.partyName || prev.details.partyName,
          color: fields.color || prev.details.color,
          category: fields.category || prev.details.category || "Necklace",
          status: fields.status || prev.details.status || "Ready",
          qty: fields.qty || prev.details.qty || "1",
          date: fields.date || prev.details.date,
          grossWeight: fields.grossWeight || prev.details.grossWeight,
          makingChargeRate: fields.makingChargeRate || prev.details.makingChargeRate,
          stoneSettingCost: fields.stoneSettingCost || prev.details.stoneSettingCost,
          rodiumRate: fields.rodiumRate || prev.details.rodiumRate,
          polishRate: fields.polishRate || prev.details.polishRate,
          scanPdf: pdfDataUrl || prev.details.scanPdf,
        },
        rows: scannedRows.length
          ? scannedRows.map((row: Partial<ComposerRow>) => ({
              description: String(row.description ?? ""),
              size: String(row.size ?? ""),
              qty: String(row.qty ?? ""),
              rate: String(row.rate ?? ""),
              setChrg: String(row.setChrg ?? ""),
            }))
          : prev.rows,
      }));
      setShowComposer(true);
      setShowResults(false);
      setPdfScanStatus(String(data.message ?? "PDF scanned. Review and save."));
      setScanStatusKind("success");
    } catch (error) {
      console.error("handlePdfScan failed", error);
      setPdfScanStatus(error instanceof Error ? error.message : "PDF scan failed");
      setScanStatusKind("error");
    }
  };

  const handleExcelScan = async (file?: File) => {
    if (!file) return;
    setPdfScanStatus("Checking Excel dump format...");
    setScanStatusKind("loading");
    setComposerSaveStatus("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/scan-excel", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setScanStatusKind("error");
        throw new Error(data?.error ?? "Excel scan failed");
      }
      const fields = (data.fields ?? {}) as Partial<ComposerEstimate["details"]>;
      const scannedRows = Array.isArray(data.rows) ? data.rows : [];
      setComposer((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          designNo: fields.designNo || prev.details.designNo,
          jobName: fields.jobName || prev.details.jobName,
          partyName: fields.partyName || prev.details.partyName,
          color: fields.color || prev.details.color,
          category: fields.category || prev.details.category || "Necklace",
          status: fields.status || prev.details.status || "Ready",
          qty: fields.qty || prev.details.qty || "1",
          date: fields.date || prev.details.date,
          grossWeight: fields.grossWeight || prev.details.grossWeight,
          makingChargeRate: fields.makingChargeRate || prev.details.makingChargeRate,
          stoneSettingCost: fields.stoneSettingCost || prev.details.stoneSettingCost,
          rodiumRate: fields.rodiumRate || prev.details.rodiumRate,
          polishRate: fields.polishRate || prev.details.polishRate,
          cadImage: fields.cadImage || prev.details.cadImage,
          sampleImage: fields.sampleImage || prev.details.sampleImage,
        },
        rows: scannedRows.length
          ? scannedRows.map((row: Partial<ComposerRow>) => ({
              description: String(row.description ?? ""),
              size: String(row.size ?? ""),
              qty: String(row.qty ?? ""),
              rate: String(row.rate ?? ""),
              setChrg: String(row.setChrg ?? ""),
            }))
          : prev.rows,
      }));
      setShowComposer(true);
      setShowResults(false);
      setPdfScanStatus(
        data.formatValid === true
          ? `Fixed Excel format accepted. ${String(data.message ?? "Review and save.")}`
          : String(data.message ?? "Excel scanned. Review and save.")
      );
      setScanStatusKind("success");
    } catch (error) {
      console.error("handleExcelScan failed", error);
      const message = error instanceof Error ? error.message : "Excel scan failed";
      setPdfScanStatus(message.startsWith("Invalid Excel format") ? `Excel format changed. ${message}` : message);
      setScanStatusKind("error");
    }
  };

  const saveComposerProduct = async () => {
    const artNumber = composer.details.designNo.trim();
    if (!artNumber) {
      setComposerSaveStatus("Enter art number");
      focusFirstMissingComposerField();
      return;
    }
    if (composerMissing.partyName || composerMissing.date || composerMissing.grossWeight || composerMissing.makingChargeRate || composerMissing.stoneSettingCost || composerMissing.polishRate || composerMissing.stoneCount || composerMissing.grandTotal) {
      setComposerSaveStatus("Complete the missing fields");
      focusFirstMissingComposerField();
      return;
    }
    const estimateState = {
      details: {
        designNo: artNumber,
        jobName: composer.details.jobName.trim() || "New Art Number",
        color: composer.details.color.trim(),
        category: composer.details.category.trim() || "Necklace",
        status: composer.details.status.trim() || "Ready",
        qty: Number(composer.details.qty || 0),
        date: composer.details.date.trim(),
        rodiumWeight: composerGrossWeight,
        rodiumRate: Number(composer.details.rodiumRate || 0),
        grossWeight: Number(composer.details.grossWeight || 0),
        makingChargeRate: Number(composer.details.makingChargeRate || 0),
        polishRate: Number(composer.details.polishRate || 0),
      },
      rows: composer.rows.map((row, index) => ({
        id: `row-${index + 1}`,
        description: row.description,
        size: row.size,
        qty: Number(row.qty || 0),
        rate: Number(row.rate || 0),
        setChrg: Number(row.setChrg || 0),
      })),
      footerRows: (composer.footerRows ?? []).map((row, index) => ({
        id: row.id || `footer-${index + 1}`,
        label: row.label,
        qty: Number(row.qty || 0),
        rate: Number(row.rate || 0),
        setChrg: Number(row.setChrg || 0),
        includeInGrandTotal: row.includeInGrandTotal === true,
      })),
      locked: true,
      showDetails: false,
      images: {
        cad: composer.details.cadImage,
        sample: composer.details.sampleImage,
        templateFile: composer.details.scanPdf,
      },
    };

    const detailEdit = {
      artNo: artNumber,
      partyName: composer.details.partyName.trim(),
      grossWeight: composerGrossWeight ? composerGrossWeight.toFixed(2) : "0.00",
      stonesCount: composerTotalStoneCount ? composerTotalStoneCount.toFixed(2) : "0.00",
      stoneSettingCost: composerStoneChargeOnePc ? composerStoneChargeOnePc.toFixed(2) : "0.00",
      polishCost: composerPolishRate ? composerPolishRate.toFixed(2) : "0.00",
      totalCost: composerGrandTotal ? composerGrandTotal.toFixed(2) : "0.00",
    };

    const productBase: Product = {
      art_number: artNumber,
      design_no: artNumber,
      product_name: composer.details.jobName.trim() || "New Art Number",
      party_name: composer.details.partyName.trim(),
      customer: composer.details.partyName.trim(),
      stone_type: composer.details.color.trim(),
      status: composer.details.status.trim() || "Ready",
      category: composer.details.category.trim() || "Necklace",
      weight_per_grams: composerGrossWeight ? composerGrossWeight.toFixed(2) : "0.00",
      stones_count: Number(composerTotalStoneCount.toFixed(2)),
      stones_setting_cost: Number(composerStoneChargeOnePc.toFixed(2)),
      polish_cost: Number(composerPolishRate.toFixed(2)),
      total_estimation_cost: Number(composerGrandTotal.toFixed(2)),
      notes: "Reference piece based on the provided CAD and sample image.",
      line_items: composer.rows.map((row) => ({
        description: row.description,
        size: row.size,
        qty: Number(row.qty || 0),
        rate: Number(row.rate || 0),
        set_chrg: Number(row.setChrg || 0),
      })),
    };

    setComposerSaveStatus("Saving...");
    try {
      const stateResponse = await fetch("/api/order-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ art: artNumber, state: estimateState, detailEdit }),
      });
      if (!stateResponse.ok) {
        const message = await stateResponse.text().catch(() => "");
        throw new Error(message || `Estimate save failed with status ${stateResponse.status}`);
      }
      const stateData = (await stateResponse.json()) as {
        state?: { images?: { cad?: string; sample?: string; templateFile?: string } };
      };
      const savedCadImage = stateData.state?.images?.cad ?? composer.details.cadImage;
      const savedSampleImage = stateData.state?.images?.sample ?? composer.details.sampleImage;
      const savedTemplateFile = stateData.state?.images?.templateFile ?? composer.details.scanPdf;
      const product: Product = {
        ...productBase,
        cad_image: savedCadImage,
        final_sample_image: savedSampleImage,
        template_file: savedTemplateFile,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert", product }),
      });
      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Save failed with status ${response.status}`);
      }
      const data = (await response.json()) as { products?: Product[] };
      if (Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts((prev) => {
          const next = prev.filter((item) => item.art_number.toLowerCase() !== artNumber.toLowerCase());
          return [product, ...next];
        });
      }
      setComposer((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          cadImage: savedCadImage,
          sampleImage: savedSampleImage,
          scanPdf: savedTemplateFile,
        },
      }));
      setComposerSaveStatus("Saved");
    } catch (error) {
      console.error("saveComposerProduct failed", error);
      setComposerSaveStatus("Save failed");
    }
  };

  const openComposerActionMenu = () => setComposerActionMenuOpen((prev) => !prev);

  return (
    <main className="page-shell" ref={pageRef} tabIndex={-1}>
      <section className="search-card search-only search-minimal">
        <div className="search-minimal-head">
          <div>
            <p className="eyebrow search-brand-title">Lakshmi Tool</p>
          </div>
          <div className="search-meta compact">
            <button type="button" className="search-meta-toggle" onClick={() => setShowResults((prev) => !prev)}>
              <span>Products</span>
              <strong>{loading ? "Loading..." : products.length}</strong>
            </button>
            <button type="button" className="search-meta-action" onClick={() => setShowComposer((prev) => !prev)}>
              Add new art number
            </button>
          </div>
        </div>
        {pdfScanStatus && (
          <div className={`pdf-scan-status ${scanStatusKind !== "idle" ? `is-${scanStatusKind}` : ""}`}>
            <span className="scan-status-dot" aria-hidden="true" />
            <span>{pdfScanStatus}</span>
          </div>
        )}

        <div className="search-bar search-bar-premium">
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
              setShowComposer(false);
            }}
            placeholder="Search by art number, party name, item name, status, category..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <div className="search-actions">
            <button type="button" className="primary-btn mobile-icon-btn" data-label="Search" onClick={handleSearch}>
              <span className="desktop-label">Search</span>
            </button>
            <button type="button" className="delete-btn subtle-btn mobile-icon-btn clear-icon-btn" data-label="Clear" onClick={handleClear}>
              <span className="desktop-label">Clear</span>
            </button>
          </div>
        </div>

        <div className="search-modes compact-modes">
          <button type="button" className={`mode-chip ${searchMode === "all" ? "active" : ""}`} onClick={() => { setSearchMode("all"); setShowResults(true); }}>All fields</button>
          <button type="button" className={`mode-chip ${searchMode === "art_number" ? "active" : ""}`} onClick={() => { setSearchMode("art_number"); setShowResults(true); }}>Art number</button>
          <button type="button" className={`mode-chip ${searchMode === "party_name" ? "active" : ""}`} onClick={() => { setSearchMode("party_name"); setShowResults(true); }}>Party name</button>
          <button type="button" className={`mode-chip ${searchMode === "product_name" ? "active" : ""}`} onClick={() => { setSearchMode("product_name"); setShowResults(true); }}>Item name</button>
          <button type="button" className={`mode-chip ${searchMode === "status" ? "active" : ""}`} onClick={() => { setSearchMode("status"); setShowResults(true); }}>Status</button>
          <button type="button" className={`mode-chip ${searchMode === "category" ? "active" : ""}`} onClick={() => { setSearchMode("category"); setShowResults(true); }}>Category</button>
          <label className="solid-filter-box catlog-filter-box">
            <span>Catlog</span>
            <select value={selectedCatlog} onChange={(event) => handleCatlogFilterChange(event.target.value)}>
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
                className={`date-picker-input ${dateFrom ? "has-date" : "empty-date"}`}
                value={dateFrom}
                onChange={(event) => handleDateFilterChange("from", event.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                className={`date-picker-input ${dateTo ? "has-date" : "empty-date"}`}
                value={dateTo}
                onChange={(event) => handleDateFilterChange("to", event.target.value)}
              />
            </label>
          </span>
          <span className="mode-toolbar-spacer"></span>
          {renderBulkActionMenu()}
        </div>

        {query.trim() && recommendedProducts.length > 0 && (
          <div className="search-results recommended-results">
            <div className="recommended-label">Recommended</div>
            {recommendedProducts.map((product) => (
              <button type="button" className="result-row premium-result compact-search-result" key={product.art_number} onClick={() => openArt(product.art_number)}>
                <span
                  className={`select-chip ${selectedArtNumbers.has(product.art_number) ? "selected" : ""}`}
                  role="checkbox"
                  aria-checked={selectedArtNumbers.has(product.art_number)}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleSelectedArt(product.art_number);
                  }}
                >
                  <span>Select</span><span className="select-check" aria-hidden="true"></span>
                </span>
                <div className="result-main">
                  <strong>{product.product_name ?? "Untitled product"}</strong>
                  <span>{product.art_number}</span>
                </div>
                <div>
                  <span>Party</span>
                  <strong>{product.party_name ?? product.customer ?? "-"}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{product.status ?? "-"}</strong>
                </div>
                <div>
                  <span>Category</span>
                  <strong>{product.category ?? "-"}</strong>
                </div>
                <div>
                  <span>Created</span>
                  <strong>{formatProductDate(product.created_at)}</strong>
                </div>
                <div className="modified-export-cell">
                  <span>Modified</span>
                  <div className="modified-export-row">
                    <strong>{formatProductDate(product.updated_at)}</strong>
                    {selectedArtNumbers.has(product.art_number) && renderRowDownloadMenu(product)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showComposer && (
          <>
            <section className="detail-top search-detail-assembly composer-shell">
              <div className="panel detail-left">
                <div className="detail-topbar">
                  <div className="detail-topbar-left">
                    <p className="eyebrow">New Art Number</p>
                  </div>
                </div>
                <div className="composer-title-row">
                  <input
                    className="composer-title-input"
                    value={composer.details.jobName ?? ""}
                    placeholder="Product name"
                    onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, jobName: e.target.value } }))}
                  />
                  <div className="composer-detail-actions">
                    {composerSaveStatus && <span className="composer-save-status">{composerSaveStatus}</span>}
                    <div className="composer-action-menu-wrap">
                      <button type="button" className="composer-menu-btn" aria-label="Composer actions" onClick={openComposerActionMenu}>
                        ⋮
                      </button>
                      {composerActionMenuOpen && (
                        <div className="composer-action-menu" onMouseLeave={() => setComposerActionMenuOpen(false)}>
                          <button type="button" onClick={() => { setComposerActionMenuOpen(false); saveComposerProduct(); }}>
                            Save
                          </button>
                          <button type="button" onClick={() => { setComposerActionMenuOpen(false); composerPdfInputRef.current?.click(); }}>
                            Scan PDF
                          </button>
                          <button type="button" onClick={() => { setComposerActionMenuOpen(false); composerExcelInputRef.current?.click(); }}>
                            Scan Excel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  ref={composerPdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="composer-hidden-input"
                  onChange={(event) => {
                    void handlePdfScan(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                <input
                  ref={composerExcelInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="composer-hidden-input"
                  onChange={(event) => {
                    void handleExcelScan(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                <p className="lede">Reference piece based on the provided CAD and sample image.</p>
                <div className="detail-summary compact-detail-list composer-detail-summary">
                  <div className={`summary-row composer-edit-row ${composerMissing.artNo ? "missing-detail-row" : ""}`}>
                    <span>Art No</span>
                    <input
                      className={`composer-summary-input ${composerMissing.artNo ? "missing-detail-input" : ""}`}
                      value={composer.details.designNo ?? ""}
                      placeholder="Art number"
                      onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, designNo: e.target.value } }))}
                    />
                    {composerMissing.artNo && <em className="missing-detail-indicator">Missing value</em>}
                  </div>
                  <div className={`summary-row composer-edit-row ${composerMissing.partyName ? "missing-detail-row" : ""}`}>
                    <span>Party Name</span>
                    <input
                      className={`composer-summary-input ${composerMissing.partyName ? "missing-detail-input" : ""}`}
                      value={composer.details.partyName ?? ""}
                      placeholder="Party name"
                      onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, partyName: e.target.value } }))}
                    />
                    {composerMissing.partyName && <em className="missing-detail-indicator">Missing value</em>}
                  </div>
                  <div className={`summary-row composer-edit-row ${composerMissing.grossWeight ? "missing-detail-row" : ""}`}>
                    <span>Ghat Weight</span>
                    <input
                      className={`composer-summary-input ${composerMissing.grossWeight ? "missing-detail-input" : ""}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={composer.details.grossWeight ?? ""}
                      placeholder="0.00"
                      onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, grossWeight: e.target.value } }))}
                    />
                    {composerMissing.grossWeight && <em className="missing-detail-indicator">Missing value</em>}
                  </div>
                  <div className={`summary-row composer-edit-row ${composerMissing.makingChargeRate ? "missing-detail-row" : ""}`}>
                    <span>Ghat Rate</span>
                    <input
                      className={`composer-summary-input ${composerMissing.makingChargeRate ? "missing-detail-input" : ""}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={composer.details.makingChargeRate ?? ""}
                      placeholder="0.00"
                      onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, makingChargeRate: e.target.value } }))}
                    />
                    {composerMissing.makingChargeRate && <em className="missing-detail-indicator">Missing value</em>}
                  </div>
                  <div className={`summary-row composer-edit-row ${composerMissing.stoneSettingCost ? "missing-detail-row" : ""}`}>
                    <span>1pc Stone Setting Cost</span>
                    <input
                      className={`composer-summary-input ${composerMissing.stoneSettingCost ? "missing-detail-input" : ""}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={composer.details.stoneSettingCost}
                      placeholder={composerTotalChargeBase ? composerTotalChargeBase.toFixed(2) : "0.00"}
                      onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, stoneSettingCost: e.target.value } }))}
                    />
                    {composerMissing.stoneSettingCost && <em className="missing-detail-indicator">Missing value</em>}
                  </div>
                  <div className={`summary-row composer-edit-row ${composerMissing.polishRate ? "missing-detail-row" : ""}`}>
                    <span>Polish Cost</span>
                    <input
                      className={`composer-summary-input ${composerMissing.polishRate ? "missing-detail-input" : ""}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={composer.details.polishRate ?? ""}
                      placeholder="0.00"
                      onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, polishRate: e.target.value } }))}
                    />
                    {composerMissing.polishRate && <em className="missing-detail-indicator">Missing value</em>}
                  </div>
                  <div className={`summary-row ${composerMissing.stoneCount ? "missing-detail-row" : ""}`}>
                    <span>Stone Count</span>
                    <strong>{composerTotalStoneCount ? composerTotalStoneCount.toFixed(2) : "0.00"}</strong>
                    {composerMissing.stoneCount && <em className="missing-detail-indicator">Missing value</em>}
                  </div>
                  <div className={`summary-row summary-total ${composerMissing.grandTotal ? "missing-detail-row" : ""}`}>
                    <span>Grand total</span>
                    <strong>{composerGrandTotal ? composerGrandTotal.toFixed(2) : "0.00"}</strong>
                    {composerMissing.grandTotal && <em className="missing-detail-indicator">Missing value</em>}
                  </div>
                </div>
              </div>
              <div className="panel image-panel composer-image-panel">
                <div className="composer-image-head">
                  <h2>CAD Image</h2>
                  <button type="button" className="gallery-mini-action" disabled={!composer.details.cadImage} onClick={() => openComposerImage("cadImage")}>
                    Open Full Screen Viewer
                  </button>
                </div>
                <div className="composer-image-stage">
                  {composer.details.cadImage ? (
                    <img src={composer.details.cadImage} alt="CAD preview" />
                  ) : (
                    <div className="composer-placeholder-visual cad-placeholder">
                      <strong>CAD</strong>
                      <span>{composer.details.designNo || "New Art"}</span>
                    </div>
                  )}
                </div>
                <div className="gallery-actions composer-image-actions">
                  <label className="gallery-action upload">
                    Add Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        updateComposerImage("cadImage", e.currentTarget.files?.[0]);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <button type="button" className="gallery-action danger" onClick={() => clearComposerImage("cadImage")} disabled={!composer.details.cadImage}>
                    Delete Image
                  </button>
                  <label className={`gallery-action replace ${!composer.details.cadImage ? "is-disabled" : ""}`}>
                    Replace Image
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!composer.details.cadImage}
                      onChange={(e) => {
                        updateComposerImage("cadImage", e.currentTarget.files?.[0]);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <button type="button" className="gallery-action" onClick={() => downloadComposerImage("cadImage", "cad")} disabled={!composer.details.cadImage}>
                    Download Image
                  </button>
                </div>
              </div>
              <div className="panel image-panel composer-image-panel">
                <div className="composer-image-head">
                  <h2>Sample Image</h2>
                  <button type="button" className="gallery-mini-action" disabled={!composer.details.sampleImage} onClick={() => openComposerImage("sampleImage")}>
                    Open Full Screen Viewer
                  </button>
                </div>
                <div className="composer-image-stage">
                  {composer.details.sampleImage ? (
                    <img src={composer.details.sampleImage} alt="Sample preview" />
                  ) : (
                    <div className="composer-placeholder-visual sample-placeholder">
                      <strong>SAMPLE</strong>
                      <span>{composer.details.designNo || "New Art"}</span>
                    </div>
                  )}
                </div>
                <div className="gallery-actions composer-image-actions">
                  <label className="gallery-action upload">
                    Add Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        updateComposerImage("sampleImage", e.currentTarget.files?.[0]);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <button type="button" className="gallery-action danger" onClick={() => clearComposerImage("sampleImage")} disabled={!composer.details.sampleImage}>
                    Delete Image
                  </button>
                  <label className={`gallery-action replace ${!composer.details.sampleImage ? "is-disabled" : ""}`}>
                    Replace Image
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!composer.details.sampleImage}
                      onChange={(e) => {
                        updateComposerImage("sampleImage", e.currentTarget.files?.[0]);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <button type="button" className="gallery-action" onClick={() => downloadComposerImage("sampleImage", "sample")} disabled={!composer.details.sampleImage}>
                    Download Image
                  </button>
                </div>
              </div>
            </section>

            <section className="panel composer-order-panel">
              <div className="worksheet-head order-estimate-head">
                <div>
                  <h2>Order Estimate</h2>
                </div>
                <div className="worksheet-head-actions">
                    <input
                      className={`estimate-date-box ${composerMissing.date ? "invalid-stone-input" : ""}`}
                      value={composer.details.date ?? ""}
                      placeholder="Date"
                      onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, date: e.target.value } }))}
                    />
                  <button type="button" className="primary-btn" onClick={() => addComposerRow(composer.rows.length - 1)}>Add Row</button>
                </div>
              </div>

              <table className="estimate-table excel-table order-estimate-table workbook-order-table" role="table" aria-label="Order estimate workbook">
                <colgroup>
                  <col style={{ width: "29%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>
                <tbody>
                  <tr className="worksheet-title-row">
                    <th colSpan={8}>ORDER ESTIMATE</th>
                  </tr>
                  <tr className="estimate-top-row">
                    <th colSpan={2}>DESIGN NO</th>
                    <th colSpan={2}>JOB NAME</th>
                    <th>COLOUR</th>
                    <th>QTY</th>
                    <th>STATUS</th>
                    <th>CATEGORY</th>
                  </tr>
                  <tr className="estimate-meta-values">
                    <td colSpan={2}><input className="table-input" value={composer.details.designNo ?? "LHR-220011"} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, designNo: e.target.value } }))} /></td>
                    <td colSpan={2}><input className="table-input" value={composer.details.jobName ?? "Temple Chain Necklace"} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, jobName: e.target.value } }))} /></td>
                    <td><input className="table-input" value={composer.details.color ?? "Ruby and White Stone"} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, color: e.target.value } }))} /></td>
                    <td><input className="table-input" value={composer.details.qty ?? "1"} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, qty: e.target.value } }))} /></td>
                    <td><input className="table-input" value={composer.details.status ?? ""} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, status: e.target.value } }))} /></td>
                    <td><input className="table-input" value={composer.details.category ?? ""} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, category: e.target.value } }))} /></td>
                  </tr>
                  <tr className="worksheet-head-row stone-head-row">
                    <th>STONES</th>
                    <th>SIZE</th>
                    <th>QTY</th>
                    <th>X</th>
                    <th>RATE</th>
                    <th>STN RATE</th>
                    <th>SET CHRG</th>
                    <th>TOTAL CHRG</th>
                  </tr>
                  {composer.rows.map((row, index) => {
                    const rowTotals = composerRowsWithTotals[index];
                    return (
                      <tr
                        className={`worksheet-row-grid stone-data-row ${draggingStoneIndex === index ? "is-dragging" : ""} ${dragOverStoneIndex === index ? "is-drop-target" : ""}`}
                        key={index}
                        onDragOver={(event) => {
                          if (draggingStoneIndex === null || draggingStoneIndex === index) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDragOverStoneIndex(index);
                        }}
                        onDragLeave={() => {
                          setDragOverStoneIndex((current) => (current === index ? null : current));
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (draggingStoneIndex !== null) reorderComposerRow(draggingStoneIndex, index);
                        }}
                      >
                        <td className="stone-name-cell">
                          <div className="stone-name-wrap">
                            <input
                              className={`table-input stone-search-input ${row.description && !STONE_NAME_OPTIONS.includes(row.description) ? "invalid-stone-input" : ""}`}
                              list={`stone-name-options-${index}`}
                              value={row.description}
                              placeholder="Select stone"
                              onChange={(e) => updateComposerRow(index, { description: e.target.value })}
                            />
                            <datalist id={`stone-name-options-${index}`}>
                              {getStoneNameSuggestions(row.description).map((option) => (
                                <option key={option} value={option} />
                              ))}
                            </datalist>
                            <button
                              type="button"
                              className="stone-dots-btn"
                              draggable
                              aria-expanded={openStoneMenu === index}
                              aria-label="Row options"
                              title="Drag to move row or click for row options"
                              onClick={() => setOpenStoneMenu((current) => (current === index ? null : index))}
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("text/plain", String(index));
                                setDraggingStoneIndex(index);
                                setDragOverStoneIndex(null);
                                setOpenStoneMenu(null);
                              }}
                              onDragEnd={() => {
                                setDraggingStoneIndex(null);
                                setDragOverStoneIndex(null);
                              }}
                            >
                              ...
                            </button>
                            {openStoneMenu === index && (
                              <div className="stone-row-menu" role="menu">
                                <button type="button" role="menuitem" onClick={() => addComposerRow(index)}>Add Row</button>
                                <button type="button" role="menuitem" onClick={() => deleteComposerRow(index)}>Delete Row</button>
                                <button type="button" role="menuitem" disabled={index === 0} onClick={() => moveComposerRow(index, -1)}>Move Up</button>
                                <button type="button" role="menuitem" disabled={index === composer.rows.length - 1} onClick={() => moveComposerRow(index, 1)}>Move Down</button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                              className={`table-input stone-search-input ${!isValidStoneSize(row.description, row.size) ? "invalid-stone-input" : ""}`}
                            list={`stone-size-options-${index}`}
                            value={row.size}
                            placeholder="Select size"
                            onChange={(e) => updateComposerRow(index, { size: e.target.value })}
                          />
                          <datalist id={`stone-size-options-${index}`}>
                            {getStoneSizeOptions(row.description).map((option) => (
                              <option key={option} value={option} />
                            ))}
                            {!isValidStoneSize(row.description, row.size) && (
                              <option value={row.size} />
                            )}
                          </datalist>
                        </td>
                        <td><input className="table-input" value={row.qty} onChange={(e) => updateComposerRow(index, { qty: e.target.value })} /></td>
                        <td className="estimate-x-cell">X</td>
                        <td><input className="table-input" value={row.rate} onChange={(e) => updateComposerRow(index, { rate: e.target.value })} /></td>
                        <td><strong>{rowTotals?.stoneValue ? rowTotals.stoneValue.toFixed(2) : "0.00"}</strong></td>
                        <td><input className="table-input" value={row.setChrg} onChange={(e) => updateComposerRow(index, { setChrg: e.target.value })} /></td>
                        <td><strong>{rowTotals ? rowTotals.setValue.toFixed(2) : "0.00"}</strong></td>
                      </tr>
                    );
                  })}
                  <tr className="footer-data-row">
                    <th colSpan={2}>
                      <div className="stone-name-wrap footer-formula-label-wrap">
                        <span>RODIUM WEIGHT</span>
                        <button
                          type="button"
                          className="stone-dots-btn vertical-dots-btn"
                          aria-label="Footer formula options"
                          onClick={() => setOpenFooterMenuId((current) => (current === "rodium-weight" ? null : "rodium-weight"))}
                        >
                          {"\u22EE"}
                        </button>
                        {openFooterMenuId === "rodium-weight" && (
                          <div className="stone-row-menu" role="menu" data-row-menu>
                            <button type="button" role="menuitem" onClick={() => addComposerFooterRow()}>Add Formula Row</button>
                          </div>
                        )}
                      </div>
                    </th>
                    <td className="footer-value-cell"><strong>{composerGrossWeight ? composerGrossWeight.toFixed(2) : "0.00"}</strong></td>
                    <td>X</td>
                    <td className="footer-input-cell"><input className="table-input" value={composer.details.rodiumRate ?? ""} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, rodiumRate: e.target.value } }))} /></td>
                    <td className="footer-blank-cell" colSpan={2}></td>
                    <td className="footer-value-cell"><strong>{composerRodiumValue ? composerRodiumValue.toFixed(2) : "0.00"}</strong></td>
                  </tr>
                  {composerFooterRowsWithTotals.map((row) => (
                    <tr className={`footer-data-row custom-footer-formula-row ${row.includeInGrandTotal ? "" : "not-in-grand-total-row"}`} key={row.id}>
                      <th colSpan={2}>
                        <div className="stone-name-wrap footer-formula-label-wrap">
                          <input
                            className="table-input"
                            value={row.label}
                            onChange={(event) => updateComposerFooterRow(row.id, { label: event.target.value })}
                          />
                          {!row.includeInGrandTotal && <em className="footer-grand-total-indicator">Not in Grand Total</em>}
                          <button
                            type="button"
                            className="stone-dots-btn vertical-dots-btn"
                            aria-label="Footer formula row options"
                            onClick={() => setOpenFooterMenuId((current) => (current === row.id ? null : row.id))}
                          >
                            {"\u22EE"}
                          </button>
                          {openFooterMenuId === row.id && (
                          <div className="stone-row-menu" role="menu" data-row-menu>
                              <button type="button" role="menuitem" onClick={() => addComposerFooterRow(row.id)}>Add Formula Row</button>
                              <button type="button" role="menuitem" onClick={() => deleteComposerFooterRow(row.id)}>Delete Formula Row</button>
                            </div>
                          )}
                        </div>
                      </th>
                      <td className="footer-input-cell">
                        <input className="table-input" value={row.qty || ""} onChange={(event) => updateComposerFooterRow(row.id, { qty: event.target.value })} />
                      </td>
                      <td>X</td>
                      <td className="footer-input-cell">
                        <input className="table-input" value={row.rate || ""} onChange={(event) => updateComposerFooterRow(row.id, { rate: event.target.value })} />
                      </td>
                      <td className="footer-value-cell"><strong>{row.stoneValue ? row.stoneValue.toFixed(2) : "0.00"}</strong></td>
                      <td className="footer-input-cell">
                        <input className="table-input" value={row.setChrg || ""} onChange={(event) => updateComposerFooterRow(row.id, { setChrg: event.target.value })} />
                      </td>
                      <td className="footer-value-cell"><strong>{row.setValue ? row.setValue.toFixed(2) : "0.00"}</strong></td>
                    </tr>
                  ))}
                  <tr className="footer-data-row">
                    <th colSpan={2}>GAHT WEIGHT</th>
                    <td className="footer-input-cell"><input className="table-input" value={composer.details.grossWeight ?? "218.30"} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, grossWeight: e.target.value } }))} /></td>
                    <td>X</td>
                    <td className="footer-input-cell"><input className="table-input" value={composer.details.makingChargeRate ?? "5.00"} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, makingChargeRate: e.target.value } }))} /></td>
                    <td className="footer-blank-cell" colSpan={2}></td>
                    <td className="footer-value-cell"><strong>{composerMakingChargeValue ? composerMakingChargeValue.toFixed(2) : "0.00"}</strong></td>
                  </tr>
                  <tr className="footer-data-row">
                    <th colSpan={2}>POLISH</th>
                    <td className="footer-input-cell"><input className="table-input" value={composer.details.qty ?? "1"} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, qty: e.target.value } }))} /></td>
                    <td>X</td>
                    <td className="footer-input-cell"><input className="table-input" value={composer.details.polishRate ?? "24.00"} onChange={(e) => setComposer((prev) => ({ ...prev, details: { ...prev.details, polishRate: e.target.value } }))} /></td>
                    <td className="footer-blank-cell" colSpan={2}></td>
                    <td className="footer-value-cell"><strong>{composerPolishValue ? composerPolishValue.toFixed(2) : "0.00"}</strong></td>
                  </tr>
                  <tr className="footer-data-row">
                    <th colSpan={2}>TOTAL K.G. 1 PC</th>
                    <td className="footer-value-cell"><strong>{composerTotalKgStone ? composerTotalKgStone.toFixed(2) : "0.00"}</strong></td>
                    <td className="footer-blank-cell" colSpan={5}></td>
                  </tr>
                  <tr className="footer-data-row">
                    <th colSpan={2}>TOTAL QTY</th>
                    <td className="footer-blank-cell" colSpan={4}></td>
                    <td className="footer-value-cell"><strong>{composerPolishQty ? composerPolishQty.toFixed(2) : "0.00"}</strong></td>
                    <td className="footer-blank-cell"></td>
                  </tr>
                  <tr className="footer-data-row">
                    <th colSpan={2}>TOTAL K.G.</th>
                    <td className="footer-value-cell"><strong>{composerTotalKgStoneForQty ? composerTotalKgStoneForQty.toFixed(2) : "0.00"}</strong></td>
                    <td className="footer-blank-cell" colSpan={4}></td>
                    <td className="footer-value-cell"><strong>{composerTotalCharge ? composerTotalCharge.toFixed(2) : "0.00"}</strong></td>
                  </tr>
                  <tr className="footer-data-row">
                    <th colSpan={2}>TOTAL K.G. GRAMS 1 PC</th>
                    <td className="footer-blank-cell" colSpan={6}></td>
                  </tr>
                  <tr className="footer-data-row">
                    <th colSpan={2}>TOTAL K.G. GRAMS</th>
                    <td className="footer-blank-cell" colSpan={4}></td>
                    <td className="footer-value-cell"><strong>{composerTotalKgGrams ? composerTotalKgGrams.toFixed(2) : "0.00"}</strong></td>
                    <td className="footer-blank-cell"></td>
                  </tr>
                  <tr className="footer-data-row grand-total-row">
                    <th colSpan={2}>GRAND TOTAL</th>
                    <td className="footer-value-cell"><strong>{composerGrandTotal ? composerGrandTotal.toFixed(2) : "0.00"}</strong></td>
                    <td className="footer-blank-cell" colSpan={5}></td>
                  </tr>
              </tbody>
              </table>
            </section>

          </>
        )}

        {showResults && (
          catalogMode ? (
            <div className="catalog-view-shell">
              <div className="default-art-strip-head">
                <h2>Catalog</h2>
                <span>{selectedCatlog ? `${selectedCatlog} catalog` : "All categories"}</span>
              </div>
              <div className="catalog-gallery">
                {filtered.map((product) => (
                  <div
                    role="button"
                    tabIndex={0}
                    className="catalog-card"
                    key={product.art_number}
                    onClick={() => openArt(product.art_number)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openArt(product.art_number);
                      }
                    }}
                  >
                    <div className="catalog-card-image">
                      {product.cad_image ? (
                        <img
                          src={product.cad_image}
                          alt={product.product_name ?? product.art_number}
                        />
                      ) : (
                        <div className="catalog-card-placeholder">
                          <strong>{(product.product_name ?? product.art_number).slice(0, 24)}</strong>
                          <span>{product.category ?? "-"}</span>
                        </div>
                      )}
                    </div>
                    <div className="catalog-card-meta">
                      <strong>{product.product_name ?? "Untitled product"}</strong>
                      <span>Art No: {product.art_number}</span>
                      <span className="catalog-link-btn">
                        Party: {product.party_name ?? product.customer ?? "-"}
                      </span>
                      <span>Item: {product.product_name ?? "-"}</span>
                      <span>Grand Total: {Number(product.total_estimation_cost ?? 0).toFixed(2)}</span>
                      <div
                        className="catalog-color-strip"
                        aria-label="Product colors"
                      >
                        {extractCatalogColorTokens(product).length > 0 ? (
                          extractCatalogColorTokens(product).map((token) => (
                            <span
                              key={token}
                              className="catalog-color-dot"
                              title={token}
                              aria-label={token}
                              style={{ backgroundColor: colorTokenToHex(token) }}
                            />
                          ))
                        ) : (
                          <span className="catalog-color-dot catalog-color-dot-empty" aria-hidden="true" />
                        )}
                      </div>
                      {extractCatalogPartyNames(product).length > 1 && (
                        <span className="catalog-partner-strip" aria-label="Multiple partner names">
                          {extractCatalogPartyNames(product).slice(0, 2).map((name) => (
                            <span className="catalog-partner-pill" key={name}>{name}</span>
                          ))}
                          <span className="catalog-partner-more">More</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {!filtered.length && !loading && <div className="empty-state">No catalog items found.</div>}
              </div>
            </div>
          ) : (
            <div className="search-results">
              {filtered
                .filter((product) => !recommendedKeys.has(product.art_number))
                .map((product) => (
                <div role="button" tabIndex={0} className="result-row premium-result" key={product.art_number} onClick={() => openArt(product.art_number)}>
                  <span
                    className={`select-chip ${selectedArtNumbers.has(product.art_number) ? "selected" : ""}`}
                    role="checkbox"
                    aria-checked={selectedArtNumbers.has(product.art_number)}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleSelectedArt(product.art_number);
                    }}
                  >
                    <span>Select</span><span className="select-check" aria-hidden="true"></span>
                  </span>
                  <div className="result-main">
                    <strong>{product.product_name ?? "Untitled product"}</strong>
                    <span>{product.art_number}</span>
                  </div>
                  <div>
                    <span>Party</span>
                    <strong>{product.party_name ?? product.customer ?? "-"}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{product.status ?? "-"}</strong>
                  </div>
                  <div>
                    <span>Category</span>
                    <strong>{product.category ?? "-"}</strong>
                  </div>
                  <div>
                    <span>Created</span>
                    <strong>{formatProductDate(product.created_at)}</strong>
                  </div>
                  <div className="modified-export-cell">
                    <span>Modified</span>
                    <div className="modified-export-row">
                      <strong>{formatProductDate(product.updated_at)}</strong>
                      {selectedArtNumbers.has(product.art_number) && renderRowDownloadMenu(product)}
                    </div>
                  </div>
                </div>
              ))}
              {!filtered.length && !loading && query.trim() && <div className="empty-state">No product found for "{query.trim()}".</div>}
            </div>
          )
        )}
      </section>
    </main>
  );
}

