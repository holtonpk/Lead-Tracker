import {NextResponse} from "next/server";
import {Pinecone} from "@pinecone-database/pinecone";
import OpenAI from "openai";

const pc = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY || "",
});
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const {id, company_name, text} = await req.json();

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  const embedding = embeddingResponse.data[0].embedding;

  const index = pc.index("lead-qualification");

  await index.namespace("v1").upsert([
    {
      id,
      values: embedding,
      metadata: {
        company_name: company_name,
        text: text,
      },
    },
  ]);

  return NextResponse.json({
    message: "Embedding added successfully",
  });
}

export async function GET() {
  const company_name = "test";
  const text = "test";

  // Initialize OpenAI client

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  const embedding = embeddingResponse.data[0].embedding;

  const index = pc.index("lead-qualification");

  await index.namespace("v1").upsert([
    {
      id: "vec1",
      values: embedding,
      metadata: {
        company_name: company_name,
        text: text,
      },
    },
  ]);
  return NextResponse.json({
    message: "Embedding added successfully",
  });
}
