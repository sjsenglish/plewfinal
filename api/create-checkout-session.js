// /api/create-checkout-session.js - Complete updated version with trial support
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Check if Stripe secret key exists
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
      return res.status(500).json({ error: 'Stripe secret key not configured' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { priceId, userId, userEmail, planType, isTrial, successUrl, cancelUrl } = req.body;

    console.log('Creating checkout session for:', { priceId, userId, userEmail, planType, isTrial });

    // Validate required fields
    if (!priceId || !userId || !userEmail || !planType) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { priceId: !!priceId, userId: !!userId, userEmail: !!userEmail, planType: !!planType }
      });
    }

    // Determine payment mode based on plan type
    let mode = 'subscription'; // Default for Study Plan (recurring)
    let sessionConfig = {};

    if (planType === 'pro') {
      // Pro Plan is one-time payment
      mode = 'payment';
      sessionConfig = {
        metadata: {
          userId: userId,
          planType: planType,
        },
        payment_intent_data: {
          metadata: {
            userId: userId,
            planType: planType,
          },
        },
      };
    } else if (planType === 'trial' || isTrial) {
      // Trial Plan - subscription with 3-day trial
      mode = 'subscription';
      sessionConfig = {
        metadata: {
          userId: userId,
          planType: 'trial',
        },
        subscription_data: {
          trial_period_days: 3, // 3-day free trial
          metadata: {
            userId: userId,
            planType: 'trial',
          },
        },
      };
    } else {
      // Study Plan is subscription (recurring)
      mode = 'subscription';
      sessionConfig = {
        metadata: {
          userId: userId,
          planType: planType,
        },
        subscription_data: {
          metadata: {
            userId: userId,
            planType: planType,
          },
        },
      };
    }

    console.log('Payment mode:', mode, 'for plan:', planType, 'isTrial:', isTrial);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      
      // Customer information
      customer_email: userEmail,
      
      // URLs
      success_url: successUrl || `${req.headers.origin || 'https://examrizzsearch.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin || 'https://examrizzsearch.com'}/subscription-plans`,
      
      // Additional options
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      
      // Plan-specific configuration (metadata and subscription_data)
      ...sessionConfig,
    });

    console.log('✅ Checkout session created successfully:', session.id, 'Mode:', mode);

    res.status(200).json({
      id: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('❌ Detailed error creating checkout session:');
    console.error('Error message:', error.message);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);

    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
}