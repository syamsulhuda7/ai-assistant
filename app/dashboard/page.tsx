"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Activity,
  Wallet,
  MessageCircle,
  Calendar,
} from "lucide-react";

type Analytics = {
  total_sessions: number;
  total_messages: number;
  total_cost: number;
  avg_cost_per_session: number;
  avg_cost_per_message: number;
  top_sessions: {
    session_id: string;
    cost: number;
    messageCount: number;
    last_chat_date?: string | null;
  }[];
};

export default function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  const formatRupiah = (num: number) =>
    "Rp " + Number(num || 0).toLocaleString("id-ID");

  const formatDate = (date?: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm text-gray-300">TokoKita Analytics</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Monitoring performa AI Customer Support, session usage, dan biaya
            token secara real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card
            title="Total Sessions"
            value={data?.total_sessions}
            icon={<Activity className="w-5 h-5" />}
          />
          <Card
            title="Total Messages"
            value={data?.total_messages}
            icon={<MessageCircle className="w-5 h-5" />}
          />
          <Card
            title="Total Cost"
            value={formatRupiah(data?.total_cost || 0)}
            icon={<Wallet className="w-5 h-5" />}
          />
          <Card
            title="Avg / Session"
            value={formatRupiah(data?.avg_cost_per_session || 0)}
            icon={<Wallet className="w-5 h-5" />}
          />
          <Card
            title="Avg / Message"
            value={formatRupiah(data?.avg_cost_per_message || 0)}
            icon={<Wallet className="w-5 h-5" />}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-zinc-950">
            <h2 className="text-lg font-semibold">
              Top Sessions by Lowest Avg Chat Cost
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Session dengan rata-rata biaya per chat paling rendah
            </p>
          </div>

          <div className="p-6 space-y-3">
            {data?.top_sessions
              ?.sort(
                (a, b) =>
                  (a.messageCount ? a.cost / a.messageCount : 0) -
                  (b.messageCount ? b.cost / b.messageCount : 0),
              )
              .map((s, i) => (
                <div
                  key={s.session_id}
                  className="rounded-2xl border border-white/10 bg-zinc-950 p-4 flex flex-col gap-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400">#{i + 1}</p>
                      <p className="font-medium text-white">
                        {s.session_id.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="text-sm text-gray-300">
                      <p>{s.messageCount} messages</p>
                    </div>

                    <div className="text-sm text-gray-300">
                      <p>{formatRupiah(s.cost)}</p>
                    </div>

                    <div className="text-sm text-gray-300">
                      <p>
                        {formatRupiah(
                          s.messageCount ? s.cost / s.messageCount : 0,
                        )}
                        <span className="text-gray-500 ml-1">/ msg</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400 border-t border-white/5 pt-3">
                    <Calendar className="w-4 h-4" />
                    <span>Last chat: {formatDate(s.last_chat_date)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: any;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{title}</p>
        <div className="w-9 h-9 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-gray-300">
          {icon}
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white break-words">{value}</h2>
    </div>
  );
}
