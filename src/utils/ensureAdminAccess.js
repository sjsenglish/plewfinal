// Utility to ensure admin users have proper access in Firebase
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ADMIN_EMAILS = [
  'sjahn101@gmail.com'
];

export const ensureAdminAccess = async (user) => {
  if (!user || !user.email) return;
  
  // Check if user's email is in admin list
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return;
  }
  
  try {
    // Check if user document exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check if already has admin access
      if (userData.isAdmin && userData.subscription?.status === 'active') {
        console.log('User already has admin access');
        return;
      }
      
      // Update to grant admin access
      await updateDoc(userDocRef, {
        isAdmin: true,
        role: 'admin',
        subscription: {
          ...userData.subscription,
          status: 'active',
          plan: 'admin',
          fullAccess: true,
          paymentType: 'admin_grant'
        },
        updatedAt: new Date()
      });
      
      console.log('Admin access granted to:', user.email);
    } else {
      // Create new user document with admin access
      await setDoc(userDocRef, {
        email: user.email,
        isAdmin: true,
        role: 'admin',
        subscription: {
          status: 'active',
          plan: 'admin',
          fullAccess: true,
          paymentType: 'admin_grant',
          activatedAt: new Date().toISOString()
        },
        usage: {
          questionsViewedToday: 0,
          questionPacksCreated: 0,
          unlimitedAccess: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Admin user document created for:', user.email);
    }
  } catch (error) {
    console.error('Error ensuring admin access:', error);
  }
};