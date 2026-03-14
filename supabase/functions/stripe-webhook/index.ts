import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@^14";
import { Redis } from "npm:@upstash/redis@^1";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL") || "",
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN") || "",
});

// Load product metadata
import productsMetadata from "./products.json" assert { type: "json" };

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret || "");

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const cartMetadata = session.metadata?.cart;

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

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
