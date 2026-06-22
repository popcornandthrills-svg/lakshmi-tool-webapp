import { deleteProduct, loadProducts, upsertProduct, type PersistedProduct } from "../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(loadProducts());
  } catch (error) {
    console.error("products GET failed", error);
    const message = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown products error";
    return new Response(message, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { action?: string; product?: PersistedProduct; art_number?: string; design_no?: string };
    const action = String(body.action ?? "upsert").toLowerCase();

    if (action === "delete") {
      deleteProduct(body.art_number ?? body.design_no ?? "");
      return Response.json({ ok: true, products: loadProducts() });
    }

    const incoming = body.product ?? {};
    upsertProduct(incoming);
    return Response.json({ ok: true, product: incoming, products: loadProducts() });
  } catch (error) {
    console.error("products POST failed", error);
    const message = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown products error";
    return new Response(message, { status: 500 });
  }
}
