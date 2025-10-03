// /api/webhooks/stripe.js - Handle Stripe webhook events and update Firebase
import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase
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
    console.log('🔄 Updating user subscription for:', userId);
    console.log('📝 Subscription data:', subscriptionData);
    
    const userDocRef = doc(db, 'users', userId);
    
    // Check if user document exists
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // Update existing user
      await updateDoc(userDocRef, {
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
      
      await setDoc(userDocRef, newUserData);
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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('💳 Checkout session completed:', session.id);

        // Get user ID from metadata
        const userId = getUserIdFromMetadata(session);
        if (!userId) {
          console.error('❌ No user ID found in session metadata');
          return res.status(400).send('No user ID in metadata');
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
          return res.status(500).send('Failed to update user subscription');
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
    res.status(500).send('Webhook processing failed');
  }
}