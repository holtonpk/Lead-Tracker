import {NextRequest, NextResponse} from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const {contactId, labelNames} = await request.json();
    if (!contactId || !Array.isArray(labelNames)) {
      return NextResponse.json(
        {error: "Missing contactId or labelNames (must be array)"},
        {status: 400}
      );
    }
    const url = `https://api.apollo.io/api/v1/contacts/${contactId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        accept: "application/json",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_APOLLO_API_KEY || "",
      },
      body: JSON.stringify({label_names: labelNames}),
    });

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

    if (!response.ok) {
      console.error("Apollo API error:", res);
      return NextResponse.json(
        {error: "Apollo API error", details: res},
        {status: 502}
      );
    }

    return NextResponse.json({success: true, data: res});
  } catch (error) {
    console.error("Error in update-contact API:", error);
    return NextResponse.json(
      {error: "Internal server error", details: error?.toString()},
      {status: 500}
    );
  }
}

export async function GET() {
  try {
    //   const {contactId, labelNames} = await request.json();
    const contactId = "687ed5b7bbc89d0019f1ee8e";
    const labelNames = ["Move Ons (Have Socials, tried organic, stopped)"];
    if (!contactId || !Array.isArray(labelNames)) {
      return NextResponse.json(
        {error: "Missing contactId or labelNames (must be array)"},
        {status: 400}
      );
    }
    const url = `https://api.apollo.io/api/v1/contacts/${contactId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        accept: "application/json",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_APOLLO_API_KEY || "",
      },
      body: JSON.stringify({label_names: labelNames}),
    });

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

    if (!response.ok) {
      console.error("Apollo API error:", res);
      return NextResponse.json(
        {error: "Apollo API error", details: res},
        {status: 502}
      );
    }

    return NextResponse.json({success: true, data: res});
  } catch (error) {
    console.error("Error in update-contact API:", error);
    return NextResponse.json(
      {error: "Internal server error", details: error?.toString()},
      {status: 500}
    );
  }
}
