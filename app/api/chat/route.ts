import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
const client = new OpenAI({
  apiKey: process.env.MAIA_API_KEY,
  baseURL: "https://api.maiarouter.ai/v1", // endpoint MAIA
});

const basePrompt = `
Kamu adalah customer support dari toko online bernama "TokoKita".

Informasi:
- Pengiriman: 2-5 hari kerja
- COD tersedia di: Jakarta, Surabaya, Bandung
- Jam operasional: 08.00 - 17.00

Aturan:
- Jawaban singkat, jelas, ramah
- Bahasa Indonesia santai tapi sopan
- Jika tidak yakin, arahkan ke admin
- Jangan mengarang informasi di luar data yang diberikan
`;

const faqs = [
  {
    keywords: ["cod", "bayar ditempat"],
    answer: "Ya, kami menyediakan COD di Jakarta, Surabaya, dan Bandung.",
    followUpRequired: true,
  },
  {
    keywords: ["pengiriman", "berapa lama", "delivery"],
    answer: "Pengiriman memakan waktu 2-5 hari kerja.",
    followUpRequired: false,
  },
  {
    keywords: ["jam buka", "jam operasional"],
    answer: "Kami buka pukul 08.00 - 17.00.",
    followUpRequired: false,
  },
];

function findFAQ(message: string) {
  const lowerMsg = message.toLowerCase();

  for (const faq of faqs) {
    for (const keyword of faq.keywords) {
      if (lowerMsg.includes(keyword)) {
        return faq;
      }
    }
  }

  return null;
}

type Message = {
  role: "user" | "ai";
  content: string;
};

function formatMessages(history: Message[]): ChatCompletionMessageParam[] {
  return history.map((msg) => ({
    role: msg.role === "ai" ? "assistant" : "user",
    content: msg.content,
  }));
}

export async function POST(req: Request) {
  const { message, history } = await req.json();
  const recentHistory = history?.slice(-6) || [];

  // 🔥 cek apakah ini follow-up question
  const lastUserMessage =
    recentHistory
      .slice()
      .reverse()
      .find((msg: any) => msg.role === "user")
      ?.content?.toLowerCase() || "";

  const isFollowUp =
    message.toLowerCase().length < 25 && lastUserMessage.length > 0;

  // 🔥 STEP 1: cek FAQ dulu
  const faq = findFAQ(message);

  if (faq && !isFollowUp && !faq.followUpRequired) {
    return Response.json({
      reply: faq.answer,
    });
  }

  // 🔥 STEP 2: baru pakai AI
  try {
    const systemPrompt = `
    ${basePrompt}

    Tugas kamu:
    1. Pahami maksud user (apakah pertanyaan, komplain, marah, atau pujian)
    2. Berikan respon yang sesuai:
    - Jika komplain → empati + solusi
    - Jika marah → minta maaf + arahkan ke admin (jawaban singkat)
    - Jika pujian → apresiasi
    - Jika pertanyaan → jawab jelas

    Gunakan hanya informasi yang tersedia di atas.
    `;

    const aiMessages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...formatMessages(recentHistory),
      {
        role: "user",
        content: message,
      },
    ];

    const response = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: aiMessages,
      max_tokens: 100,
      temperature: 0.7,
    });

    return Response.json({
      reply: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);

    return Response.json({
      reply: "Maaf, terjadi kesalahan dari AI.",
    });
  }
}
