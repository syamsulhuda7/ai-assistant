"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Activity,
  Wallet,
  MessageCircle,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type TopSession = {
  session_id: string;
  cost: number;
  messageCount: number;
  last_chat_date?: string | null;
};

type DailyAvgCost = {
  date: string;
  avg_cost: number;
};

type Analytics = {
  total_sessions: number;
  total_messages: number;
  total_cost: number;
  avg_cost_per_session: number;
  avg_cost_per_message: number;
  daily_avg_cost: DailyAvgCost[];
  top_sessions: TopSession[];
};

export default function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();

        console.log("FULL ANALYTICS RESPONSE:", json);
        console.log("RAW DAILY AVG COST:", json?.daily_avg_cost);

        if (json?.daily_avg_cost?.length) {
          console.table(json.daily_avg_cost);
        } else {
          console.warn("daily_avg_cost kosong / tidak ditemukan");
        }

        setData(json);
      } catch (error) {
        console.error("Failed fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatRupiah = (num: number) =>
    `Rp ${Number(num || 0).toLocaleString("id-ID")}`;

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

  const formatShortDate = (date: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  };

  /**
   * SORT TOP SESSION
   * berdasarkan avg cost per message terendah
   */
  const sortedTopSessions = useMemo(() => {
    if (!data?.top_sessions) return [];

    return [...data.top_sessions].sort((a, b) => {
      const avgA = a.messageCount ? a.cost / a.messageCount : 0;
      const avgB = b.messageCount ? b.cost / b.messageCount : 0;

      return avgA - avgB;
    });
  }, [data]);

  /**
   * CHART DATA
   * ambil semua rata-rata cost per tanggal
   */
  const chartData = useMemo(() => {
    if (!data?.daily_avg_cost?.length) return [];

    const cleanedData = data.daily_avg_cost
      .filter(
        (item) =>
          item &&
          item.date &&
          item.avg_cost !== null &&
          item.avg_cost !== undefined,
      )
      .map((item) => ({
        date: item.date,
        avg_cost: Number(item.avg_cost || 0),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log("FINAL CHART DATA:", cleanedData);
    console.table(cleanedData);

    return cleanedData;
  }, [data]);

  if (loading) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex justify-start mb-6">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Halaman Chat
            </a>
          </div>

          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm text-gray-300">TokoKita Analytics</span>
            </div>

            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              Analytics Dashboard
            </h1>

            <p className="mx-auto max-w-xl text-gray-400">
              Monitoring performa AI Customer Support, session usage, dan biaya
              token secara real-time.
            </p>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-5">
          <Card
            title="Total Sessions"
            value={data?.total_sessions || 0}
            icon={<Activity className="w-5 h-5" />}
          />

          <Card
            title="Total Messages"
            value={data?.total_messages || 0}
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

        {/* LINE CHART */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
          <div className="border-b border-white/10 bg-zinc-950 p-6">
            <h2 className="text-lg font-semibold text-white">
              Average Cost Trend by Date
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Grafik rata-rata cost semua sesi berdasarkan tanggal
            </p>
          </div>

          <div className="p-6">
            {chartData.length === 0 ? (
              <div className="flex h-[360px] items-center justify-center rounded-2xl border border-white/10 bg-zinc-950 text-sm text-gray-400">
                Data chart belum tersedia
              </div>
            ) : (
              <div className="h-[380px] rounded-2xl border border-white/5 bg-zinc-950 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 10,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      tickFormatter={(value) =>
                        new Date(String(value)).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      }
                    />

                    <Tooltip
                      cursor={{
                        stroke: "#52525b",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px",
                        padding: "12px 14px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                      }}
                      labelStyle={{
                        color: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 600,
                        marginBottom: "8px",
                      }}
                      itemStyle={{
                        color: "#d4d4d8",
                        fontSize: "13px",
                      }}
                      formatter={(value) => [
                        formatRupiah(Number(value || 0)),
                        "Average Cost",
                      ]}
                      labelFormatter={(label) =>
                        new Date(String(label)).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      }
                    />

                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      tickFormatter={(value) =>
                        `Rp ${Number(value).toLocaleString("id-ID")}`
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="avg_cost"
                      stroke="#ffffff"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        strokeWidth: 2,
                        fill: "#ffffff",
                        stroke: "#18181b",
                      }}
                      activeDot={{
                        r: 7,
                        fill: "#ffffff",
                        stroke: "#18181b",
                        strokeWidth: 3,
                      }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* TOP SESSION */}
        <section className="my-8 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
          <div className="border-b border-white/10 bg-zinc-950 p-6">
            <h2 className="text-lg font-semibold">
              Top Sessions by Lowest Avg Chat Cost
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Session dengan rata-rata biaya per chat paling rendah
            </p>
          </div>

          <div className="space-y-3 p-6">
            {sortedTopSessions.map((session, index) => {
              const avgCost = session.messageCount
                ? session.cost / session.messageCount
                : 0;

              return (
                <div
                  key={session.session_id}
                  className="rounded-2xl border border-white/10 bg-zinc-950 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-gray-400">#{index + 1}</p>

                      <p className="font-medium text-white">
                        {session.session_id.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="text-sm text-gray-300">
                      {session.messageCount} messages
                    </div>

                    <div className="text-sm text-gray-300">
                      {formatRupiah(session.cost)}
                    </div>

                    <div className="text-sm text-gray-300">
                      {formatRupiah(avgCost)}
                      <span className="ml-1 text-gray-500">/ msg</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Last chat: {formatDate(session.last_chat_date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-400">{title}</p>

        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-zinc-800 text-gray-300">
          {icon}
        </div>
      </div>

      <h2 className="break-words text-xl font-semibold text-white">{value}</h2>
    </div>
  );
}
