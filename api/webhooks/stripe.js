import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

// Disable body parser to access raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Update user subscription in Firebase
const updateUserSubscription = async (userId, subscriptionData) => {
  try {
    console.log('🔄 Updating user subscription for:', userId);
    console.log('📝 Subscription data:', subscriptionData);
    
    const userDocRef = db.collection('users').doc(userId);
    
    // Check if user document exists
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      // Update existing user
      await userDocRef.update({
        subscription: subscriptionData,
        updatedAt: new Date(),
      });
      console.log('✅ Updated existing user subscription');
    } else {
      // Create new user document
      const newUserData = {
        subscription: subscriptionData,
        usage: { 
          questionsViewedToday: 0, 
          questionPacksCreated: 0,
          lastResetDate: new Date().toISOString().split('T')[0]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await userDocRef.set(newUserData);
      console.log('✅ Created new user with subscription');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    return { success: false, error: error.message };
  }
};

// Get user ID from Stripe metadata
const getUserIdFromMetadata = (stripeObject) => {
  if (stripeObject.metadata && stripeObject.metadata.userId) {
    return stripeObject.metadata.userId;
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  
  try {
    // Read raw body for Vercel serverless functions
    const buf = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      console.error('❌ No Stripe signature found in headers');
      return res.status(400).json({ error: 'No Stripe signature found' });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    
    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`✅ Webhook received: ${event.type}`);

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('💳 Checkout session completed:', session.id);

        // Get user ID from metadata
        const userId = getUserIdFromMetadata(session);
        if (!userId) {
          console.error('❌ No user ID found in session metadata');
          return res.status(400).json({ error: 'No user ID in metadata' });
        }

        console.log('👤 Processing payment for user:', userId);

        // Create subscription data for successful payment
        const subscriptionData = {
          status: 'active',
          plan: 'tier1',
          fullAccess: true, // This is the key field your app checks
          stripeSessionId: session.id,
          stripeCustomerId: session.customer,
          paymentType: 'recurring',
          activatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Add subscription ID if available
        if (session.subscription) {
          subscriptionData.stripeSubscriptionId = session.subscription;
          console.log('🔗 Added subscription ID:', session.subscription);
        }

        // Update user in Firebase
        const result = await updateUserSubscription(userId, subscriptionData);

        if (result.success) {
          console.log(`🎉 Subscription activated for user ${userId}`);
        } else {
          console.error(`❌ Failed to activate subscription:`, result.error);
          return res.status(500).json({ error: 'Failed to update user subscription' });
        }

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log('💰 Invoice paid:', invoice.id);

        // Handle subscription renewals
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(subscription.customer);
          
          if (customer.metadata && customer.metadata.userId) {
            const userId = customer.metadata.userId;
            console.log('🔄 Renewing subscription for user:', userId);
            
            // Update subscription with renewal info
            const subscriptionData = {
              status: 'active',
              fullAccess: true,
              lastPayment: new Date().toISOString(),
              stripeInvoiceId: invoice.id,
              updatedAt: new Date().toISOString(),
            };

            const result = await updateUserSubscription(userId, subscriptionData);
            
            if (result.success) {
              console.log(`✅ Subscription renewed for user ${userId}`);
            } else {
              console.error(`❌ Failed to renew subscription:`, result.error);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('❌ Invoice payment failed:', invoice.id);

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(subscription.customer);
          
          if (customer.metadata && customer.metadata.userId) {
            const userId = customer.metadata.userId;
            console.log('⚠️ Payment failed for user:', userId);
            
            // Update subscription status
            const subscriptionData = {
              status: 'past_due',
              fullAccess: false, // Remove access when payment fails
              lastFailedPayment: new Date().toISOString(),
              stripeInvoiceId: invoice.id,
              updatedAt: new Date().toISOString(),
            };

            const result = await updateUserSubscription(userId, subscriptionData);
            
            if (result.success) {
              console.log(`⚠️ Subscription marked as past_due for user ${userId}`);
            } else {
              console.error(`❌ Failed to update failed payment:`, result.error);
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('🗑️ Subscription canceled:', subscription.id);

        const customer = await stripe.customers.retrieve(subscription.customer);
        
        if (customer.metadata && customer.metadata.userId) {
          const userId = customer.metadata.userId;
          console.log('❌ Canceling subscription for user:', userId);
          
          // Update subscription status to canceled
          const subscriptionData = {
            status: 'canceled',
            fullAccess: false, // Remove access when canceled
            canceledAt: new Date().toISOString(),
            stripeSubscriptionId: subscription.id,
            updatedAt: new Date().toISOString(),
          };

          const result = await updateUserSubscription(userId, subscriptionData);
          
          if (result.success) {
            console.log(`❌ Subscription canceled for user ${userId}`);
          } else {
            console.error(`❌ Failed to cancel subscription:`, result.error);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}