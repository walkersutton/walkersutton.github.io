import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getRedis } from "@/lib/redis";
import productsMetadata from "@/data/products.json";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse("ok", { headers: corsHeaders });
}

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

export async function POST(req: Request) {
  try {
    const { items, email, shippingAddress } = (await req.json()) as CheckoutBody;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    const stripe = getStripe();
    const redis = getRedis();

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
      const inventory = (await redis.get<number>(`inventory:${slug}`)) || (await redis.get<number>(`inventory:${item.productId}`)) || 0;
      if (inventory < item.quantity) {
        return NextResponse.json(
          { error: `Sorry, ${stripeProduct.name} is out of stock` },
          { status: 400, headers: corsHeaders }
        );
      }

      const price = await stripe.prices.retrieve(stripeProduct.default_price as string);

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: stripeProduct.name,
            description: stripeProduct.description || undefined,
            images: stripeProduct.images[0] ? [stripeProduct.images[0]] : [],
          },
          unit_amount: price.unit_amount || 0,
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

    return NextResponse.json({ url: session.url }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Checkout route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
