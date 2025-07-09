import {NextResponse} from "next/server";

export async function POST(req: Request) {
  const {organizationName} = await req.json();

  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_APOLLO_API_KEY || "",
    },
  };
  const response = await fetch(
    `https://api.apollo.io/api/v1/mixed_companies/search?q_organization_name=${organizationName}`,
    options
  );
  const data = await response.json();

  return NextResponse.json(data);
}

export async function GET() {
  const organizationName = "(Re)vive";

  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_APOLLO_API_KEY || "",
    },
  };
  const response = await fetch(
    `https://api.apollo.io/api/v1/mixed_companies/search?q_organization_name=${organizationName}`,
    options
  );
  const data = await response.json();

  return NextResponse.json(data);
}
