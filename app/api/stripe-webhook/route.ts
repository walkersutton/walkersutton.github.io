import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

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
      const stripe = getStripe();

      if (cartMetadata) {
        const items = JSON.parse(cartMetadata) as { productId: string; quantity: number }[];

        for (const item of items) {
          const product = await stripe.products.retrieve(item.productId);
          const current = parseInt(product.metadata?.inventory || "0", 10);
          const updated = Math.max(0, current - item.quantity);
          await stripe.products.update(item.productId, { metadata: { inventory: String(updated) } });
          console.log(`Updated inventory for ${item.productId}: ${current} → ${updated}`);
        }
      }
    }

    return NextResponse.json({ received: true }, { headers: corsHeaders });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400, headers: corsHeaders });
  }
}
