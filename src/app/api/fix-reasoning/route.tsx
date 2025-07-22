import OpenAI from "openai";
import {NextResponse} from "next/server";

export async function POST(req: Request) {
  const {explanation, desired_fit, new_explanation_info} = await req.json();

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    messages: [
      {
        role: "user",
        content: `Your are to help reword this explanation that explains why this company is a good fit for my marketing agency.
    The explanation is:
    ${explanation}
    the reworded explanation should explain why the company is a ${desired_fit} fit
    The reworded explanation be based on the following reasons:
    ${new_explanation_info}
    ## Important: 
    -only return the reworded explanation, nothing else.
    -don't use any specific name for the company, just use the name provided in the explanation.
    - the reworded explanation should be based on the new explanation reasons only don't infer anything else.
    `,
      },
    ],
  });

  return NextResponse.json({
    response: completion.choices[0].message.content,
  });
}

export async function GET() {
  // const {explanation, desired_fit, rewrittenExplanation} = await req.json();

  const explanation =
    "The company's focus on data security and privileged access suggests that their target customers are likely security-conscious and value informative content related to cybersecurity best practices and solutions. These customers are often receptive to engaging content distributed through relevant channels.";
  const desired_fit = "bad";
  const rewrittenExplanation =
    "The company is focuses on enterprise security and privileged access.";

  // prompt

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    messages: [
      {
        role: "user",
        content: `Your are to help reword this explanation.
      The explanation is:
      ${explanation}
      the reworded explanation should explain why the company is a ${desired_fit} fit
      The reworded explanation be based on the following reasons:
      ${rewrittenExplanation}`,
      },
    ],
  });

  return NextResponse.json({
    response: completion.choices[0].message.content,
  });
}
