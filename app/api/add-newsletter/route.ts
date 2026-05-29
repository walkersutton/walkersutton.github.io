import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

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
        { status: 400, headers: corsHeaders }
      );
    }

    const redis = getRedis();
    
    // Store subscribers in a Redis Set (automatically handles uniqueness)
    await redis.sadd("subscribers", email_address.trim().toLowerCase());
    console.log(`New newsletter subscriber added: ${email_address}`);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
