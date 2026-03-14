import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@^14";
import { Redis } from "npm:@upstash/redis@^1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutBody {
  items: { productId: string; quantity: number }[];
  email?: string;
  shippingAddress: {
    name: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

// Load product metadata
import productsMetadata from "./products.json" assert { type: "json" };

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, email, shippingAddress } = (await req.json()) as CheckoutBody;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL") || "",
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN") || "",
    });

    const lineItems = [];
    const origin = req.headers.get("origin") || "https://walkersutton.com";

    for (const item of items) {
      const stripeProduct = await stripe.products.retrieve(item.productId);
      if (!stripeProduct.active) {
        throw new Error(`Product ${item.productId} is not active`);
      }

      const meta = productsMetadata[item.productId as keyof typeof productsMetadata];
      const slug = meta?.slug || item.productId;

      // Check stock
      const inventory = await redis.get<number>(`inventory:${slug}`) || await redis.get<number>(`inventory:${item.productId}`) || 0;
      if (inventory < item.quantity) {
        return new Response(JSON.stringify({ error: `Sorry, ${stripeProduct.name} is out of stock` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const price = await stripe.prices.retrieve(stripeProduct.default_price as string);

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: stripeProduct.name,
            description: stripeProduct.description,
            images: [stripeProduct.images[0]],
          },
          unit_amount: price.unit_amount,
        },
        quantity: item.quantity,
      });
    }

    // Shipping calculation (Simplified port of lib/shipping.ts)
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    let shippingAmount = 0;
    const country = shippingAddress.country;
    
    if (country === "US") {
      shippingAmount = 500 + (quantity > 1 ? (quantity - 1) * 250 : 0);
    } else if (country === "CA") {
      shippingAmount = 1500 + (quantity > 1 ? (quantity - 1) * 250 : 0);
    } else {
      shippingAmount = 2500 + (quantity > 1 ? (quantity - 1) * 416 : 0);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: email,
      metadata: {
        cart: JSON.stringify(items),
        shipping_name: shippingAddress.name,
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingAmount,
              currency: "usd",
            },
            display_name: "Shipping",
          },
        },
      ],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/bag`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
