import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getRedis } from "@/lib/redis";
import productsMetadata from "@/data/products.json";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
};

export async function OPTIONS() {
  return new NextResponse("ok", { headers: corsHeaders });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set in environment variables");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500, headers: corsHeaders });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const cartMetadata = session.metadata?.cart;
      const redis = getRedis();

      if (cartMetadata) {
        const items = JSON.parse(cartMetadata) as { productId: string; quantity: number }[];

        for (const item of items) {
          const meta = productsMetadata[item.productId as keyof typeof productsMetadata];
          const slug = meta?.slug || item.productId;
          
          await redis.decrby(`inventory:${slug}`, item.quantity);
          console.log(`Decremented inventory for ${slug} by ${item.quantity}`);
        }
      }
    }

    return NextResponse.json({ received: true }, { headers: corsHeaders });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400, headers: corsHeaders });
  }
}
