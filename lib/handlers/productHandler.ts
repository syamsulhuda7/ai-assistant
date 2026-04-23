import { supabase } from "@/lib/supabase";

export type ProductQueryContext = {
  category?: string | null;
  max_price?: number | null;
  keywords?: string | null;
  needs_analysis?: boolean;
  intent?: string;
};

export async function searchProductsAdvanced(ctx: ProductQueryContext) {
  let query = supabase.from("products").select("*");

  // ========================
  // 🔥 FILTER: CATEGORY (name-based)
  // ========================
  if (ctx.category) {
    query = query.ilike("name", `%${ctx.category}%`);
  }

  // ========================
  // 🔥 FILTER: PRICE
  // ========================
  if (ctx.max_price) {
    query = query.lte("price", ctx.max_price);
  }

  // ========================
  // 🔥 FILTER: KEYWORDS (fallback)
  // ========================
  if (ctx.keywords) {
    query = query.or(
      `name.ilike.%${ctx.keywords}%,description.ilike.%${ctx.keywords}%`,
    );
  }

  // ========================
  // 🔥 ORDERING (SMART DEFAULT)
  // ========================
  query = query
    .gt("stock", 0) // hanya produk tersedia
    .order("price", { ascending: true }) // default: murah dulu
    .limit(5);

  const { data, error } = await query;

  if (error) {
    console.error("Product Query Error:", error);
    return [];
  }

  return data;
}
