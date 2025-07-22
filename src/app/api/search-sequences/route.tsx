import {NextResponse} from "next/server";

export async function GET() {
  // const url = `https://api.apollo.io/api/v1/sequences/search?query=sales`;
  const url = "https://api.apollo.io/api/v1/emailer_campaigns/search";
  const options = {
    method: "GET",
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
