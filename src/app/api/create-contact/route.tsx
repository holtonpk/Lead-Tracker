import {NextRequest, NextResponse} from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {firstName, lastName, accountId, title, email, labelNames} =
      await request.json();
    let url = `https://api.apollo.io/api/v1/contacts?first_name=${firstName}&last_name=${lastName}&account_id=${accountId}&title=${title}`;
    if (email) {
      url += `&email=${email}`;
    }
    if (labelNames) {
      url += `&label_names[]=${labelNames}`;
    }
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

    if (!response.ok || !res.contact || !res.contact.id) {
      console.error("Apollo API error or missing contact:", res);
      return NextResponse.json(
        {error: "Apollo API error", details: res},
        {status: 502}
      );
    }

    return NextResponse.json({id: res.contact.id});
  } catch (error) {
    console.error("Error in create-account API:", error);
    return NextResponse.json(
      {error: "Internal server error", details: error?.toString()},
      {status: 500}
    );
  }
}
