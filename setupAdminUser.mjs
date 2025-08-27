#!/usr/bin/env node

// Script to add discord@examrizz.com as an admin with full access
// Run with: node setupAdminUser.mjs <password>

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
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
    console.error('❌ Please provide a password as a command line argument');
    console.log('Usage: node setupAdminUser.mjs <password>');
    console.log('Example: node setupAdminUser.mjs MySecurePassword123!');
    process.exit(1);
  }

  console.log('🚀 Starting admin user setup for:', ADMIN_EMAIL);
  console.log('━'.repeat(50));

  try {
    let userId;
    
    // Try to create the user first
    try {
      console.log('📝 Creating new user account...');
      const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      userId = userCredential.user.uid;
      console.log('✅ User account created successfully');
      console.log('   User ID:', userId);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️  User already exists, signing in to get user ID...');
        try {
          const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
          userId = userCredential.user.uid;
          console.log('✅ Signed in successfully');
          console.log('   User ID:', userId);
        } catch (signInError) {
          console.error('❌ Could not sign in. Error:', signInError.message);
          console.log('\n💡 If you forgot the password, you can:');
          console.log('   1. Reset it via Firebase Console');
          console.log('   2. Delete the user and run this script again');
          process.exit(1);
        }
      } else if (error.code === 'auth/weak-password') {
        console.error('❌ Password is too weak. Please use a stronger password.');
        console.log('   Password must be at least 6 characters long.');
        process.exit(1);
      } else {
        console.error('❌ Error creating user:', error.message);
        throw error;
      }
    }

    // Create/Update the user document in Firestore with admin privileges
    console.log('\n📦 Setting up admin privileges in Firestore...');
    
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
        paymentType: 'admin', // Special payment type for admin
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

    await setDoc(doc(db, 'users', userId), adminUserData, { merge: true });
    
    console.log('✅ Admin privileges configured successfully!');
    console.log('\n' + '━'.repeat(50));
    console.log('🎉 SUCCESS! Admin account setup complete');
    console.log('━'.repeat(50));
    console.log('\n📋 Admin Account Details:');
    console.log('   Email: ' + ADMIN_EMAIL);
    console.log('   User ID: ' + userId);
    console.log('   Role: Admin');
    console.log('   Subscription: Pro (permanent)');
    console.log('   Features: All features unlocked');
    console.log('   Usage limits: None (unlimited access)');
    
    console.log('\n🔓 Access Details:');
    console.log('   ✓ All paid features unlocked');
    console.log('   ✓ Admin privileges granted');
    console.log('   ✓ No usage restrictions');
    console.log('   ✓ Access to admin panel at /admin/questions');
    console.log('   ✓ Can upload questions directly');
    console.log('   ✓ Bypass all paywalls');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Log in at your app with these credentials:');
    console.log('      Email: ' + ADMIN_EMAIL);
    console.log('      Password: [the password you provided]');
    console.log('   2. Visit /admin/questions to access the admin panel');
    console.log('   3. All premium features will be automatically available');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the script
console.log('🔧 ExamRizz Admin User Setup');
console.log('━'.repeat(50));
createAdminUser();