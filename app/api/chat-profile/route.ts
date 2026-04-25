import OpenAI from "openai";
import { supabase } from "../../../lib/supabase";

// ==================================================
// PROFILE AI ASSISTANT API
// ==================================================

type Role = "user" | "ai";

type SourceType = "user" | "cache" | "ai";

const client = new OpenAI({
  apiKey: process.env.MAIA_API_KEY,
  baseURL: "https://api.maiarouter.ai/v1",
});

const BASE_PROFILE_INFO = `
Kamu adalah AI Assistant yang hanya bertugas menjawab pertanyaan berdasarkan profil profesional Syamsul Huda Harisul Muslimin.

Gunakan hanya informasi berikut:

Nama:
Syamsul Huda Harisul Muslimin

Lokasi:
Tulungagung, Jawa Timur, Indonesia

Profesi:
Full-stack Web and Mobile Developer

Summary:
Memiliki hampir 2 tahun pengalaman profesional dalam membangun aplikasi web dan mobile untuk operasional bisnis, monitoring system, shipment management, dan solusi berbasis AI.

Berpengalaman mengembangkan sistem end-to-end mulai dari planning, backend architecture, frontend development, deployment, performance optimization, hingga server maintenance menggunakan VPS.

Fokus utama:
- scalable application
- high-performance system
- business process optimization
- real-time tracking system
- AI-powered solutions
- operational dashboard
- mobile and web development

Tech Stack:
- Frontend: React.js, Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js, Laravel
- Mobile: React Native, Android Studio, Java
- Database: PostgreSQL, MySQL, MongoDB, SQL Server
- Others: Git, GitHub, VPS Deployment, REST API, OOP

Current Experience:
System Developer - PT. Sinergi Distribusi Utama (Jun 2024 - Present)

Responsibilities:
- shipment monitoring system
- live tracking application
- dashboard operational system
- backend services
- database management
- VPS deployment
- internal verification systems
- ID card generator app
- company profile website
- deployment automation

Highlighted Projects:
1. AI Assistant (Chat & Analytics)
- AI customer support system
- FAQ auto-response
- session management
- token usage tracking
- cost monitoring
- analytics dashboard
- Next.js, OpenAI API, Supabase, PostgreSQL

2. Kiriman App
- shipment monitoring
- attendance management
- live tracking
- interactive maps
- push notification
- mobile + web system

3. SYAMRESTO
- restaurant management system
- menu management
- QR checkout
- upcoming payment gateway integration

Education:
Bachelor Degree (S1) - Agroecotechnology
Brawijaya University
GPA 3.72

Certification:
- Full Stack Programming (MERN) - Eduwork
- HackerRank Problem Solving Certification
- Codewars Level 5 Kyu

Languages:
- Indonesian (Native)
- Javanese (Native)
- English (Intermediate)

Rules:
- Jawaban harus singkat, jelas, profesional, dan natural
- Jangan mengarang data
- Gunakan hanya informasi yang diberikan
- Jika informasi tidak tersedia, jawab dengan jujur bahwa informasi tersebut tidak tercantum pada profil
- Fokus hanya menjawab pertanyaan tentang profil profesional, pengalaman kerja, project, skill, pendidikan, dan sertifikasi
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

async function ensureSession(session_id: string) {
  if (!session_id) return;

  await supabase.from("sessions_profile").upsert(
    {
      id: session_id,
      last_activity: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );
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
  const cost = calculateCost(
    usage?.prompt_tokens || 0,
    usage?.completion_tokens || 0,
  );

  await supabase.from("messages_profile").insert({
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
  });
}

async function getCache(question: string) {
  //   const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("ai_cache_profile")
    .select("*")
    .eq("question", question)
    // .gte("expired_at", today)
    .maybeSingle();

  return data;
}

async function saveCache(question: string, answer: string) {
  await supabase.from("ai_cache_profile").upsert({
    question,
    answer,
    usage_count: 1,
    created_at: new Date().toISOString(),
    expired_at: addDays(7),
  });
}

// ==================================================
// MAIN API
// ==================================================

export async function POST(req: Request) {
  const { message, session_id } = await req.json();

  if (!message || !session_id) {
    return Response.json(
      {
        error: "message and session_id are required",
      },
      {
        status: 400,
      },
    );
  }

  const normalizedQuestion = normalizeQuestion(message);

  await ensureSession(session_id);

  await saveMessage({
    session_id,
    role: "user",
    content: message,
    source: "user",
  });

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

  const aiRes = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content: BASE_PROFILE_INFO,
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  const reply =
    aiRes.choices[0].message.content ||
    "Maaf, saya belum dapat membantu untuk pertanyaan tersebut.";

  const usage = aiRes.usage || {
    prompt_tokens: 0,
    completion_tokens: 0,
  };

  await saveMessage({
    session_id,
    role: "ai",
    content: reply,
    source: "ai",
    usage,
  });

  await saveCache(normalizedQuestion, reply);

  return Response.json({
    reply,
    source: "ai",
  });
}
