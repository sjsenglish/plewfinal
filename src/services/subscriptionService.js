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
      
      return {
        success: true,
        subscription: userData.subscription || { status: 'free', plan: null },
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

// Check if user has access to a feature
export const hasFeatureAccess = (subscription, feature) => {
  const { status, plan, isAdmin } = subscription;

  // Admin users have access to everything
  if (isAdmin) {
    return true;
  }

  // Free users
  if (status === 'free' || !status || status === 'cancelled') {
    switch (feature) {
      case 'basic_search':
      case 'community':
      case 'application_builder': // Now available to all users
      case 'study_buddy': // Now available to all users
        return true;
      case 'view_answers':
      case 'create_question_packs':
      case 'video_solutions':
      case 'pdf_export':
      case 'practice_mode':
        return false;
      default:
        return false;
    }
  }

  // Trial and Paid users (active subscription)
  if (status === 'active') {
    switch (feature) {
      case 'basic_search':
      case 'community':
      case 'view_answers':
      case 'video_solutions':
      case 'study_buddy':
      case 'application_builder':
        return true;
      case 'create_question_packs':
        return plan === 'study' || plan === 'pro' || plan === 'trial';
      case 'pdf_export':
      case 'practice_mode':
        return plan === 'pro' || plan === 'trial';
      default:
        return false;
    }
  }

  // Canceled or past due users (same as free)
  return false;
};

// Check daily usage limits for free users
export const checkUsageLimit = async (userId, feature) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      // Create new user document with default usage
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
      
      // New users start with full limits available
      switch (feature) {
        case 'view_question':
          return {
            success: true,
            allowed: true,
            current: 0,
            limit: 5,
          };
        case 'create_question_pack':
          return {
            success: true,
            allowed: true,
            current: 0,
            limit: 1,
          };
        default:
          return { success: true, allowed: true };
      }
    }

    const userData = docSnap.data();
    const usage = userData.usage || {};
    const subscription = userData.subscription || {};

    // If user is admin or has paid subscription, no limits
    if (userData.isAdmin || subscription.status === 'active') {
      return { success: true, allowed: true };
    }

    // Check if we need to reset daily counter
    const today = new Date().toISOString().split('T')[0];
    if (usage.lastResetDate !== today) {
      // Reset daily counters
      await updateDoc(userDocRef, {
        'usage.questionsViewedToday': 0,
        'usage.lastResetDate': today,
        updatedAt: new Date(),
      });
      
      // After reset, limits are available
      switch (feature) {
        case 'view_question':
          return {
            success: true,
            allowed: true,
            current: 0,
            limit: 5,
          };
        case 'create_question_pack':
          return {
            success: true,
            allowed: (usage.questionPacksCreated || 0) < 1,
            current: usage.questionPacksCreated || 0,
            limit: 1,
          };
        default:
          return { success: true, allowed: true };
      }
    }

    // Check specific limits
    switch (feature) {
      case 'view_question':
        return {
          success: true,
          allowed: (usage.questionsViewedToday || 0) < 5,
          current: usage.questionsViewedToday || 0,
          limit: 5,
        };
      case 'create_question_pack':
        return {
          success: true,
          allowed: (usage.questionPacksCreated || 0) < 1,
          current: usage.questionPacksCreated || 0,
          limit: 1,
        };
      default:
        return { success: true, allowed: true };
    }
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { success: false, error: error.message };
  }
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