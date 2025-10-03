# Payment System Fix Guide

## Problem Summary
The payment system was using hardcoded Stripe payment links that don't pass the Firebase user ID to Stripe. This caused payments to fail to update the correct user's subscription status in Firebase.

## Solution Implemented

### 1. Updated Payment Components
- Modified `src/components/SubscriptionPlans.js` to use `createCheckoutSession()` instead of `window.open(plan.paymentLink)`
- Modified `src/components/SubscriptionPlansModal.js` with the same fix
- These changes ensure the Firebase UID is passed to Stripe in the checkout session metadata

### 2. Updated Checkout Service
- Modified `src/services/checkoutService.js` to properly detect the "tier1" plan type
- Added support for the hardcoded price ID: `price_1Rl7p3RslRN77kT81et1VUvh`

### 3. Updated Webhook Handler
- Modified `api/webhooks/stripe.js` to default to "tier1" plan for subscriptions
- Ensures proper plan type detection when metadata is received from Stripe

## Required Environment Variables

### For Vercel Deployment
You MUST set these environment variables in your Vercel project settings:

```bash
# Backend Stripe Keys (Required for API routes)
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend Stripe Keys (Already should be set)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)

# Firebase Config (for webhook to update users)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

### For Local Testing
Add to `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Setting Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copy the signing secret and set it as `STRIPE_WEBHOOK_SECRET`

## Testing the Fix

1. **Test locally first:**
   ```bash
   npm run dev
   ```
   - Try to purchase a subscription
   - Check browser console for logs
   - Verify the checkout session is created with user ID

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```
   - Ensure all environment variables are set in Vercel
   - Test a real payment (or use Stripe test mode)
   - Check Stripe Dashboard for webhook events
   - Verify user's Firebase document is updated

## Debugging Checklist

If payments still fail:

1. **Check Browser Console:**
   - Look for "Creating checkout session for plan:" logs
   - Verify User ID and Price ID are logged

2. **Check Network Tab:**
   - Verify `/api/create-checkout-session` returns 200
   - Check response contains session ID and URL

3. **Check Stripe Dashboard:**
   - Verify checkout session is created
   - Check metadata contains `userId` and `planType`
   - Check webhook events are received

4. **Check Vercel Functions Logs:**
   - Go to Vercel dashboard → Functions tab
   - Look for errors in `create-checkout-session` and `stripe` webhook logs

5. **Verify Firebase Update:**
   - Check user document in Firebase Console
   - Verify `subscription` object has:
     - `status: "active"`
     - `fullAccess: true`
     - `plan: "tier1"`

## Common Issues

1. **"Failed to create checkout session"**
   - Check `STRIPE_SECRET_KEY` is set in Vercel
   - Verify the key starts with `sk_live_` or `sk_test_`

2. **Webhook not updating users**
   - Check `STRIPE_WEBHOOK_SECRET` is set correctly
   - Verify webhook endpoint URL in Stripe matches your domain
   - Check Firebase credentials are set in Vercel

3. **User sees "Access Denied" after payment**
   - Clear browser cache and refresh
   - Check Firebase user document has `subscription.fullAccess: true`
   - Verify the webhook successfully processed the payment

## Support

If issues persist:
1. Check Stripe Dashboard → Developers → Logs for detailed error messages
2. Check Vercel Dashboard → Functions → Logs for API errors
3. Check Firebase Console → Firestore → users collection for data issues