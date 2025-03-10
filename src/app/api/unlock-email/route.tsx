import {NextResponse} from "next/server";

export async function POST(req: Request) {
  const {id} = await req.json();

  const url = `https://api.apollo.io/api/v1/people/match?id=${id}&reveal_personal_emails=true&reveal_phone_number=false`;
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_APOLLO_API_KEY || "",
    },
  };

  const response = await fetch(url, options);
  const data = await response.json();

  return NextResponse.json(data);
}
