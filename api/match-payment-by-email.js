// /api/match-payment-by-email.js - Match Firebase users to Stripe payments by email
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { email, planType = 'tier1' } = req.body;

    console.log('🔍 Matching payment by email:', email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email in Firebase
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No user found with email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the first matching user
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log('✅ Found user:', userId, 'for email:', email);

    // Update user subscription
    const subscriptionData = {
      status: 'active',
      plan: planType,
      fullAccess: true,
      paymentType: 'stripe_link',
      activatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activatedByEmail: true,
    };

    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      subscription: subscriptionData,
      updatedAt: new Date(),
    });

    console.log('✅ Subscription activated for user:', userId);

    res.status(200).json({
      success: true,
      userId: userId,
      message: 'Subscription activated successfully',
    });

  } catch (error) {
    console.error('❌ Error matching payment by email:', error);
    res.status(500).json({ 
      error: 'Failed to match payment',
      details: error.message 
    });
  }
}