-- Migration: Drop legacy Razorpay and Cashfree payment fields
-- Description: Consolidates the payment stack to PayU only.

ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS razorpay_customer_id,
  DROP COLUMN IF EXISTS razorpay_subscription_id,
  DROP COLUMN IF EXISTS razorpay_plan_id,
  DROP COLUMN IF EXISTS cashfree_customer_id,
  DROP COLUMN IF EXISTS cashfree_subscription_id;
