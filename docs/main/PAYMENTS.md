# Payments: Nextzen Orbit (main)

Last reviewed from code: 2026-10-16. Code: `src/lib/payments/*`, `src/lib/subscription.ts`, `src/app/api/{subscription,payments,webhooks/payu}`. Rollout history and edge cases: [signup-review-rollout.md](signup-review-rollout.md).

## Summary

- **Gateway:** PayU, INR, monthly. The USD gateway (`usd-gateway.ts`) is a placeholder, and checkout rejects USD.
- **Who pays:** only approved `user` accounts. Staff roles and `sso_user` bypass payment.
- **What unlocks service:** an active, paid, unexpired subscription. Trials, missing end dates and expired periods do **not** unlock service (migration 035).
- The old Razorpay and Cashfree integrations were removed. Only `RAZORPAY_KEY_ID` is still read, as a leftover in `subscription/create`.

## Plans

From `PLANS` in `src/lib/subscription.ts`. The internal ids are historical: `free` is the paid Silver plan.

| Id | Name | Monthly INR | Monthly USD (display) | Annual INR | Apply target / month |
| --- | --- | --- | --- | --- | --- |
| `free` | Silver | ₹13,999 | $149 | ₹1,67,988 | 300 |
| `pro` | Gold | ₹18,999 | $199 | ₹2,27,988 | 400 |
| `elite` | Elite | ₹23,999 | $249 | ₹2,87,988 | 500 |

All plans have unlimited resumes and AI. The plan mainly sets the done-for-you application target (see [shared-client-assignments.md](shared-client-assignments.md)). `price_paise` is the amount charged. `calculateGST` in `types.ts` (18%) exists but isn't applied at checkout, so treat the listed prices as final.

## Checkout flow

```
/subscription (approved, unpaid client)
   │ choose plan
   ▼
POST /api/subscription/create  (plan: free|pro|elite, INR only)
  or POST /api/payments/create-order (planId: pro|elite, monthly INR only)
   │ rate limit: 5 per user per 5 min (shared "checkout" bucket)
   │ payment_orders row (status pending, random txnid)
   ▼
PayU hosted checkout (form post with hash, NEXT_PUBLIC_PAYU_URL)
   ▼
POST /api/webhooks/payu  ← PayU success/failure redirect
   │ verify response hash (merchant salt)
   │ success → complete_payu_payment(txnid, amount_paise, mihpayid)
   │           (checks amount, records payment, extends period once)
   ▼
303 → /subscription?payment=confirmed | incomplete
```

## Recovery and reconciliation

- **Check payment status** on `/subscription` calls `POST /api/payments/reconcile`. It asks PayU's verify API about the user's five latest pending orders, or one given `txnid`, and activates any that were captured with the matching amount. Limit: 6 per 5 minutes.
- **Admins** use "Verify payment & sync plan" on a client page (`POST /api/admin/subscription/activate`). It verifies with PayU, never grants unpaid access, and is limited to 10 per 5 minutes.
- A new checkout never overwrites an active subscription. Repeated callbacks don't add duplicate periods.
- If the callback returns 503, the payment is safe. The user should press **Check payment status** and must not pay again.

## Configuration

| Variable | Notes |
| --- | --- |
| `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT` | Must come from the same PayU environment (test or live) |
| `NEXT_PUBLIC_PAYU_URL` | PayU test or production payment URL |
| `NEXT_PUBLIC_APP_URL` | Used to build the success/failure return URLs |

In the PayU dashboard, set the callback / return URL to `https://<app host>/api/webhooks/payu`.

## Security rules

1. Never trust client-side payment status. Activation happens only after the hash is verified or PayU's verify API confirms the payment.
2. Amounts are stored in paise and checked against the original order.
3. Activation is one `SECURITY DEFINER` transaction (`complete_payu_payment`) and is idempotent.
4. The checkout and reconcile endpoints require an approved account and are rate limited.

## Testing

- `npm run test:signup` includes local PGlite payment/access tests (`scripts/test-payment-access.cjs`). PayU itself is mocked.
- Before a release: complete a PayU sandbox payment, reload `/subscription`, simulate a lost browser return, run **Check payment status**, and confirm a second checkout doesn't disturb an active plan.
