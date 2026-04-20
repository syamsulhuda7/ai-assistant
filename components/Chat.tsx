"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "ai" | string;
  content: string;
  created_at: string; // 🔥 tambahin ini
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const SESSION_TIMEOUT = 60 * 1000; // 1 menit

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

    // 🔥 expired → buat baru
    const newSession = crypto.randomUUID();

    localStorage.setItem("session_id", newSession);
    localStorage.setItem("last_activity", now.toString());

    return { sessionId: newSession, isNew: true };
  }

  // 🔥 Init session
  useEffect(() => {
    const { sessionId } = getValidSession();
    setSessionId(sessionId);
  }, []);
  // useEffect(() => {
  //   let id = localStorage.getItem("session_id");

  //   if (!id) {
  //     id = crypto.randomUUID();
  //     localStorage.setItem("session_id", id);
  //   }

  //   setSessionId(id);
  // }, []);

  // 🔥 Load history dari DB

  useEffect(() => {
    if (!sessionId) {
      // console.error("Session ID belum siap");
      return;
    }

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

  // 🔥 Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 Auto focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const { sessionId: validSessionId, isNew } = getValidSession();
    const now = new Date().toISOString();

    if (!input.trim() || loading || !validSessionId) return;

    // 🔥 kalau session baru → reset chat
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
        created_at: now, // 🔥 realtime
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
          created_at: new Date().toISOString(), // fallback
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "ai",
          content: "Terjadi kesalahan, silahkan coba lagi",
          created_at: new Date().toISOString(), // fallback
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
    <div className="max-w-xl mx-auto mt-10 px-4">
      <h2 className="text-2xl font-semibold text-center mb-4">
        AI Customer Support
      </h2>

      {/* Chat Box */}
      <div className="h-[400px] overflow-y-auto border rounded-xl p-4 bg-gray-50 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-20">
              Mulai percakapan dengan AI...
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Avatar AI */}
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-full bg-gray-400" />
              )}

              <div className="flex flex-col">
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>

                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>

              {/* Avatar User */}
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-blue-500" />
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-6 h-6 rounded-full bg-gray-400" />
              <span>AI sedang mengetik...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex mt-4 gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              if (!loading) {
                sendMessage();
              }
            }
          }}
          placeholder="Ketik pesan..."
          className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
