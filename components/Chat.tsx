"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, BarChart3 } from "lucide-react";
import Link from "next/link";

type Message = {
  role: "user" | "ai" | string;
  content: string;
  created_at: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const SESSION_TIMEOUT = 600 * 1000;

  function getValidSession() {
    const storedSession = localStorage.getItem("session_id");
    const lastActivity = localStorage.getItem("last_activity");
    const now = Date.now();

    if (storedSession && lastActivity) {
      const isExpired = now - Number(lastActivity) > SESSION_TIMEOUT;

      if (!isExpired) {
        return { sessionId: storedSession, isNew: false };
      }
    }

    const newSession = crypto.randomUUID();

    localStorage.setItem("session_id", newSession);
    localStorage.setItem("last_activity", now.toString());

    return { sessionId: newSession, isNew: true };
  }

  useEffect(() => {
    const { sessionId } = getValidSession();
    setSessionId(sessionId);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const loadHistory = async () => {
      const res = await fetch("/api/history", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await res.json();

      const formatted = data.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
      }));

      setMessages(formatted);
    };

    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const { sessionId: validSessionId, isNew } = getValidSession();
    const now = new Date().toISOString();

    if (!input.trim() || loading || !validSessionId) return;

    if (isNew) {
      setMessages([
        {
          role: "ai",
          content:
            "Session sebelumnya telah berakhir, memulai percakapan baru.",
          created_at: now,
        },
      ]);
      setSessionId(validSessionId);
    }

    localStorage.setItem("last_activity", Date.now().toString());

    const newMessages = [
      ...(isNew ? [] : messages),
      {
        role: "user",
        content: input,
        created_at: now,
      },
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: input,
          history: newMessages,
          session_id: validSessionId,
        }),
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        {
          role: "ai",
          content: data.reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "ai",
          content: "Terjadi kesalahan, silakan coba lagi.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="h-screen overflow-hidden bg-black text-white px-4 md:px-6 py-6">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm text-gray-300">
                  TokoKita AI Assistant
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                AI Customer Support
              </h1>

              <p className="text-gray-400 max-w-xl text-sm md:text-base">
                Pelayanan cepat untuk pertanyaan seputar pengiriman, pemesanan,
                promo, dan bantuan pelanggan.
              </p>
            </div>

            {/* BUTTON TO DASHBOARD */}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 transition-all shadow-lg"
            >
              <BarChart3 className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">
                Dashboard Analytics
              </span>
            </Link>
          </div>
        </div>

        {/* CHAT CONTAINER */}
        <div className="flex-1 rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col min-h-0">
          {/* CHAT BODY */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-gradient-to-b from-zinc-950 to-zinc-900 min-h-0">
            <div className="flex flex-col gap-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-24">
                  <Bot className="w-12 h-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 text-sm">
                    Mulai percakapan dengan AI Customer Support
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-gray-300" />
                    </div>
                  )}

                  <div className="max-w-[80%]">
                    <div
                      className={`px-5 py-3 rounded-3xl text-sm leading-relaxed shadow-lg ${
                        msg.role === "user"
                          ? "bg-white text-black rounded-br-md"
                          : "bg-zinc-800 text-gray-100 rounded-bl-md border border-white/5"
                      }`}
                    >
                      {msg.content}
                    </div>

                    <p className="text-[11px] text-gray-500 mt-2 px-2">
                      {formatTime(msg.created_at)}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-gray-300" />
                  </div>

                  <div className="px-5 py-3 rounded-3xl bg-zinc-800 border border-white/5 text-sm text-gray-400 animate-pulse">
                    AI sedang mengetik...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* INPUT AREA */}
          <div className="border-t border-white/10 bg-zinc-950 p-4 md:p-5">
            <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 rounded-2xl p-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading) sendMessage();
                  }
                }}
                placeholder="Tulis pesan Anda..."
                className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                  loading
                    ? "bg-zinc-700 cursor-not-allowed"
                    : "bg-white text-black hover:scale-105"
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
