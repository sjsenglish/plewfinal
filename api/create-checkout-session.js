// /api/create-checkout-session.js - Clean implementation for single tier payment
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { userId, userEmail } = req.body;

    // Validate required fields
    if (!userId || !userEmail) {
      console.error('❌ Missing required fields:', { userId: !!userId, userEmail: !!userEmail });
      return res.status(400).json({ 
        error: 'Missing required fields: userId and userEmail are required'
      });
    }

    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    if (!process.env.REACT_APP_STRIPE_TIER1_PRICE_ID) {
      console.error('❌ REACT_APP_STRIPE_TIER1_PRICE_ID not configured');
      return res.status(500).json({ error: 'Price ID not configured' });
    }

    console.log('✅ Creating checkout session for user:', userId);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.REACT_APP_STRIPE_TIER1_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription', // For recurring monthly payment
      customer_email: userEmail,
      
      // Pass user data in metadata for webhook processing
      metadata: {
        userId: userId,
        userEmail: userEmail,
        planType: 'tier1'
      },
      
      // Subscription metadata (for recurring subscriptions)
      subscription_data: {
        metadata: {
          userId: userId,
          userEmail: userEmail,
          planType: 'tier1'
        },
      },
      
      // URLs
      success_url: `${req.headers.origin || 'https://www.plew.co.kr'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://www.plew.co.kr'}/subscription-plans`,
      
      // Additional options
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    console.log('✅ Checkout session created:', session.id);

    res.status(200).json({
      id: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
}