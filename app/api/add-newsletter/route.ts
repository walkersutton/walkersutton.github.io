import { NextResponse } from "next/server";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse("ok", { headers: corsHeaders });
}

interface NewsletterBody {
  email_address: string;
}

export async function POST(req: Request) {
  try {
    const { email_address } = (await req.json()) as NewsletterBody;

    if (!email_address || !email_address.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400, headers: corsHeaders },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.contacts.create({
      email: email_address.trim().toLowerCase(),
      unsubscribed: false,
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
