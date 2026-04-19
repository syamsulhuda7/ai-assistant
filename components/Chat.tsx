"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "ai" | string;
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 🔥 Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 Auto focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: input,
          history: newMessages,
        }),
      });

      const data = await res.json();

      setMessages([...newMessages, { role: "ai", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "ai", content: "Terjadi kesalahan, coba lagi." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 px-4">
      <h2 className="text-2xl font-semibold text-center mb-4">
        AI Customer Support
      </h2>

      {/* Chat Box */}
      <div className="h-[400px] overflow-y-auto border rounded-xl p-4 bg-gray-50 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* 🔥 Empty State */}
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-20">
              Mulai percakapan dengan AI...
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 transition-all duration-300 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* 🔥 Avatar AI */}
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-full bg-gray-400 flex-shrink-0" />
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

                {/* 🔥 Timestamp */}
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* 🔥 Avatar User */}
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
          ))}

          {/* 🔥 Typing Indicator */}
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
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
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
