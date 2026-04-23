import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // ==================================================
    // TOTAL SESSIONS
    // ==================================================
    const { count: totalSessions } = await supabase
      .from("sessions")
      .select("*", {
        count: "exact",
        head: true,
      });

    // ==================================================
    // TOTAL AI MESSAGES
    // ==================================================
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("role", "ai");

    // ==================================================
    // GET ALL AI MESSAGES
    // ==================================================
    const { data: messages, error } = await supabase
      .from("messages")
      .select("session_id, total_cost, created_at")
      .eq("role", "ai")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    let totalCost = 0;

    // ==================================================
    // SESSION MAP
    // ==================================================
    const sessionMap: Record<
      string,
      {
        cost: number;
        messageCount: number;
        lastChatDate: string | null;
        averageCost: number;
      }
    > = {};

    messages?.forEach((message) => {
      const cost = Number(message.total_cost || 0);
      const createdAt = message.created_at || null;
      const sessionId = message.session_id;

      totalCost += cost;

      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = {
          cost: 0,
          messageCount: 0,
          lastChatDate: createdAt,
          averageCost: 0,
        };
      }

      // total cost per session
      sessionMap[sessionId].cost += cost;

      // total AI message per session
      sessionMap[sessionId].messageCount += 1;

      // hitung average cost = total cost / total message
      sessionMap[sessionId].averageCost =
        sessionMap[sessionId].messageCount > 0
          ? Number(
              (
                sessionMap[sessionId].cost / sessionMap[sessionId].messageCount
              ).toFixed(2),
            )
          : 0;

      // ambil last chat date terbaru
      if (
        createdAt &&
        (!sessionMap[sessionId].lastChatDate ||
          new Date(createdAt) >
            new Date(sessionMap[sessionId].lastChatDate as string))
      ) {
        sessionMap[sessionId].lastChatDate = createdAt;
      }
    });

    // ==================================================
    // TOP SESSIONS
    // ==================================================
    // console.log(sessionMap);
    const topSessions = Object.entries(sessionMap)
      .map(([session_id, value]) => ({
        session_id,
        cost: Number(value.cost.toFixed(2)),
        messageCount: value.messageCount,
        last_chat_date: value.lastChatDate,
        averageCost: value.averageCost,
      }))
      .sort((a, b) => a.averageCost - b.averageCost)
      .slice(0, 5);

    // ==================================================
    // AVERAGE COST PER SESSION FOR CHART
    // Penanda waktu = last_chat_date
    // ==================================================
    const sessionAverageCostTrend = Object.entries(sessionMap)
      .map(([session_id, value]) => ({
        session_id,
        date: value.lastChatDate,
        avg_cost:
          value.messageCount > 0
            ? Number((value.cost / value.messageCount).toFixed(2))
            : 0,
      }))
      .filter((item) => item.date) // pastikan ada tanggal
      .sort(
        (a, b) =>
          new Date(a.date as string).getTime() -
          new Date(b.date as string).getTime(),
      );

    // ==================================================
    // OVERALL AVERAGES
    // ==================================================
    const avgCostPerSession =
      totalSessions && totalSessions > 0
        ? Number((totalCost / totalSessions).toFixed(2))
        : 0;

    const avgCostPerMessage =
      totalMessages && totalMessages > 0
        ? Number((totalCost / totalMessages).toFixed(2))
        : 0;

    // ==================================================
    // DEBUG
    // ==================================================
    console.log("session_average_cost_trend:", sessionAverageCostTrend);

    // ==================================================
    // RESPONSE
    // ==================================================
    return Response.json({
      total_sessions: totalSessions || 0,
      total_messages: totalMessages || 0,
      total_cost: Number(totalCost.toFixed(2)),
      avg_cost_per_session: avgCostPerSession,
      avg_cost_per_message: avgCostPerMessage,
      top_sessions: topSessions,

      // ini yang dipakai untuk line chart
      daily_avg_cost: sessionAverageCostTrend,
    });
  } catch (error) {
    console.error("Analytics Error:", error);

    return Response.json(
      {
        error: "Failed to fetch analytics",
      },
      {
        status: 500,
      },
    );
  }
}
