// pages/api/cancel-subscription.js - Complete version matching your format
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
    const { userId, subscriptionId } = req.body;

    console.log('Cancelling subscription for:', { userId, subscriptionId });

    // Validate required fields
    if (!userId || !subscriptionId) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        error: 'Missing required fields',
        received: { userId: !!userId, subscriptionId: !!subscriptionId }
      });
    }

    // Cancel the subscription in Stripe
    const cancelledSubscription = await stripe.subscriptions.del(subscriptionId);

    console.log('✅ Subscription cancelled successfully:', cancelledSubscription.id);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        canceledAt: cancelledSubscription.canceled_at
      }
    });

  } catch (error) {
    console.error('❌ Detailed error cancelling subscription:');
    console.error('Error message:', error.message);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      if (error.message.includes('No such subscription')) {
        return res.status(404).json({
          error: 'Subscription not found',
          details: error.message,
          type: error.type,
          code: error.code
        });
      }
      return res.status(400).json({
        error: 'Invalid subscription ID',
        details: error.message,
        type: error.type,
        code: error.code
      });
    } else if (error.type === 'StripePermissionError') {
      return res.status(403).json({
        error: 'Permission denied',
        details: error.message,
        type: error.type,
        code: error.code
      });
    } else {
      return res.status(500).json({
        error: 'Failed to cancel subscription',
        details: error.message,
        type: error.type,
        code: error.code
      });
    }
  }
}