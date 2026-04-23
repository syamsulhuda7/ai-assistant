import OpenAI from "openai";
import { supabase } from "../../../lib/supabase";

// ==================================================
// SIMPLE VERSION - TOKOKITA AI SUPPORT
// ==================================================

type Role = "user" | "ai";

type SourceType =
  | "user"
  | "cache"
  | "ai"
  | "db:products_category"
  | "db:products_best_seller";

const client = new OpenAI({
  apiKey: process.env.MAIA_API_KEY,
  baseURL: "https://api.maiarouter.ai/v1",
});

const BASE_COMPANY_INFO = `
Kamu adalah AI Customer Support resmi dari TokoKita.

Kamu hanya melayani pertanyaan berikut:
- Cara melakukan pemesanan
- Informasi pengiriman
- Informasi COD
- Jam pengiriman
- Hari operasional pengiriman
- Promo dan diskon yang sedang berjalan
- Bantuan pelayanan umum terkait toko

Informasi perusahaan:
- Pesanan hanya melalui website: https://webkita.com
- Pesanan maksimal jam 12 siang dikirim di hari yang sama
- Pengiriman setiap hari kecuali tanggal merah
- COD tersedia untuk seluruh Pulau Jawa
- Promo aktif: diskon 10% minimal belanja Rp200.000 sampai 22 Juni
- Promo beli 2 gratis 1 untuk produk berlabel khusus

Aturan penting:
- Jawaban harus natural seperti customer service manusia
- Jangan mengarang data
- Gunakan hanya data yang diberikan
- Jika user bertanya tentang produk, stok, harga, kategori, atau rekomendasi produk, arahkan user untuk melihat langsung melalui website kami di https://webkita.com
- Jangan menjawab detail produk dari database
- Singkat, ramah, profesional
`;

// ==================================================
// HELPERS
// ==================================================

function normalizeQuestion(text: string) {
  return text
    .toLowerCase()
    .replace(/[!?.,;:()[\]{}"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function calculateCost(inputTokens: number, outputTokens: number) {
  const USD_TO_IDR = 17000;
  const PRICE_PER_1M_TOKEN = 0.15;

  const inputCostUsd = (inputTokens / 1_000_000) * PRICE_PER_1M_TOKEN;
  const outputCostUsd = (outputTokens / 1_000_000) * PRICE_PER_1M_TOKEN;

  const inputCost = inputCostUsd * USD_TO_IDR;
  const outputCost = outputCostUsd * USD_TO_IDR;

  return {
    input_token: inputTokens,
    output_token: outputTokens,
    total_token: inputTokens + outputTokens,
    input_cost: Number(inputCost.toFixed(2)),
    output_cost: Number(outputCost.toFixed(2)),
    total_cost: Number((inputCost + outputCost).toFixed(2)),
  };
}

async function saveMessage({
  session_id,
  role,
  content,
  source,
  usage,
}: {
  session_id: string;
  role: Role;
  content: string;
  source: SourceType;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}) {
  if (!session_id) {
    console.error("session_id is required");
    return;
  }

  const cost = calculateCost(
    usage?.prompt_tokens || 0,
    usage?.completion_tokens || 0,
  );

  const payload = {
    session_id,
    role,
    content,
    source,
    input_token: cost.input_token,
    output_token: cost.output_token,
    total_token: cost.total_token,
    input_cost: cost.input_cost,
    output_cost: cost.output_cost,
    total_cost: cost.total_cost,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("messages").insert(payload);

  if (error) {
    console.error("Failed saveMessage:", error.message, payload);
  }
}

async function getCache(question: string) {
  // const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("ai_cache")
    .select("*")
    .eq("question", question)
    // .gte("expired_at", today)
    .maybeSingle();

  return data;
}

async function saveCache(question: string, answer: string) {
  await supabase.from("ai_cache").upsert({
    question,
    answer,
    usage_count: 1,
    created_at: new Date().toISOString(),
    expired_at: addDays(7),
  });
}

function isProductQuestion(message: string) {
  const text = message.toLowerCase();

  const keywords = [
    "produk",
    "barang",
    "stok",
    "harga",
    "kategori",
    "best seller",
    "terlaris",
    "rekomendasi",
    "skincare",
    "fashion",
    "elektronik",
    "makanan",
    "rumah tangga",
  ];

  return keywords.some((k) => text.includes(k));
}

async function getProductData() {
  return null;
}

// ==================================================
// MAIN
// ==================================================

async function ensureSession(session_id: string) {
  if (!session_id) return;

  const { error } = await supabase.from("sessions").upsert(
    {
      id: session_id,
      last_activity: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    console.error("Failed ensureSession:", error.message);
  }
}

export async function POST(req: Request) {
  const { message, session_id } = await req.json();

  const normalizedQuestion = normalizeQuestion(message);

  // pastikan session tersedia dulu agar tidak kena foreign key error
  await ensureSession(session_id);

  // save user message
  await saveMessage({
    session_id,
    role: "user",
    content: message,
    source: "user",
  });

  // cache first
  const cache = await getCache(normalizedQuestion);

  if (cache) {
    await saveMessage({
      session_id,
      role: "ai",
      content: cache.answer,
      source: "cache",
    });

    return Response.json({
      reply: cache.answer,
      source: "cache",
    });
  }

  let extraContext = "";
  let source: SourceType = "ai";

  // jika pertanyaan produk, arahkan ke website
  if (isProductQuestion(message)) {
    extraContext = `
User menanyakan tentang produk.

Jawaban yang benar:
Arahkan user secara sopan untuk melihat detail produk, harga, stok, dan kategori langsung melalui website resmi kami di https://webkita.com
Jangan menjelaskan detail produk secara langsung.
`;

    source = "ai";
  }

  const aiRes = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 250,
    messages: [
      {
        role: "system",
        content: BASE_COMPANY_INFO,
      },
      {
        role: "user",
        content: `User message: ${message}\n\n${extraContext}`,
      },
    ],
  });

  const reply =
    aiRes.choices[0].message.content ||
    "Maaf, saya belum bisa membantu untuk pertanyaan tersebut.";

  const usage = aiRes.usage || {
    prompt_tokens: 0,
    completion_tokens: 0,
  };

  // save ai response
  await saveMessage({
    session_id,
    role: "ai",
    content: reply,
    source,
    usage,
  });

  // save cache
  await saveCache(normalizedQuestion, reply);

  return Response.json({
    reply,
    source,
  });
}
