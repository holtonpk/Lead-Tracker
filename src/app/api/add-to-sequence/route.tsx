import {NextResponse} from "next/server";

export async function GET() {
  const sequenceId = "687964c9fbd38d0011444106";
  const contactIds = ["66b59c7f86cddf0001761b94"]; // Replace with any number of IDs
  const emailAccountId = "68795c63a97453001d136594";

  // Dynamically build the contact_ids[] query string
  const contactIdsQuery = contactIds
    .map((id) => `contact_ids[]=${encodeURIComponent(id)}`)
    .join("&");
  const otherParams = [
    "sequence_no_email=false",
    "sequence_unverified_email=false",
    "sequence_job_change=false",
    "sequence_active_in_other_campaigns=false",
    "sequence_finished_in_other_campaigns=false",
  ].join("&");
  const url = `https://api.apollo.io/api/v1/emailer_campaigns/687964c9fbd38d0011444106/add_contact_ids?emailer_campaign_id=687964c9fbd38d0011444106&contact_ids[]=66b59c7f86cddf0001761b94&send_email_from_email_account_id=68795c63a97453001d136594&sequence_no_email=false&sequence_unverified_email=false&sequence_job_change=false&sequence_active_in_other_campaigns=false&sequence_finished_in_other_campaigns=false`;

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
