import {NextApiRequest, NextApiResponse} from "next";
import {NextResponse} from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

type AiChatMessage = {
  id: number;
  content: string;
  sender: string;
};

export async function POST(req: Request) {
  try {
    const {messages} = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        {response: "Invalid request format."},
        {status: 400}
      );
    }

    // Properly type the messages
    const formattedMessages: any[] = messages.map(
      (msg: {sender: string; content: string}) => ({
        role:
          msg.sender === "user"
            ? "user"
            : msg.sender === "ai"
            ? "assistant"
            : "system", // Ensuring only valid roles are passed
        content: msg.content,
      })
    );

    // Add system message at the beginning
    formattedMessages.unshift({
      role: "system",
      content:
        "You are to help create outreach messages. Respond with only the outreach message.",
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
    });

    return NextResponse.json({
      response: completion.choices[0]?.message?.content || "AI response error.",
    });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      {response: "AI is not working right now. Please try again later."},
      {status: 500}
    );
  }
}

export async function GET(req: Request) {
  try {
    const messages = dummyMess;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        {response: "Invalid request format."},
        {status: 400}
      );
    }

    // Properly type the messages
    const formattedMessages: any[] = messages.map(
      (msg: {sender: string; content: string}) => ({
        role:
          msg.sender === "user"
            ? "user"
            : msg.sender === "ai"
            ? "assistant"
            : "system", // Ensuring only valid roles are passed
        content: msg.content,
      })
    );

    // Add system message at the beginning
    formattedMessages.unshift({
      role: "system",
      content:
        "You are to help create outreach messages. Respond with only the outreach message.",
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
    });

    return NextResponse.json({
      response: completion.choices[0]?.message?.content || "AI response error.",
    });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      {response: "AI is not working right now. Please try again later."},
      {status: 500}
    );
  }
}
const dummyM1 =
  "This message will be sent to Colton Taylor, who is the Marketing manager at SchoolAi. My name is Patrick I'm a co founder of Ripple Media. Here are some key notes on how I can assist their company: **Not a great social presence but huge on linkedIn**. Please incorporate these insights into the message. Additionally, use the tone and structure of my past outreach messages as a reference. Here are previous messages I've sent: **I can help your socials grow I see SchoolAI has been investing in organic content—love the approach. My team's helped similar brands crack the formula for real engagement and social growth, and I’d love to show you how. If you're open to a quick call, I’ll put together a custom one-month content strategy tailored for SchoolAI to reach teachers. Worth a chat?**. Generate a professional and engaging message that aligns with my previous communication style while emphasizing the value I can bring to SchoolAi.";

const dummyAi =
  "Hi Colton,\n\nI noticed that SchoolAi has a strong presence on LinkedIn—great work! At Ripple Media, we specialize in amplifying your reach across other social platforms. We've helped similar brands build an engaging social presence and see real growth. I'd love to share some strategies that could elevate SchoolAi's visibility and engagement beyond LinkedIn.\n\nIf you're interested, let's hop on a quick call. I'll create a complimentary one-month content strategy tailored just for SchoolAi, focusing on connecting with educators. Looking forward to discussing how we can enhance your social footprint.\n\nBest,\nPatrick";

const dummyMess = [
  {
    id: 1,
    content: dummyM1,
    sender: "user",
  },
  {
    id: 2,
    content: dummyAi,
    sender: "ai",
  },
  {
    id: 2,
    content: "make it shorter",
    sender: "user",
  },
];
