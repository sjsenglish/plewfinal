// Script to add discord@examrizz.com as an admin with full access
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = 'discord@examrizz.com';
const ADMIN_PASSWORD = process.argv[2]; // Pass password as command line argument

async function createAdminUser() {
  if (!ADMIN_PASSWORD) {
    console.error('Please provide a password as a command line argument');
    console.log('Usage: node addAdminUser.js <password>');
    process.exit(1);
  }

  try {
    let userId;
    
    // Try to create the user first
    try {
      console.log('Creating new user account for:', ADMIN_EMAIL);
      const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      userId = userCredential.user.uid;
      console.log('✅ User account created successfully. User ID:', userId);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('User already exists, signing in to get user ID...');
        try {
          const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
          userId = userCredential.user.uid;
          console.log('✅ Signed in successfully. User ID:', userId);
        } catch (signInError) {
          console.error('❌ Could not sign in. Please check the password:', signInError.message);
          process.exit(1);
        }
      } else {
        throw error;
      }
    }

    // Create/Update the user document in Firestore with admin privileges and pro subscription
    const adminUserData = {
      email: ADMIN_EMAIL,
      displayName: 'Discord Admin',
      isAdmin: true, // Admin flag
      role: 'admin', // Additional role field
      subscription: {
        status: 'active',
        plan: 'pro', // Full pro access
        stripeSubscriptionId: 'admin_permanent', // Special admin subscription
        startDate: new Date(),
        endDate: new Date('2099-12-31'), // Far future date
        cancelledAt: null,
        features: ['all'], // Access to all features
      },
      usage: {
        questionsViewedToday: 0,
        questionPacksCreated: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        unlimitedAccess: true, // No usage limits for admin
      },
      permissions: {
        canAccessAllContent: true,
        canManageUsers: true,
        canUploadQuestions: true,
        canModerateContent: true,
        bypassPaywall: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      accountType: 'admin',
      notes: 'Admin account with full access to all paid features',
    };

    console.log('Setting up admin privileges in Firestore...');
    await setDoc(doc(db, 'users', userId), adminUserData);
    
    console.log('✅ Successfully added', ADMIN_EMAIL, 'as an admin with full access!');
    console.log('\nAdmin account details:');
    console.log('- Email:', ADMIN_EMAIL);
    console.log('- User ID:', userId);
    console.log('- Role: Admin');
    console.log('- Subscription: Pro (permanent)');
    console.log('- Features: All features unlocked');
    console.log('- Usage limits: None (unlimited access)');
    console.log('\n📝 Note: The user can now log in with the provided credentials and will have:');
    console.log('   - Access to all paid features');
    console.log('   - Admin privileges');
    console.log('   - No usage restrictions');
    console.log('   - Access to admin panel at /admin/questions');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();