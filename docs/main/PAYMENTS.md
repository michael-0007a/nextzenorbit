# Payments Integration — JobSearch AI

## Overview

JobSearch AI uses Razorpay as the primary payment gateway with Cashfree as a secondary option. All payments are in INR with GST compliance.

## Pricing Plans

| Plan | Monthly (INR) | Annual (INR) | AI Tokens | Resumes | Applications/Day |
|------|---------------|--------------|-----------|---------|------------------|
| Free | ₹0 | - | 50,000 | 2 | 5 |
| Pro | ₹499 | ₹3,999 | 500,000 | Unlimited | 50 |
| Elite | ₹999 | ₹7,999 | 2,000,000 | Unlimited | Unlimited |

### GST Calculation
All prices are inclusive of 18% GST.

```typescript
const calculateGST = (amountPaise: number) => {
  const baseAmount = Math.round(amountPaise / 1.18);
  const gstAmount = amountPaise - baseAmount;
  return { baseAmount, gstAmount };
};
```

## Razorpay Integration

### Environment Variables
```env
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Creating an Order
```typescript
// POST /api/payments/create-order
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const order = await razorpay.orders.create({
  amount: 49900, // ₹499 in paise
  currency: 'INR',
  receipt: `order_${userId}_${Date.now()}`,
  notes: {
    user_id: userId,
    plan_id: 'pro',
  },
});
```

### Client-Side Checkout
```typescript
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: order.amount,
  currency: order.currency,
  name: 'Nextzen Orbit',
  description: 'Pro Plan Subscription',
  order_id: order.id,
  handler: async (response) => {
    // Verify payment server-side
    await verifyPayment(response);
  },
  prefill: {
    email: user.email,
    contact: user.phone,
  },
  theme: {
    color: '#56e39f',
  },
};

const rzp = new window.Razorpay(options);
rzp.open();
```

### Webhook Handler
```typescript
// POST /api/webhooks/razorpay
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);

  // Handle events
  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event.payload);
      break;
    case 'subscription.activated':
      await handleSubscriptionActivated(event.payload);
      break;
    // ... other events
  }

  return new Response('OK', { status: 200 });
}
```

### Webhook Events

| Event | Action |
|-------|--------|
| `payment.captured` | Activate subscription, send confirmation email |
| `payment.failed` | Notify user, retry logic |
| `subscription.activated` | Update subscription status to 'active' |
| `subscription.charged` | Renew subscription period |
| `subscription.cancelled` | Update status to 'cancelled' |
| `subscription.halted` | Update status to 'past_due', grace period |
| `refund.created` | Process refund, update subscription |

## Cashfree Integration (Secondary)

### Environment Variables
```env
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
```

### Creating an Order
```typescript
const order = await fetch('https://sandbox.cashfree.com/pg/orders', {
  method: 'POST',
  headers: {
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
    'x-api-version': '2022-09-01',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    order_id: `order_${userId}_${Date.now()}`,
    order_amount: 499,
    order_currency: 'INR',
    customer_details: {
      customer_id: userId,
      customer_email: user.email,
      customer_phone: user.phone,
    },
  }),
});
```

### Webhook Verification
```typescript
function verifyCashfreeWebhook(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  const payload = timestamp + body;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CASHFREE_SECRET_KEY!)
    .update(payload)
    .digest('base64');
  return expectedSignature === signature;
}
```

## Subscription Database Schema

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider TEXT CHECK (provider IN ('razorpay', 'cashfree')),
  plan_id TEXT CHECK (plan_id IN ('free', 'pro', 'elite')),
  status TEXT CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled')),
  
  -- Provider IDs
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  
  -- Billing
  currency TEXT DEFAULT 'INR',
  amount_paise INTEGER,
  gst_amount_paise INTEGER,
  
  -- Periods
  trial_starts_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ
);
```

## Payment Flow

```
1. User selects plan
   ↓
2. POST /api/payments/create-order
   ↓
3. Razorpay order created
   ↓
4. Open Razorpay checkout modal
   ↓
5. User completes payment
   ↓
6. Razorpay sends webhook
   ↓
7. Verify signature
   ↓
8. Update subscription in DB
   ↓
9. Send confirmation email
   ↓
10. User sees updated plan
```

## Trial Management

### 7-Day Free Trial
- All new users get 7-day trial on signup
- Trial status: `trialing`
- Trial expiry checks run on each login
- Email reminders: 3 days, 1 day before expiry

### Trial Expiry Logic
```typescript
export function isTrialActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (subscription.status !== 'trialing') return false;
  if (!subscription.trial_ends_at) return false;
  return new Date(subscription.trial_ends_at) > new Date();
}

export function getTrialDaysRemaining(subscription: Subscription | null): number {
  if (!isTrialActive(subscription)) return 0;
  const endDate = new Date(subscription.trial_ends_at!);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
```

## Security Best Practices

1. **Never trust client-side payment status** — Always verify via webhook
2. **Verify all webhook signatures** — Use timing-safe comparison
3. **Handle idempotency** — Same webhook may arrive multiple times
4. **Store amounts in paise** — Avoid floating-point issues
5. **Log webhook events** — For debugging and audit trail
6. **Return 200 immediately** — Process async to avoid timeouts

---

*Last updated: 2026-03-05*

