import {NextRequest, NextResponse} from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {leadName, leadWebsite} = await request.json();
    const url = `https://api.apollo.io/api/v1/accounts?name=${leadName}&domain=${leadWebsite}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_APOLLO_API_KEY || "",
      },
    });

    // Log status and response text for debugging
    const text = await response.text();
    let res;
    try {
      res = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Apollo API response as JSON:", text);
      return NextResponse.json(
        {error: "Invalid response from Apollo API", details: text},
        {status: 502}
      );
    }

    if (!response.ok || !res.account || !res.account.id) {
      console.error("Apollo API error or missing account:", res);
      return NextResponse.json(
        {error: "Apollo API error", details: res},
        {status: 502}
      );
    }

    return NextResponse.json({id: res.account.id});
  } catch (error) {
    console.error("Error in create-account API:", error);
    return NextResponse.json(
      {error: "Internal server error", details: error?.toString()},
      {status: 500}
    );
  }
}

// export async function GET() {
//   const lead = {
//     name: "AI Beauty Bot",
//     website: "ai-beauty.bot",
//   };
//   const url = `https://api.apollo.io/api/v1/accounts?name=${lead.name}&domain=${lead.website}`;
//   const options = {
//     method: "POST",
//     headers: {
//       accept: "application/json",
//       "Cache-Control": "no-cache",
//       "Content-Type": "application/json",
//       "x-api-key": process.env.NEXT_PUBLIC_APOLLO_API_KEY || "",
//     },
//   };

//   const response = await fetch(url, options);
//   console.log(response);
//   const data = await response.json();
//   return NextResponse.json(data);
//   //   return NextResponse.json({id: data.account.id});
// }
