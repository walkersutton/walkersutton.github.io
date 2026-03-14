# Testing Guide: Supabase Edge Functions

This guide outlines how to verify that the new serverless backend (checkout, webhooks, and inventory) is working correctly.

## 1. Local Verification (Dry Run)

You can run your functions locally using the Supabase CLI.

### A. Start the Edge Functions
In the `walkersutton.github.io` directory:
```bash
supabase functions serve --no-verify-jwt
```
This will start your functions at `http://localhost:54321`.

**Important**: To make your frontend (`localhost:3000`) talk to these local functions, update your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
```
*(Remember to change it back to your production Supabase URL when you are done testing!)*

### B. Test Checkout Endpoint
Run this `curl` command to simulate a checkout request:
```bash
curl -i -X POST http://localhost:54321/functions/v1/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "prod_RbN4f9AKoO7901", "quantity": 1}],
    "email": "test@example.com",
    "shippingAddress": {
      "name": "Test User",
      "address": "123 Test St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    }
  }'
```
**Expected Result**: A JSON response with a Stripe `url`.

### C. Test Stripe Webhook
Use the Stripe CLI to trigger a test event:
```bash
# 1. Listen for local events
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# 2. Trigger a checkout session completion (in a new terminal)
stripe trigger checkout.session.completed
```
**Expected Result**: The console running `supabase functions serve` should log: `Decremented inventory for [slug]`.

---

## 2. Production Verification

Once the functions are deployed (`supabase functions deploy`), you can verify the live flow.

### A. Environment Variables
Ensure all secrets are set in Supabase:
```bash
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set STRIPE_WEBHOOK_SECRET=...
supabase secrets set UPSTASH_REDIS_REST_URL=...
supabase secrets set UPSTASH_REDIS_REST_TOKEN=...
```

### B. Full Flow Test
1. Visit your local dev site (`localhost:3000`).
2. Add an item to your bag.
3. Click **Proceed to Checkout**.
4. Fill out the address form and click **Proceed**.
5. **Success**: You should be redirected to a live Stripe Checkout page.

---

## 3. Inventory Monitoring

Since we use Upstash Redis, you can verify inventory changes via their dashboard or CLI:
- **Key Pattern**: `inventory:[product-slug]` (e.g., `inventory:tote-bag`).
- **Check value**: `GET inventory:tote-bag` in the Upstash console.
