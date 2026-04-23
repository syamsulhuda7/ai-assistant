// import OpenAI from "openai";
// import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
// import { supabase } from "../../../lib/supabase";

// const client = new OpenAI({
//   apiKey: process.env.MAIA_API_KEY,
//   baseURL: "https://api.maiarouter.ai/v1",
// });

// const basePrompt = `
// Kamu adalah customer support dari toko online bernama "TokoKita".

// Informasi:
// - Pengiriman: 2-5 hari kerja
// - COD tersedia di: Jakarta, Surabaya, Bandung
// - Jam operasional: 08.00 - 17.00

// Aturan:
// - Jawaban singkat, jelas, ramah
// - Bahasa Indonesia santai tapi sopan
// - Jika tidak yakin, arahkan ke admin
// - Jangan mengarang informasi di luar data yang diberikan
// `;

// const faqs = [
//   {
//     keywords: ["cod", "bayar ditempat"],
//     answer: "Ya, kami menyediakan COD di Jakarta, Surabaya, dan Bandung.",
//     followUpRequired: true,
//   },
//   {
//     keywords: ["pengiriman", "berapa lama", "delivery"],
//     answer: "Pengiriman memakan waktu 2-5 hari kerja.",
//     followUpRequired: false,
//   },
//   {
//     keywords: ["jam buka", "jam operasional"],
//     answer: "Kami buka pukul 08.00 - 17.00.",
//     followUpRequired: false,
//   },
// ];

// function findFAQ(message: string) {
//   const lowerMsg = message.toLowerCase();

//   for (const faq of faqs) {
//     for (const keyword of faq.keywords) {
//       if (lowerMsg.includes(keyword)) {
//         return faq;
//       }
//     }
//   }

//   return null;
// }

// type Message = {
//   role: "user" | "ai";
//   content: string;
// };

// function formatMessages(history: Message[]): ChatCompletionMessageParam[] {
//   return history.map((msg) => ({
//     role: msg.role === "ai" ? "assistant" : "user",
//     content: msg.content,
//   }));
// }

// export async function POST(req: Request) {
//   const { message, history, session_id } = await req.json();
//   console.log("session : " + session_id);
//   const recentHistory = history?.slice(-6) || [];

//   // 🔥 Detect follow-up
//   const lastUserMessage =
//     recentHistory
//       .slice()
//       .reverse()
//       .find((msg: any) => msg.role === "user")
//       ?.content?.toLowerCase() || "";

//   const isFollowUp =
//     message.toLowerCase().length < 25 && lastUserMessage.length > 0;

//   // 🔥 STEP 1: cek FAQ
//   const faq = findFAQ(message);

//   if (session_id) {
//     await supabase
//       .from("sessions")
//       .upsert(
//         { id: session_id, last_activity: new Date() },
//         { onConflict: "id" },
//       );
//   }

//   // 🔥 SAVE USER MESSAGE (selalu disimpan)
//   await supabase.from("messages").insert({
//     session_id,
//     role: "user",
//     content: message,
//   });

//   if (faq && !isFollowUp && !faq.followUpRequired) {
//     // 🔥 SAVE FAQ RESPONSE (tanpa AI → token = 0)
//     await supabase.from("messages").insert({
//       session_id,
//       role: "ai",
//       content: faq.answer,
//       input_tokens: 0,
//       output_tokens: 0,
//       total_tokens: 0,
//       cost: 0,
//     });

//     return Response.json({
//       reply: faq.answer,
//     });
//   }

//   // 🔥 STEP 2: AI
//   try {
//     const systemPrompt = `
// ${basePrompt}

// Tugas kamu:
// 1. Pahami maksud user (pertanyaan, komplain, marah, pujian)
// 2. Respon:
// - Komplain → empati + solusi
// - Marah → minta maaf + arahkan ke admin
// - Pujian → apresiasi
// - Pertanyaan → jawab jelas

// Gunakan hanya informasi yang tersedia.
// `;

//     const aiMessages: ChatCompletionMessageParam[] = [
//       {
//         role: "system",
//         content: systemPrompt,
//       },
//       ...formatMessages(recentHistory),
//       {
//         role: "user",
//         content: message,
//       },
//     ];

//     const response = await client.chat.completions.create({
//       model: "openai/gpt-4o-mini",
//       messages: aiMessages,
//       max_tokens: 100,
//       temperature: 0.7,
//     });

//     const reply = response.choices[0].message.content;

//     type ResponseUsage = {
//       total_tokens: number;
//       prompt_tokens: number;
//       completion_tokens: number;
//     };
//     const usage: ResponseUsage = response.usage || {
//       total_tokens: 0,
//       prompt_tokens: 0,
//       completion_tokens: 0,
//     };

//     // 🔥 Estimasi cost
//     const inputRate = 0.15 / 1_000_000;
//     const outputRate = 0.6 / 1_000_000;

//     const inputTokens = usage.prompt_tokens || 0;
//     const outputTokens = usage.completion_tokens || 0;

//     const inputCostUSD = inputTokens * inputRate;
//     const outputCostUSD = outputTokens * outputRate;

//     const totalCostUSD = inputCostUSD + outputCostUSD;

//     const USD_TO_IDR = Number(process.env.USD_TO_IDR || 17000);

//     const inputCost = inputCostUSD * USD_TO_IDR;
//     const outputCost = outputCostUSD * USD_TO_IDR;
//     const totalCost = totalCostUSD * USD_TO_IDR;

//     // 🔥 SAVE AI RESPONSE
//     const { error } = await supabase.from("messages").insert({
//       session_id,
//       role: "ai",
//       content: reply,

//       input_tokens: inputTokens,
//       output_tokens: outputTokens,

//       input_cost: inputCost,
//       output_cost: outputCost,
//       total_cost: totalCost,
//     });

//     if (error) {
//       console.error("DB Error:", error);

//       await supabase.from("messages").insert({
//         session_id,
//         role: "ai",
//         content: "Maaf, terjadi kesalahan dari AI.",
//         input_tokens: 0,
//         output_tokens: 0,
//         input_cost: 0,
//         output_cost: 0,
//         total_cost: 0,
//       });
//     }

//     return Response.json({
//       reply,
//     });
//   } catch (error) {
//     console.error(error);

//     return Response.json({
//       reply: "Maaf, terjadi kesalahan dari AI.",
//     });
//   }
// }
