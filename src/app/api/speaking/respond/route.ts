import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";

const RespondSchema = z.object({
  scenarioTitle: z.string().default("General Speaking"),
  packageTitle: z.string().optional(),
  moduleLabel: z.string().optional(),
  recommendedVocab: z.array(z.string()).optional(),
  recentHistory: z
    .array(
      z.object({
        sender: z.enum(["ai", "user"]),
        text: z.string(),
      })
    )
    .optional(),
  userMessage: z.string().min(1),
  trainerPersona: z.enum(["rudy", "sarah"]).default("rudy"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RespondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const {
      scenarioTitle,
      packageTitle,
      moduleLabel,
      recommendedVocab,
      recentHistory,
      userMessage,
      trainerPersona,
    } = parsed.data;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: null });
    }

    const trainerName = trainerPersona === "sarah" ? "Coach Sarah" : "Coach Rudy";
    const historyBlock =
      recentHistory && recentHistory.length > 0
        ? recentHistory
            .slice(-4)
            .map((m) => `${m.sender === "ai" ? trainerName : "Student"}: "${m.text}"`)
            .join("\n")
        : "";

    const vocabLine =
      recommendedVocab && recommendedVocab.length > 0
        ? `Target key phrases for this lesson: ${recommendedVocab.join(", ")}.`
        : "";

    const prompt = `You are ${trainerName}, a warm, sharp, and encouraging English Speaking Coach at "English Ready".
Active Course Package: "${packageTitle || "English Ready Program"}"${moduleLabel ? ` (${moduleLabel})` : ""}.
Active Lesson Scenario: "${scenarioTitle}".
${vocabLine}
${historyBlock ? `\nRecent dialogue:\n${historyBlock}` : ""}
The student just responded: "${userMessage}".

Reply out loud in 1 to 2 crisp, natural spoken English sentences:
- Briefly acknowledge something specific the student actually said (warm, realistic, never generic).
- Ask one relevant, syllabus-aligned follow-up question that stays strictly inside this package's topic and gently encourages them to speak further.
No markdown, no bullet points, no quotation marks around the whole response. Keep it under 38 words so it sounds natural when read aloud.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const models = ["gemini-3.1-flash-lite", "gemini-flash-latest"];
    let replyText = "";

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 110,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw && typeof raw === "string") {
            replyText = raw.trim().replace(/^["']|["']$/g, "");
            break;
          }
        }
      } catch (e) {
        console.warn(`[Gemini respond model ${model} error]:`, e);
      }
    }

    clearTimeout(timeoutId);

    return NextResponse.json({
      success: true,
      reply: replyText || null,
    });
  } catch (err) {
    console.error("[Speaking Respond API error]:", err);
    return NextResponse.json({ reply: null });
  }
}
