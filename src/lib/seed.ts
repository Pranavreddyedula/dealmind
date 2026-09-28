/**
 * DealMind — demo seed data.
 *
 * Creates the headline Rahul Sharma demo (3 conversations, each retained into
 * Hindsight memory) plus a few more customers so the dashboard/analytics feel
 * real. Idempotent — re-running updates in place by email rather than duplicating.
 *
 * IMPORTANT: the retain() calls here go through the REAL Hindsight memory service
 * (Tier A/B/C auto-resolved), so the demo is never faked — the meeting-prep
 * recall step will genuinely retrieve whatever was retained here.
 */
import { db } from "@/lib/db";
import { retain, HindsightNotConfiguredError } from "@/lib/hindsight-service";

type SeedMessage = { role: string; content: string };
type SeedConversation = {
  title: string;
  channel: string;
  sentiment: string;
  summary: string;
  messages: SeedMessage[];
  /** facts to retain into Hindsight memory for this conversation */
  memories: { content: string; type: string; context: string; mentionedAt: Date }[];
};

type SeedCustomer = {
  name: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
  industry: string;
  city: string;
  status: string;
  dealValue: number;
  notes?: string;
  avatarHue: number;
  conversations: SeedConversation[];
  followUps?: { channel: string; message: string; status: string; daysFromNow: number }[];
};

const NOW = Date.now();
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000);

const CUSTOMERS: SeedCustomer[] = [
  {
    name: "Rahul Sharma",
    email: "rahul.sharma@northbridge.io",
    company: "Northbridge Analytics",
    title: "VP of Sales Operations",
    phone: "+91 98765 43210",
    industry: "B2B SaaS",
    city: "Bengaluru",
    status: "negotiation",
    dealValue: 84000,
    notes:
      "Enterprise deal, 40-seat rollout. Evaluating DealMind against two competitors. Decision expected in 3 weeks.",
    avatarHue: 160,
    conversations: [
      {
        title: "Discovery call — pricing concerns",
        channel: "call",
        sentiment: "negative",
        summary:
          "Rahul raised that the per-seat price feels high versus their current budget envelope.",
        messages: [
          {
            role: "salesperson",
            content:
              "Rahul, thanks for the time today. Walk me through where DealMind would sit in your stack.",
          },
          {
            role: "customer",
            content:
              "We like the vision, but honestly the product is too expensive for what we'd pay per seat right now. Our envelope is around $40/seat.",
          },
          {
            role: "salesperson",
            content:
              "Understood — let me model a few options. Can I come back with a phased rollout?",
          },
        ],
        memories: [
          {
            content:
              "Rahul Sharma said the product is too expensive and indicated the team's budget envelope is around $40 per seat.",
            type: "objection",
            context: "Discovery call — pricing concerns",
            mentionedAt: daysAgo(12),
          },
        ],
      },
      {
        title: "Follow-up — competitor evaluation",
        channel: "meeting",
        sentiment: "neutral",
        summary: "Rahul mentioned Competitor X is also being evaluated for the same use case.",
        messages: [
          {
            role: "salesperson",
            content:
              "Last time we spoke you were weighing a couple of vendors. Where are you in the evaluation?",
          },
          {
            role: "customer",
            content:
              "We're piloting Competitor X alongside DealMind. Competitor X has a cleaner UI but I'm not sure about their CRM integration depth.",
          },
        ],
        memories: [
          {
            content:
              "Rahul Sharma is evaluating Competitor X alongside DealMind; he finds Competitor X has a cleaner UI but doubts its CRM integration depth.",
            type: "competitor",
            context: "Follow-up — competitor evaluation",
            mentionedAt: daysAgo(7),
          },
        ],
      },
      {
        title: "Requirements deep-dive — CRM integration",
        channel: "meeting",
        sentiment: "positive",
        summary:
          "Rahul stated CRM integration is a hard requirement for the buying committee.",
        messages: [
          {
            role: "customer",
            content:
              "For us to move forward, CRM integration is important — it has to sync bidirectionally with Salesforce without us writing custom code.",
          },
          {
            role: "salesperson",
            content:
              "Bidirectional Salesforce sync is GA. I'll send the integration spec and a sandbox invite.",
          },
        ],
        memories: [
          {
            content:
              "Rahul Sharma said CRM integration is important and requires bidirectional Salesforce sync without custom code.",
            type: "requirement",
            context: "Requirements deep-dive — CRM integration",
            mentionedAt: daysAgo(2),
          },
        ],
      },
    ],
    followUps: [
      {
        channel: "email",
        message:
          "Hi Rahul — following up on Salesforce sync. Sandbox invite attached. Want to walk through it on Friday?",
        status: "pending",
        daysFromNow: -1,
      },
    ],
  },
  {
    name: "Priya Patel",
    email: "priya.patel@finnova.co",
    company: "Finnova Capital",
    title: "Head of Revenue Enablement",
    phone: "+1 (415) 555-0142",
    industry: "Financial Services",
    city: "San Francisco",
    status: "qualified",
    dealValue: 52000,
    notes: "Strong fit. Needs security review (SOC2).",
    avatarHue: 280,
    conversations: [
      {
        title: "Intro call",
        channel: "call",
        sentiment: "positive",
        summary: "Priya is evaluating sales-intelligence tools post Series B.",
        messages: [
          {
            role: "salesperson",
            content: "What's driving the eval now?",
          },
          {
            role: "customer",
            content:
              "We just closed Series B and need to professionalize the sales motion. Memory across AEs is the big gap.",
          },
        ],
        memories: [
          {
            content:
              "Priya Patel is driving the evaluation because Finnova just closed Series B and wants to professionalize the sales motion; cross-AE memory continuity is the main gap.",
            type: "fact",
            context: "Intro call",
            mentionedAt: daysAgo(5),
          },
        ],
      },
      {
        title: "Security review kickoff",
        channel: "meeting",
        sentiment: "neutral",
        summary: "Security team requires SOC2 Type II before procurement signs.",
        messages: [
          {
            role: "customer",
            content:
              "Our security team needs SOC2 Type II and a vendor risk assessment before procurement will sign.",
          },
        ],
        memories: [
          {
            content:
              "Priya Patel's security team requires SOC2 Type II and a vendor risk assessment before procurement signs.",
            type: "requirement",
            context: "Security review kickoff",
            mentionedAt: daysAgo(2),
          },
        ],
      },
    ],
    followUps: [
      {
        channel: "email",
        message: "Sending SOC2 report + DPA. Can we book the security deep-dive for next week?",
        status: "pending",
        daysFromNow: 2,
      },
    ],
  },
  {
    name: "Marcus Lee",
    email: "marcus.lee@orbitalrobotics.com",
    company: "Orbital Robotics",
    title: "Director of Sales",
    industry: "Hardware / Robotics",
    city: "Austin",
    status: "lead",
    dealValue: 30000,
    notes: "Inbound from webinar. Technical buyer.",
    avatarHue: 30,
    conversations: [
      {
        title: "Webinar follow-up",
        channel: "email",
        sentiment: "positive",
        summary: "Marcus attended the AI-in-sales webinar and wants a demo.",
        messages: [
          {
            role: "customer",
            content:
              "Great webinar. Curious whether DealMind can handle a technical sale with long evaluation cycles.",
          },
        ],
        memories: [
          {
            content:
              "Marcus Lee attended the AI-in-sales webinar and is evaluating DealMind for a technical sale with long evaluation cycles.",
            type: "fact",
            context: "Webinar follow-up",
            mentionedAt: daysAgo(3),
          },
        ],
      },
    ],
    followUps: [],
  },
  {
    name: "Sofia Alvarez",
    email: "sofia.alvarez@meridianhealth.com",
    company: "Meridian Health",
    title: "Chief Commercial Officer",
    industry: "Healthcare",
    city: "Miami",
    status: "customer",
    dealValue: 120000,
    notes: "Existing customer. Renewal + expansion in Q4.",
    avatarHue: 340,
    conversations: [
      {
        title: "QBR — renewal + expansion",
        channel: "meeting",
        sentiment: "positive",
        summary: "QBR went well; interested in adding the APAC team.",
        messages: [
          {
            role: "customer",
            content:
              "Renewal is a formality. We'd like to expand DealMind to the APAC sales team next quarter if pricing holds.",
          },
        ],
        memories: [
          {
            content:
              "Sofia Alvarez confirmed renewal and wants to expand DealMind to the APAC sales team next quarter contingent on pricing.",
            type: "fact",
            context: "QBR — renewal + expansion",
            mentionedAt: daysAgo(10),
          },
        ],
      },
    ],
    followUps: [
      {
        channel: "call",
        message: "Sending APAC expansion quote with blended pricing for review.",
        status: "sent",
        daysFromNow: -3,
      },
    ],
  },
];

export async function seedDatabase(opts: { clear?: boolean } = {}) {
  if (opts.clear) {
    await db.meetingBrief.deleteMany();
    await db.followUp.deleteMany();
    await db.message.deleteMany();
    await db.memory.deleteMany();
    await db.conversation.deleteMany();
    await db.customer.deleteMany();
    await db.agentLog.deleteMany();
  }

  const created: { customer: string; conversations: number; memories: number }[] = [];

  for (const c of CUSTOMERS) {
    const customer = await db.customer.upsert({
      where: { email: c.email },
      create: {
        name: c.name,
        email: c.email,
        company: c.company,
        title: c.title,
        phone: c.phone,
        industry: c.industry,
        city: c.city,
        status: c.status,
        dealValue: c.dealValue,
        notes: c.notes,
        avatarHue: c.avatarHue,
      },
      update: {
        name: c.name,
        company: c.company,
        title: c.title,
        phone: c.phone,
        industry: c.industry,
        city: c.city,
        status: c.status,
        dealValue: c.dealValue,
        notes: c.notes,
        avatarHue: c.avatarHue,
      },
    });

    // Wipe + recreate this customer's conversations/memories/followups so re-seed is clean.
    await db.followUp.deleteMany({ where: { customerId: customer.id } });
    await db.memory.deleteMany({ where: { customerId: customer.id } });
    await db.message.deleteMany({
      where: { conversation: { customerId: customer.id } },
    });
    await db.conversation.deleteMany({ where: { customerId: customer.id } });

    let memCount = 0;
    let memoriesRetained = true;
    for (const conv of c.conversations) {
      const createdConv = await db.conversation.create({
        data: {
          customerId: customer.id,
          title: conv.title,
          channel: conv.channel,
          sentiment: conv.sentiment,
          summary: conv.summary,
          createdAt: conv.messages.length
            ? // spread conversations across the last ~2 weeks
              new Date(
                Date.now() -
                  Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000,
              )
            : new Date(),
        },
      });
      for (const m of conv.messages) {
        await db.message.create({
          data: {
            conversationId: createdConv.id,
            role: m.role,
            content: m.content,
          },
        });
      }
      for (const mem of conv.memories) {
        try {
          await retain(customer.id, mem.content, {
            context: mem.context,
            type: mem.type,
            mentionedAt: mem.mentionedAt,
          });
          memCount++;
        } catch (e) {
          if (e instanceof HindsightNotConfiguredError) {
            memoriesRetained = false;
          } else {
            throw e;
          }
        }
      }
    }
    void memCount;
    void memoriesRetained;

    for (const fu of c.followUps ?? []) {
      await db.followUp.create({
        data: {
          customerId: customer.id,
          channel: fu.channel,
          message: fu.message,
          status: fu.status,
          dueAt: new Date(Date.now() + fu.daysFromNow * 24 * 60 * 60 * 1000),
        },
      });
    }

    created.push({
      customer: c.name,
      conversations: c.conversations.length,
      memories: memCount,
    });
  }

  return {
    customers: created.length,
    totalConversations: created.reduce((a, c) => a + c.conversations, 0),
    totalMemories: created.reduce((a, c) => a + c.memories, 0),
    detail: created,
  };
}
