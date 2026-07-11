export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAiAccess } from "@/lib/ai-guard";
import { generateAIResponse } from "@/lib/ai";
import { logUsage } from "@/lib/database";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { awardXp, checkAndUnlockAchievements, XP_VALUES } from "@/lib/goals-db";
import {
  analyzeAttachmentsWithGemini,
  searchWithTavily,
  type UploadedAttachment,
} from "@/lib/ai-tools";

interface ResourceLink {
  title: string;
  url: string;
  source: string;
}

function buildTopicFromMessage(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New Chat";
  return cleaned.length > 60 ? `${cleaned.slice(0, 60)}...` : cleaned;
}

function formatReplyWithSources(reply: string, sources: ResourceLink[]) {
  if (!sources.length) return reply;

  const linksBlock = [
    "",
    "---",
    "",
    "### Useful Resources",
    "",
    ...sources.map(
      (item, index) =>
        `${index + 1}. [${item.title}](${item.url}) — ${item.source}`,
    ),
  ].join("\n");

  return `${reply}\n${linksBlock}`;
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAiAccess();
    if (guard.error) return guard.error;
    const { user } = guard;

    const body = await req.json();
    const message = body.message;
    const sessionId = body.sessionId as string | undefined;
    const mode = body.mode === "web_search" ? "web_search" : "chat";
    const attachments = Array.isArray(body.attachments)
      ? (body.attachments as UploadedAttachment[])
      : [];

    if (
      (!message ||
        typeof message !== "string" ||
        message.trim().length === 0) &&
      attachments.length === 0
    ) {
      return NextResponse.json(
        { error: "Message or file attachment is required" },
        { status: 400 },
      );
    }

    if (typeof message === "string" && message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 },
      );
    }

    const cleanMessage = typeof message === "string" ? message.trim() : "";

    let sources: ResourceLink[] = [];
    let webContext = "";

    if (mode === "web_search" && cleanMessage) {
      const searchResults = await searchWithTavily(cleanMessage);
      sources = searchResults.map((item) => ({
        title: item.title,
        url: item.url,
        source: item.source,
      }));
      webContext = searchResults
        .map(
          (item, index) =>
            `${index + 1}. ${item.title}\nURL: ${item.url}\nSummary: ${item.content || "No summary available."}`,
        )
        .join("\n\n");
    }

    const aiResponse = attachments.length
      ? await analyzeAttachmentsWithGemini({
          message:
            cleanMessage ||
            "Please review the uploaded file and help me understand it.",
          attachments,
          webContext,
        })
      : await generateAIResponse(
          cleanMessage || "Please help me with the uploaded study material.",
          {
            mode,
            webContext,
          },
        );

    const finalReply = formatReplyWithSources(aiResponse, sources);

    let savedSessionId: string | null = null;

    {
      const admin = await getSupabaseAdmin();
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const topic = buildTopicFromMessage(
          cleanMessage || attachments[0]?.name || "New Chat",
        );
        const { data: newSession, error: sessionError } = await admin
          .from("chat_sessions")
          .insert({
            user_id: user.id,
            title: topic,
            topic,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (sessionError) {
          throw new Error(
            `Failed to create chat session: ${sessionError.message}`,
          );
        }

        currentSessionId = newSession.id;
      }

      const userContent =
        cleanMessage ||
        `Uploaded files: ${attachments.map((file) => file.name).join(", ")}`;

      const now = new Date().toISOString();

      const [userMsgResult, assistantMsgResult, sessionUpdateResult] =
        await Promise.all([
          admin.from("chat_messages").insert({
            session_id: currentSessionId,
            user_id: user.id,
            role: "user",
            content: userContent,
            created_at: now,
          }),
          admin.from("chat_messages").insert({
            session_id: currentSessionId,
            user_id: user.id,
            role: "assistant",
            content: finalReply,
            created_at: now,
          }),
          admin
            .from("chat_sessions")
            .update({
              last_message_at: now,
              updated_at: now,
            })
            .eq("id", currentSessionId)
            .eq("user_id", user.id),
        ]);

      if (userMsgResult.error) {
        throw new Error(
          `Failed to save user message: ${userMsgResult.error.message}`,
        );
      }
      if (assistantMsgResult.error) {
        throw new Error(
          `Failed to save assistant message: ${assistantMsgResult.error.message}`,
        );
      }
      if (sessionUpdateResult.error) {
        throw new Error(
          `Failed to update session: ${sessionUpdateResult.error.message}`,
        );
      }

      savedSessionId = currentSessionId ?? null;

      logUsage(
        user.id,
        attachments.length
          ? "ai_file_analysis"
          : mode === "web_search"
            ? "ai_web_search"
            : "ai_chat",
        "question_asked",
        {
          topic: buildTopicFromMessage(
            cleanMessage || attachments[0]?.name || "New Chat",
          ),
          sessionId: currentSessionId,
          messageLength: cleanMessage.length,
          attachmentCount: attachments.length,
        },
      ).catch((err) => {
        console.error("[ai/chat] Failed to log usage metrics:", err);
      });

      // Award XP for AI Chat and trigger achievements sweep
      awardXp(user.id, XP_VALUES.ai_chat).catch((err) => {
        console.error("[ai/chat] Failed to award XP:", err);
      });
      checkAndUnlockAchievements(user.id).catch((err) => {
        console.error("[ai/chat] Failed to check achievements:", err);
      });
    }

    return NextResponse.json({
      success: true,
      reply: finalReply,
      sources,
      sessionId: savedSessionId,
    });
  } catch (err) {
    console.error("[ai/chat] Error:", err);
    const msg = err instanceof Error ? err.message : "AI service unavailable";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
