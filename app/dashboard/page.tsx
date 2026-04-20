"use client";

import { useEffect, useState } from "react";

type Analytics = {
  total_sessions: number;
  total_messages: number;
  total_cost: number;
  avg_cost_per_session: number;
  avg_cost_per_message: number;
  top_sessions: { session_id: string; cost: number; messageCount: number }[];
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

  console.log(data);
  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-700">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Analytics Dashboard</h1>

      {/* 🔥 KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card title="Total Sessions" value={data?.total_sessions} />
        <Card title="Total Messages" value={data?.total_messages} />
        <Card title="Total Cost" value={formatRupiah(data?.total_cost || 0)} />
        <Card
          title="Avg / Session"
          value={formatRupiah(data?.avg_cost_per_session || 0)}
        />
        <Card
          title="Avg / Message"
          value={formatRupiah(data?.avg_cost_per_message || 0)}
        />
      </div>

      {/* 🔥 TOP SESSIONS */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-slate-700 mb-3">
          Top Sessions (Cost)
        </h2>

        <div className="flex flex-col gap-2">
          {data?.top_sessions.map((s, i) => (
            <div
              key={s.session_id}
              className="flex justify-between text-sm border-b pb-1"
            >
              <span className="text-gray-600">
                #{i + 1} — {s.session_id.slice(0, 8)}...
              </span>
              <span className="font-medium text-slate-500">
                {formatRupiah(s.cost)}
              </span>
              <span className="font-medium text-slate-500">
                ({s.messageCount})
              </span>
              <span className="font-medium text-slate-500">
                ({(s.cost / s.messageCount).toFixed(2)})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <p className="text-sm text-slate-700">{title}</p>
      <h2 className="text-lg text-slate-500 font-semibold mt-1">{value}</h2>
    </div>
  );
}
