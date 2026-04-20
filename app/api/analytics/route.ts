import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 🔥 total sessions
    const { count: totalSessions } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true });

    // 🔥 total messages
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "ai");

    // 🔥 ambil semua cost
    const { data: messages } = await supabase
      .from("messages")
      .select("session_id, total_cost")
      .eq("role", "ai");

    let totalCost = 0;
    const sessionMap: Record<string, { cost: number; messageCount: number }> =
      {};

    messages?.forEach((m) => {
      const cost = m.total_cost || 0;

      totalCost += cost;

      if (!sessionMap[m.session_id]) {
        sessionMap[m.session_id] = { cost: 0, messageCount: 0 };
      }

      sessionMap[m.session_id].cost += cost;
      sessionMap[m.session_id].messageCount += 1;
    });

    // 🔥 top sessions
    const topSessions = Object.entries(sessionMap)
      .map(([session_id, data]) => ({
        session_id,
        cost: data.cost,
        messageCount: data.messageCount,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // 🔥 averages
    const avgCostPerSession = totalSessions ? totalCost / totalSessions : 0;

    const avgCostPerMessage = totalMessages ? totalCost / totalMessages : 0;

    return Response.json({
      total_sessions: totalSessions || 0,
      total_messages: totalMessages || 0,
      total_cost: totalCost,
      avg_cost_per_session: avgCostPerSession,
      avg_cost_per_message: avgCostPerMessage,
      top_sessions: topSessions,
    });
  } catch (error) {
    console.error(error);

    return Response.json({
      error: "Failed to fetch analytics",
    });
  }
}
