import {NextApiRequest, NextApiResponse} from "next";
import {NextResponse} from "next/server";

const INSTANTLY_API_KEY =
  "ZWJlZWE0MDUtMTFiNC00M2JkLTk2ZjktMDRkOGYzMWNhZTU3OmhuSmVDdmdMZ0pybg==";

export async function GET(req: Request) {
  try {
    const resp = await fetch(`https://api.instantly.ai/api/v2/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INSTANTLY_API_KEY}`,
      },
      body: JSON.stringify({
        email: "test@test.com",
        first_name: "Test First Name",
        last_name: "Test Last Name",
        company_name: "Test Company Name",
        phone: "1234567890",
        website: "https://test.com",
        linkedin_url: "https://linkedin.com/in/test",
      }),
    });

    const data = await resp.json();
    console.log(data);

    return NextResponse.json({
      response: data,
    });
  } catch (error) {
    console.error("Lead Add Error:", error);
    return NextResponse.json(
      {response: "Lead Add Error. Please try again later."},
      {status: 500}
    );
  }
}
