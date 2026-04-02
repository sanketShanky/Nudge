import Groq from "groq-sdk";
import { ExtractionResult } from "../../types";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy", // Pass dummy to avoid throwing uninitialized errors when mocked
});

export async function extractActionItems(
  transcript: string,
  meetingDate: Date,
  attendees: { name: string; email: string }[]
): Promise<ExtractionResult> {
  // Check if we're in mock mode
  if (process.env.MOCK_AI === "true") {
    console.log("[MOCK_AI] Returning mocked action items instead of calling Groq API.");
    return {
      actionItems: [
        {
          title: "Follow up on open deliverable",
          assigneeName: undefined as string | undefined,
          assigneeEmail: undefined as string | undefined,
          dueDate: new Date(meetingDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "MEDIUM" as const,
          source: "We need to follow up on the open deliverable before the next sync.",
        },
        {
          title: "Review and approve draft",
          assigneeName: attendees[0]?.name ?? undefined,
          assigneeEmail: attendees[0]?.email ?? undefined,
          dueDate: new Date(meetingDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "HIGH",
          source: "Let's get the draft reviewed by end of week.",
        },
        {
          title: "Schedule follow-up session",
          assigneeName: undefined as string | undefined,
          assigneeEmail: undefined as string | undefined,
          dueDate: undefined as string | undefined,
          priority: "LOW" as const,
          source: "We should schedule a follow-up once we have more clarity.",
        },
      ],
      summary:
        "The team aligned on next steps and assigned key deliverables. Follow-ups were identified and owners agreed on timelines. A review checkpoint was planned before the next session.",
      meetingTitle: "Team Sync",
      estimatedDuration: undefined as number | undefined,
    };
  }

  const attendeeContext =
    attendees.length > 0
      ? `Known attendees:\n${attendees.map((a) => `- ${a.name} (${a.email})`).join("\n")}`
      : "No attendee list provided.";

  const prompt = `You are an expert meeting analyst. Analyze the following meeting transcript and extract all action items, commitments, and tasks that were agreed upon.

${attendeeContext}

Meeting date: ${meetingDate.toISOString()}

TRANSCRIPT:
---
${transcript}
---

Your task:
1. Extract every action item, task, commitment, or follow-up mentioned
2. Identify who is responsible for each item (match to the attendees list above if possible; use exact name and email from the attendees list)
3. Identify any deadlines mentioned (explicit like "by Friday" or implicit like "before the next meeting")
4. Assess the priority based on urgency language in the transcript
5. Write a 3-5 sentence summary of the entire meeting
6. Suggest a concise meeting title if one is not already obvious from the transcript

Rules for extraction:
- Only extract genuine commitments and action items, not general discussion points
- If someone says "we should" without a clear owner, set assigneeName and assigneeEmail to null
- For relative dates ("by end of week", "next Monday"), calculate the actual date relative to the meeting date provided above
- The "source" field must be a direct, exact quote from the transcript that contains or implies this action item
- Priority rules: URGENT = described as critical, blocking, or an emergency; HIGH = has a specific near-term deadline or was strongly emphasized; MEDIUM = standard task with a reasonable timeline; LOW = described as "nice to have", "eventually", or without urgency
- Do not invent information; if a field cannot be determined from the transcript, set it to null

Respond ONLY with valid JSON matching this exact structure, with no other text before or after:
{
  "actionItems": [
    {
      "title": "Short action item title (max 80 chars)",
      "description": "Additional detail if needed, or null",
      "assigneeName": "Person's full name as it appears in the transcript, or null",
      "assigneeEmail": "Matched email from the attendees list, or null",
      "dueDate": "ISO 8601 date string like 2024-03-28T00:00:00Z, or null",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "source": "Exact verbatim quote from the transcript"
    }
  ],
  "summary": "3-5 sentence meeting summary",
  "meetingTitle": "Suggested meeting title",
  "estimatedDuration": null
}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");

  // Strip markdown code fences if present (defensive, since we request json_object)
  const json = text.replace(/```json\n?|\n?```/g, "").trim();

  return JSON.parse(json) as ExtractionResult;
}
