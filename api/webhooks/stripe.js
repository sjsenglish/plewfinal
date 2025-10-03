// /api/webhooks/stripe.js - Updated for payment link support with email matching
import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';

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

// Find user by email and update subscription
const updateUserByEmail = async (email, subscriptionData) => {
  try {
    console.log('🔍 Looking for user with email:', email);
    
    // Find user by email in Firebase
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No user found with email:', email);
      // Store payment info for future matching
      await storeUnmatchedPayment(email, subscriptionData);
      return { success: false, error: 'User not found' };
    }

    // Get the first matching user
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    console.log('✅ Found user:', userId, 'for email:', email);

    // Update user subscription
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      subscription: {
        ...subscriptionData,
        fullAccess: true, // Ensure full access is granted
      },
      updatedAt: new Date(),
    });

    console.log('✅ Subscription activated for user:', userId);
    return { success: true, userId };

  } catch (error) {
    console.error('❌ Error updating user by email:', error);
    return { success: false, error: error.message };
  }
};

// Store payment for users who haven't signed up yet
const storeUnmatchedPayment = async (email, subscriptionData) => {
  try {
    const unmatchedPaymentRef = doc(db, 'unmatchedPayments', email.replace(/\./g, '_'));
    await setDoc(unmatchedPaymentRef, {
      email: email,
      subscription: subscriptionData,
      createdAt: new Date().toISOString(),
      matched: false,
    });
    console.log('📝 Stored unmatched payment for:', email);
  } catch (error) {
    console.error('❌ Error storing unmatched payment:', error);
  }
};

// Get user ID from Stripe session or payment intent metadata
const getUserIdFromMetadata = (stripeObject) => {
  if (stripeObject.metadata && stripeObject.metadata.userId) {
    return stripeObject.metadata.userId;
  }
  return null;
};

// Get customer email from Stripe objects
const getCustomerEmail = async (stripeObject) => {
  // Check if email is directly available
  if (stripeObject.customer_email) {
    return stripeObject.customer_email;
  }
  
  // If customer ID is available, fetch customer details
  if (stripeObject.customer) {
    try {
      const customer = await stripe.customers.retrieve(stripeObject.customer);
      return customer.email;
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
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

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('💳 Checkout session completed:', session.id);

        // First try to get user ID from metadata (programmatic checkout)
        const userId = getUserIdFromMetadata(session);
        
        if (userId) {
          console.log('✅ Found userId in metadata:', userId);
          // Handle programmatic checkout (existing logic)
          const subscriptionData = {
            status: 'active',
            plan: 'tier1',
            fullAccess: true,
            stripeSessionId: session.id,
            stripeCustomerId: session.customer,
            paymentType: session.mode === 'subscription' ? 'recurring' : 'one_time',
            activatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, {
            subscription: subscriptionData,
            updatedAt: new Date(),
          });

          console.log('✅ Subscription activated for user:', userId);
        } else {
          console.log('🔍 No userId in metadata, trying email matching');
          // Handle payment link checkout - match by email
          const customerEmail = await getCustomerEmail(session);
          
          if (customerEmail) {
            const subscriptionData = {
              status: 'active',
              plan: 'tier1',
              fullAccess: true,
              stripeSessionId: session.id,
              stripeCustomerId: session.customer,
              paymentType: 'stripe_link',
              activatedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              activatedByEmail: true,
            };

            const result = await updateUserByEmail(customerEmail, subscriptionData);
            
            if (!result.success) {
              console.log('⚠️ Could not match payment to existing user');
            }
          } else {
            console.error('❌ No customer email found in session');
          }
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('💰 Payment intent succeeded:', paymentIntent.id);

        // Try metadata first
        const userId = getUserIdFromMetadata(paymentIntent);
        
        if (userId) {
          // Handle programmatic payment
          const subscriptionData = {
            status: 'active',
            plan: 'tier1',
            fullAccess: true,
            paymentType: 'one_time',
            stripePaymentIntentId: paymentIntent.id,
            activatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, {
            subscription: subscriptionData,
            updatedAt: new Date(),
          });

          console.log('✅ One-time payment processed for user:', userId);
        } else {
          console.log('ℹ️ No user ID in payment intent metadata');
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
            
            const subscriptionData = {
              status: 'active',
              fullAccess: true,
              lastPayment: new Date().toISOString(),
              stripeInvoiceId: invoice.id,
              updatedAt: new Date().toISOString(),
            };

            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, {
              subscription: subscriptionData,
              updatedAt: new Date(),
            });
            
            console.log(`✅ Subscription renewed for user ${userId}`);
          } else if (customer.email) {
            // Try to match by email for payment link subscriptions
            const subscriptionData = {
              status: 'active',
              fullAccess: true,
              lastPayment: new Date().toISOString(),
              stripeInvoiceId: invoice.id,
              updatedAt: new Date().toISOString(),
            };

            await updateUserByEmail(customer.email, subscriptionData);
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
          
          const subscriptionData = {
            status: 'past_due',
            lastFailedPayment: new Date().toISOString(),
            stripeInvoiceId: invoice.id,
            updatedAt: new Date().toISOString(),
          };

          if (customer.metadata && customer.metadata.userId) {
            const userDocRef = doc(db, 'users', customer.metadata.userId);
            await updateDoc(userDocRef, {
              subscription: subscriptionData,
              updatedAt: new Date(),
            });
          } else if (customer.email) {
            await updateUserByEmail(customer.email, subscriptionData);
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('🗑️ Subscription canceled:', subscription.id);

        const customer = await stripe.customers.retrieve(subscription.customer);
        
        const subscriptionData = {
          status: 'canceled',
          fullAccess: false,
          canceledAt: new Date().toISOString(),
          stripeSubscriptionId: subscription.id,
          updatedAt: new Date().toISOString(),
        };

        if (customer.metadata && customer.metadata.userId) {
          const userDocRef = doc(db, 'users', customer.metadata.userId);
          await updateDoc(userDocRef, {
            subscription: subscriptionData,
            updatedAt: new Date(),
          });
        } else if (customer.email) {
          await updateUserByEmail(customer.email, subscriptionData);
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