// /api/webhooks/stripe.js - Complete version with both subscription and one-time payments
import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase (only if not already initialized)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Update user subscription in Firebase
const updateUserSubscription = async (userId, subscriptionData) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    // Check if user document exists
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // Get existing data to merge
      const existingData = userDoc.data();
      const existingSubscription = existingData.subscription || {};
      
      // Merge subscription data, preserving important fields
      const mergedSubscription = {
        ...existingSubscription,
        ...subscriptionData,
        // Ensure fullAccess is set for active subscriptions
        fullAccess: subscriptionData.status === 'active' ? true : (subscriptionData.fullAccess || false)
      };
      
      // Update existing user
      await updateDoc(userDocRef, {
        subscription: mergedSubscription,
        updatedAt: new Date(),
      });
    } else {
      // Create new user document
      await setDoc(userDocRef, {
        subscription: {
          ...subscriptionData,
          // Ensure fullAccess is set for active subscriptions
          fullAccess: subscriptionData.status === 'active' ? true : (subscriptionData.fullAccess || false)
        },
        usage: { 
          questionsViewedToday: 0, 
          questionPacksCreated: 0,
          lastResetDate: new Date().toISOString().split('T')[0]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: error.message };
  }
};

// Get user ID from Stripe session or payment intent
const getUserIdFromMetadata = (stripeObject) => {
  if (stripeObject.metadata && stripeObject.metadata.userId) {
    return stripeObject.metadata.userId;
  }
  return null;
};

// Determine plan type from metadata or session mode
const getPlanFromObject = (stripeObject) => {
  // Check metadata first
  if (stripeObject.metadata && stripeObject.metadata.planType) {
    console.log('✅ Found plan type in metadata:', stripeObject.metadata.planType);
    return stripeObject.metadata.planType;
  }
  
  // For checkout sessions, we can use mode to help determine plan type
  // Pro plan is one-time payment, tier1/study plans are subscriptions
  if (stripeObject.mode) {
    if (stripeObject.mode === 'payment') {
      // One-time payment is likely Pro plan (Full Access 2025)
      console.log('✅ Detected one-time payment mode, assuming pro plan');
      return 'pro';
    } else if (stripeObject.mode === 'subscription') {
      // Subscription could be tier1 or study plan
      // Since tier1 is the main premium plan, default to tier1
      console.log('✅ Detected subscription mode, defaulting to tier1 plan');
      return 'tier1';
    }
  }
  
  // Default fallback - log this case for debugging
  console.log('⚠️ Using fallback plan type "tier1"');
  console.log('Session mode:', stripeObject.mode);
  console.log('Session metadata:', stripeObject.metadata);
  console.log('Available keys:', Object.keys(stripeObject));
  
  return 'tier1';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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
          console.error('❌ Could not determine user ID for session:', session.id);
          return res.status(400).send('Could not determine user ID');
        }

        // Get plan type from metadata
        const planType = getPlanFromObject(session);

        // Create subscription data
        const subscriptionData = {
          status: 'active',
          plan: planType,
          fullAccess: true, // Ensure this flag is set for paid users
          stripeSessionId: session.id,
          stripeCustomerId: session.customer,
          paymentType: session.mode === 'subscription' ? 'recurring' : 'one_time',
          activatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // If it's a subscription, add subscription ID
        if (session.subscription) {
          subscriptionData.stripeSubscriptionId = session.subscription;
          console.log('✅ Added stripeSubscriptionId:', session.subscription);
        } else {
          console.log('ℹ️ No subscription ID found in session (likely one-time payment)');
        }

        const result = await updateUserSubscription(userId, subscriptionData);

        if (result.success) {
          console.log(`✅ Subscription activated for user ${userId} with plan ${planType} (${session.mode})`);
        } else {
          console.error(`❌ Failed to activate subscription:`, result.error);
          return res.status(500).send('Failed to update subscription');
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('💰 Payment intent succeeded:', paymentIntent.id);

        // Get user ID from metadata
        const userId = getUserIdFromMetadata(paymentIntent);
        if (!userId) {
          console.log('ℹ️ No user ID in payment intent metadata, skipping');
          break;
        }

        // Get plan type from metadata
        const planType = getPlanFromObject(paymentIntent);

        console.log('💰 One-time payment succeeded for user:', userId, 'plan:', planType);
        
        // Update subscription for one-time payment
        const subscriptionData = {
          status: 'active',
          plan: planType,
          fullAccess: true, // Ensure this flag is set for paid users
          paymentType: 'one_time',
          stripePaymentIntentId: paymentIntent.id,
          activatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const result = await updateUserSubscription(userId, subscriptionData);
        
        if (result.success) {
          console.log(`✅ One-time payment processed for user ${userId}`);
        } else {
          console.error(`❌ Failed to process one-time payment:`, result.error);
          return res.status(500).send('Failed to update subscription');
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
            
            // Update subscription renewal
            const subscriptionData = {
              status: 'active',
              fullAccess: true, // Ensure this flag is set for paid users
              lastPayment: new Date().toISOString(),
              stripeInvoiceId: invoice.id,
              updatedAt: new Date().toISOString(),
            };

            const result = await updateUserSubscription(userId, subscriptionData);
            
            if (result.success) {
              console.log(`✅ Subscription renewed for user ${userId}`);
            } else {
              console.error(`❌ Failed to update subscription renewal:`, result.error);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('❌ Invoice payment failed:', invoice.id);

        // Handle failed subscription payments
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(subscription.customer);
          
          if (customer.metadata && customer.metadata.userId) {
            const userId = customer.metadata.userId;
            
            // Update subscription status to past_due or canceled
            const subscriptionData = {
              status: 'past_due',
              lastFailedPayment: new Date().toISOString(),
              stripeInvoiceId: invoice.id,
              updatedAt: new Date().toISOString(),
            };

            const result = await updateUserSubscription(userId, subscriptionData);
            
            if (result.success) {
              console.log(`✅ Subscription status updated to past_due for user ${userId}`);
            } else {
              console.error(`❌ Failed to update subscription status:`, result.error);
            }
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('🗑️ Subscription canceled:', subscription.id);

        // Handle subscription cancellation
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        if (customer.metadata && customer.metadata.userId) {
          const userId = customer.metadata.userId;
          
          // Update subscription status to canceled
          const subscriptionData = {
            status: 'canceled',
            canceledAt: new Date().toISOString(),
            stripeSubscriptionId: subscription.id,
            updatedAt: new Date().toISOString(),
          };

          const result = await updateUserSubscription(userId, subscriptionData);
          
          if (result.success) {
            console.log(`✅ Subscription canceled for user ${userId}`);
          } else {
            console.error(`❌ Failed to update subscription cancellation:`, result.error);
          }
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
}