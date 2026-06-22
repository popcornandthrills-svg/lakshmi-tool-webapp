import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type PersistedProduct = Record<string, unknown> & {
  art_number?: string;
  design_no?: string;
  created_at?: string;
  updated_at?: string;
};

export type PersistedOrderPayload = {
  state?: unknown;
  detailEdit?: unknown;
};

const ROOT_DIR = process.cwd();
const DATA_DIR = process.env.LAKSHMI_DATA_DIR || path.join(ROOT_DIR, ".data");
const DB_PATH = path.join(DATA_DIR, "lakshmi.sqlite");
const BASE_PRODUCTS_PATH = process.env.LAKSHMI_BASE_PRODUCTS_PATH || path.join(ROOT_DIR, "data", "products.json");

let db: DatabaseSync | null = null;

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDb() {
  if (!db) {
    ensureDataDir();
    db = new DatabaseSync(DB_PATH);
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS products (
        art_number TEXT PRIMARY KEY,
        product_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS product_images (
        art_number TEXT NOT NULL,
        kind TEXT NOT NULL,
        file_path TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (art_number, kind)
      );
      CREATE TABLE IF NOT EXISTS order_estimates (
        art_number TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const productColumns = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
    if (!productColumns.some((column) => column.name === "created_at")) {
      db.exec("ALTER TABLE products ADD COLUMN created_at TEXT");
      db.exec("UPDATE products SET created_at = COALESCE(created_at, updated_at, CURRENT_TIMESTAMP)");
    }
  }
  return db;
}

function normalizeKey(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function readBaseProducts(): PersistedProduct[] {
  if (!existsSync(BASE_PRODUCTS_PATH)) return [];
  try {
    return JSON.parse(readFileSync(BASE_PRODUCTS_PATH, "utf8")) as PersistedProduct[];
  } catch {
    return [];
  }
}

export function loadProducts(): PersistedProduct[] {
  const base = readBaseProducts();
  const dbInstance = getDb();
  const customRows = dbInstance.prepare("SELECT product_json, created_at, updated_at FROM products ORDER BY updated_at DESC").all() as Array<{
    product_json: string;
    created_at?: string;
    updated_at?: string;
  }>;
  const custom = customRows.flatMap((row) => {
    try {
      return [{ ...(JSON.parse(row.product_json) as PersistedProduct), created_at: row.created_at, updated_at: row.updated_at }];
    } catch {
      return [];
    }
  });
  const byKey = new Map<string, PersistedProduct>();
  for (const item of base) {
    const key = normalizeKey(item.art_number ?? item.design_no);
    if (key) byKey.set(key, item);
  }
  for (const item of custom) {
    const key = normalizeKey(item.art_number ?? item.design_no);
    if (key) byKey.set(key, item);
  }
  return Array.from(byKey.values());
}

export function upsertProduct(product: PersistedProduct) {
  const key = String(product.art_number ?? product.design_no ?? "").trim();
  if (!key) throw new Error("art_number is required");
  const dbInstance = getDb();
  const existing = dbInstance.prepare("SELECT created_at FROM products WHERE art_number = ?").get(key) as { created_at?: string } | undefined;
  const createdAt = String(product.created_at ?? existing?.created_at ?? new Date().toISOString());
  const updatedAt = new Date().toISOString();
  const productWithDates = { ...product, art_number: key, created_at: createdAt, updated_at: updatedAt };
  dbInstance
    .prepare(
      `INSERT INTO products (art_number, product_json, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(art_number) DO UPDATE SET
         product_json = excluded.product_json,
         updated_at = excluded.updated_at`
    )
    .run(key, JSON.stringify(productWithDates), createdAt, updatedAt);
}

export function deleteProduct(productKey: string) {
  const key = normalizeKey(productKey);
  if (!key) return;
  const dbInstance = getDb();
  const rows = dbInstance.prepare("SELECT art_number FROM products WHERE lower(art_number) = ?").all(key) as Array<{ art_number: string }>;
  const artNumbers = rows.map((row) => row.art_number);
  if (!artNumbers.length) return;
  for (const art of artNumbers) {
    dbInstance.prepare("DELETE FROM products WHERE art_number = ?").run(art);
    dbInstance.prepare("DELETE FROM product_images WHERE art_number = ?").run(art);
    dbInstance.prepare("DELETE FROM order_estimates WHERE art_number = ?").run(art);
  }
}

export function loadOrderEstimate(art: string): PersistedOrderPayload | null {
  const key = normalizeKey(art);
  if (!key) return null;
  const dbInstance = getDb();
  const row = dbInstance.prepare("SELECT payload_json FROM order_estimates WHERE lower(art_number) = ?").get(key) as { payload_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.payload_json) as PersistedOrderPayload;
  } catch {
    return null;
  }
}

export function saveOrderEstimate(art: string, payload: PersistedOrderPayload) {
  const key = String(art ?? "").trim();
  if (!key) throw new Error("art is required");
  const dbInstance = getDb();
  dbInstance
    .prepare(
      `INSERT INTO order_estimates (art_number, payload_json, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(art_number) DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at = CURRENT_TIMESTAMP`
    )
    .run(key, JSON.stringify(payload));
}

export function loadProductImagePath(art: string, kind: "cad" | "sample") {
  const key = normalizeKey(art);
  if (!key) return "";
  const dbInstance = getDb();
  const row = dbInstance
    .prepare("SELECT file_path FROM product_images WHERE lower(art_number) = ? AND kind = ?")
    .get(key, kind) as { file_path: string } | undefined;
  return row?.file_path ?? "";
}

export function saveProductImagePath(art: string, kind: "cad" | "sample", filePath: string) {
  const key = String(art ?? "").trim();
  if (!key) throw new Error("art is required");
  const dbInstance = getDb();
  dbInstance
    .prepare(
      `INSERT INTO product_images (art_number, kind, file_path, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(art_number, kind) DO UPDATE SET
         file_path = excluded.file_path,
         updated_at = CURRENT_TIMESTAMP`
    )
    .run(key, kind, filePath);
}

export function deleteProductImagePath(art: string, kind: "cad" | "sample") {
  const key = normalizeKey(art);
  if (!key) return;
  const dbInstance = getDb();
  dbInstance.prepare("DELETE FROM product_images WHERE lower(art_number) = ? AND kind = ?").run(key, kind);
}
