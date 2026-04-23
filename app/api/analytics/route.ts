import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // total sessions
    const { count: totalSessions } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true });

    // total AI messages
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "ai");

    // ambil cost + tanggal chat
    const { data: messages } = await supabase
      .from("messages")
      .select("session_id, total_cost, created_at")
      .eq("role", "ai")
      .order("created_at", { ascending: false });

    let totalCost = 0;

    const sessionMap: Record<
      string,
      {
        cost: number;
        messageCount: number;
        lastChatDate: string | null;
      }
    > = {};

    messages?.forEach((m) => {
      const cost = Number(m.total_cost || 0);
      const chatDate = m.created_at || null;

      totalCost += cost;

      if (!sessionMap[m.session_id]) {
        sessionMap[m.session_id] = {
          cost: 0,
          messageCount: 0,
          lastChatDate: chatDate,
        };
      }

      sessionMap[m.session_id].cost += cost;
      sessionMap[m.session_id].messageCount += 1;

      // simpan tanggal chat terbaru
      if (
        chatDate &&
        (!sessionMap[m.session_id].lastChatDate ||
          new Date(chatDate) >
            new Date(sessionMap[m.session_id].lastChatDate as string))
      ) {
        sessionMap[m.session_id].lastChatDate = chatDate;
      }
    });

    // top sessions by cost
    const topSessions = Object.entries(sessionMap)
      .map(([session_id, data]) => ({
        session_id,
        cost: data.cost,
        messageCount: data.messageCount,
        last_chat_date: data.lastChatDate,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // averages
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
