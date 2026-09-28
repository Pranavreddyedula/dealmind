/**
 * DealMind — personalized follow-up generation, grounded in Hindsight memory.
 */
import { recall } from "@/lib/hindsight-service";
import { generateText } from "@/lib/llm-service";
import { db } from "@/lib/db";

export interface FollowUpInput {
  customerId: string;
  conversationId?: string;
  channel: string;
  tone: string;
}

export interface FollowUpResult {
  message: string;
  mode: string;
  memoriesUsed: { id: string; text: string; type?: string | null }[];
}

export async function generateFollowUp(
  input: FollowUpInput,
): Promise<FollowUpResult> {
  const customer = await db.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customer) throw new Error("customer not found");

  const conversation = input.conversationId
    ? await db.conversation.findUnique({
        where: { id: input.conversationId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      })
    : null;

  const { results, mode } = await recall(
    input.customerId,
    `follow up with ${customer.name} about next steps and open items`,
    { budget: "mid", limit: 8 },
  );

  const memoryBlock = results
    .map((r) => `- ${r.text}`)
    .join("\n");
  const transcript = conversation
    ? conversation.messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n")
    : "(no transcript selected)";

  const llm = await generateText(
    [
      {
        role: "system",
        content:
          "You are DealMind. Write a concise, personalized follow-up message for a sales rep to send to a customer. Use the customer's persistent memory + recent conversation transcript. Reference specifics (a stated objection, requirement, or competitor) so it does not sound generic. Keep it to ~120-160 words. Output only the message body (no subject line unless channel=email, in which case prepend a subject line).",
      },
      {
        role: "user",
        content: `Customer: ${customer.name} (${customer.title ?? "n/a"}, ${customer.company ?? "n/a"})
Channel: ${input.channel}
Tone: ${input.tone}

PERSISTENT MEMORY:
${memoryBlock || "(none)"}

LAST CONVERSATION TRANSCRIPT:
${transcript}

Write the follow-up.`,
      },
    ],
    { temperature: 0.5, maxTokens: 500 },
  );

  return {
    message: llm.text.trim(),
    mode,
    memoriesUsed: results.map((r) => ({
      id: r.id,
      text: r.text,
      type: r.type ?? null,
    })),
  };
}
