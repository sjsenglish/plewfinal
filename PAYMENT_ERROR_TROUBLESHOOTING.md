# Payment Error Troubleshooting Guide

## Common Errors and Solutions

### 1. HCaptcha Rate Limiting (429 Errors)
```
api.hcaptcha.com/getcaptcha/...: Failed to load resource: the server responded with a status of 429
```

**What this means:**
- Stripe uses HCaptcha for fraud protection
- Too many payment attempts from the same IP address
- Rate limiting triggered by suspicious activity

**Solutions:**
1. **Wait 5-10 minutes** before trying again
2. **Clear browser data:**
   - Clear cookies and cache
   - Try incognito/private browsing mode
3. **Try different network:**
   - Use mobile data instead of WiFi
   - Try from a different device/location
4. **Use Stripe test mode** for development:
   - Use test credit card numbers: `4242 4242 4242 4242`
   - Switch to live mode only for real transactions

### 2. Stripe 402 Payment Error
```
api.stripe.com/v1/payment_pages/cs_live_.../confirm: Failed to load resource: the server responded with a status of 402
```

**What this means:**
- Payment Required - the payment couldn't be processed
- Usually indicates card/payment method issue

**Solutions:**
1. **Check payment method:**
   - Verify card details are correct
   - Ensure sufficient funds
   - Try a different card
2. **Check Stripe Dashboard:**
   - Look for declined payments
   - Check webhook events
3. **Session expiry:**
   - Checkout sessions expire after 30 minutes
   - Create a new payment session

### 3. Prevention Measures

**For Development:**
- Use Stripe test mode
- Use test credit cards from Stripe documentation
- Don't repeatedly test with the same session

**For Production:**
- Monitor Stripe Dashboard for declined payments
- Set up proper error handling in your app
- Consider implementing retry logic with exponential backoff

## Checking Payment Status

### 1. In Stripe Dashboard
1. Go to Stripe Dashboard → Payments
2. Look for your recent payments
3. Check status (succeeded, failed, canceled)
4. View error details if payment failed

### 2. In Your App
Check browser console for:
```javascript
// Look for these log messages:
"Creating checkout session for plan:"
"Checkout session created successfully"
"Error creating checkout session:"
```

### 3. In Firebase
Check if user subscription was updated:
```
users/{userId}/subscription: {
  status: "active",
  fullAccess: true,
  plan: "tier1"
}
```

## Error Codes Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 400 | Bad Request | Check payment details |
| 401 | Unauthorized | User needs to log in |
| 402 | Payment Required | Card declined or insufficient funds |
| 429 | Too Many Requests | Wait and try again |
| 500 | Server Error | Try again later |

## Testing Payments Safely

### Use Stripe Test Mode
1. Use test publishable key: `pk_test_...`
2. Use test secret key: `sk_test_...`
3. Use test credit cards:
   - Visa: `4242 4242 4242 4242`
   - Visa (debit): `4000 0566 5566 5556`
   - Mastercard: `5555 5555 5555 4444`
   - Any future expiry date and any 3-digit CVC

### Test Different Scenarios
```javascript
// Test cards for different outcomes:
// Declined: 4000 0000 0000 0002
// Insufficient funds: 4000 0000 0000 9995
// Lost card: 4000 0000 0000 9987
// Stolen card: 4000 0000 0000 9979
```

## Immediate Actions for Your Site

1. **Check Environment Variables:**
   ```bash
   # Ensure these are set in Vercel:
   STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Check Stripe Dashboard:**
   - Verify webhook endpoint is active
   - Check recent payment attempts
   - Look for error logs

3. **Test in Different Environment:**
   - Try from incognito mode
   - Test with different IP/device
   - Use mobile vs desktop

4. **Monitor Logs:**
   - Check Vercel function logs
   - Check browser console errors
   - Check Stripe Dashboard events

## Contact Support

If problems persist:
1. **Stripe Support:** Include payment intent IDs and error details
2. **Check Status Pages:** 
   - https://status.stripe.com/
   - https://status.hcaptcha.com/

## Code Improvements Made

1. **Added session expiration** (30 minutes)
2. **Better error handling** with specific messages
3. **Improved logging** for debugging
4. **Added locale detection** for better UX

These changes should reduce rate limiting and provide better error messages to users.