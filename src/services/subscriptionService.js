// src/services/subscriptionService.js
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

// Get user's subscription status
export const getUserSubscription = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log('Raw Firestore userData:', userData);
      console.log('Raw subscription data from Firestore:', userData.subscription);
      
      if (userData.subscription) {
        console.log('Subscription fields:', Object.keys(userData.subscription));
        console.log('stripeSubscriptionId:', userData.subscription.stripeSubscriptionId);
        console.log('subscriptionId:', userData.subscription.subscriptionId);
      }
      
      // Ensure fullAccess is set correctly for active subscriptions
      const subscription = userData.subscription || { status: 'free', plan: null };
      if (subscription.status === 'active' && !subscription.fullAccess) {
        subscription.fullAccess = true;
      }
      
      return {
        success: true,
        subscription: subscription,
        usage: userData.usage || { questionsViewedToday: 0, questionPacksCreated: 0 },
        isAdmin: userData.isAdmin || false,
        role: userData.role || 'user',
      };
    } else {
      // Create a new user document with default values
      const defaultUserData = {
        subscription: { status: 'free', plan: null },
        usage: { 
          questionsViewedToday: 0, 
          questionPacksCreated: 0,
          lastResetDate: new Date().toISOString().split('T')[0]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(userDocRef, defaultUserData);
      
      return {
        success: true,
        subscription: defaultUserData.subscription,
        usage: defaultUserData.usage,
      };
    }
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return { success: false, error: error.message };
  }
};

// Update user's subscription status
export const updateUserSubscription = async (userId, subscriptionData) => {
  try {
    const userDocRef = doc(db, 'users', userId);

    await updateDoc(userDocRef, {
      subscription: subscriptionData,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: error.message };
  }
};

// Set admin status for a user
export const setUserAdminStatus = async (userId, isAdmin = true, role = 'admin') => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    // Get existing user data first
    const docSnap = await getDoc(userDocRef);
    const userData = docSnap.exists() ? docSnap.data() : {};
    
    // Update admin status and give full subscription access
    const updateData = {
      isAdmin: isAdmin,
      role: role,
      subscription: {
        ...userData.subscription,
        status: 'active',
        plan: 'admin',
        fullAccess: true,
        paymentType: 'admin_grant'
      },
      updatedAt: new Date(),
    };
    
    // If user doesn't exist, create with default data
    if (!docSnap.exists()) {
      updateData.createdAt = new Date();
      updateData.usage = { 
        questionsViewedToday: 0, 
        questionPacksCreated: 0,
        lastResetDate: new Date().toISOString().split('T')[0]
      };
      await setDoc(userDocRef, updateData);
    } else {
      await updateDoc(userDocRef, updateData);
    }

    console.log(`Admin status ${isAdmin ? 'granted' : 'revoked'} for user:`, userId);
    return { success: true };
  } catch (error) {
    console.error('Error setting admin status:', error);
    return { success: false, error: error.message };
  }
};

// Cancel user subscription
export const cancelUserSubscription = async (userId, stripeSubscriptionId) => {
  try {
    console.log('cancelUserSubscription called with:', { userId, stripeSubscriptionId });
    
    if (!userId || !stripeSubscriptionId) {
      console.error('Missing parameters for cancel subscription:', { userId: !!userId, stripeSubscriptionId: !!stripeSubscriptionId });
      throw new Error('Missing required parameters for cancellation');
    }
    
    // Validate that stripeSubscriptionId looks like a Stripe subscription ID
    if (!stripeSubscriptionId.startsWith('sub_')) {
      console.error('Invalid Stripe subscription ID format:', stripeSubscriptionId);
      throw new Error('Invalid subscription ID format. Expected Stripe subscription ID starting with "sub_".');
    }
    
    // Call your backend API to cancel the subscription in Stripe
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if you need it
        // 'Authorization': `Bearer ${await getAuth().currentUser.getIdToken()}`
      },
      body: JSON.stringify({
        userId,
        subscriptionId: stripeSubscriptionId
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to cancel subscription');
    }

    // Update local Firestore record
    await updateUserSubscription(userId, {
      status: 'cancelled',
      plan: null,
      stripeSubscriptionId: null,
      cancelledAt: new Date(),
      endDate: new Date() // Immediate cancellation
    });

    return {
      success: true,
      message: 'Subscription cancelled successfully'
    };
    
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check if user has access to a feature - PAYWALL REMOVED: All users have full access
export const hasFeatureAccess = (subscription, feature) => {
  // All users now have access to all features - paywall removed
  return true;
};

// Check daily usage limits for free users - PAYWALL REMOVED: No usage limits
export const checkUsageLimit = async (userId, feature) => {
  // All users now have unlimited usage - paywall removed
  return { success: true, allowed: true, unlimited: true };
};

// Increment usage counter
export const incrementUsage = async (userId, feature) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      // Create user document first
      const defaultUserData = {
        subscription: { status: 'free', plan: null },
        usage: { 
          questionsViewedToday: 0, 
          questionPacksCreated: 0,
          lastResetDate: new Date().toISOString().split('T')[0]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(userDocRef, defaultUserData);
    }

    const userData = docSnap.exists() ? docSnap.data() : {};
    const usage = userData.usage || {};

    switch (feature) {
      case 'view_question':
        await updateDoc(userDocRef, {
          'usage.questionsViewedToday': (usage.questionsViewedToday || 0) + 1,
          updatedAt: new Date(),
        });
        break;
      case 'create_question_pack':
        await updateDoc(userDocRef, {
          'usage.questionPacksCreated': (usage.questionPacksCreated || 0) + 1,
          updatedAt: new Date(),
        });
        break;
    }

    return { success: true };
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return { success: false, error: error.message };
  }
};