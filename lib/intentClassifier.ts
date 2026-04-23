export type Intent = "faq" | "product" | "shipping" | "order" | "general";

export function classifyIntent(message: string): Intent {
  const text = message.toLowerCase();

  if (text.includes("cod") || text.includes("bayar")) return "faq";

  if (text.includes("harga") || text.includes("berapa")) return "product";

  if (text.includes("ongkir") || text.includes("kirim")) return "shipping";

  if (text.includes("pesanan") || text.includes("order")) return "order";

  return "general";
}
