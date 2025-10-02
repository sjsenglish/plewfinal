// src/hooks/usePaywall.js - Freemium model implementation
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  cancelUserSubscription,
  getUserSubscription
} from '../services/subscriptionService';
import { isAdminEmail } from '../utils/setupAdmin';

export const usePaywall = () => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  // Load user subscription data - Freemium model
  const loadSubscriptionData = async () => {
    setLoading(true);
    
    if (!user) {
      // Not logged in - can view interface but can't interact
      setSubscription({ 
        status: 'none', 
        plan: 'guest',
        fullAccess: false,
        isAdmin: false
      });
      setUsage({ 
        questionsViewedToday: 0, 
        questionPacksCreated: 0,
        unlimitedAccess: false 
      });
      setLoading(false);
      return;
    }

    try {
      // Check for admin email first
      const isAdminUser = isAdminEmail(user.email);
      
      console.log('Checking admin status for:', user.email);
      console.log('Is admin email?:', isAdminUser);
      
      // Get actual subscription data for logged in users
      const response = await getUserSubscription(user.uid);
      
      if (isAdminUser) {
        // Admin user gets full access regardless of subscription
        console.log('Granting admin access to:', user.email);
        setSubscription({
          status: 'active',
          plan: 'admin',
          fullAccess: true,
          isAdmin: true,
          role: 'admin'
        });
        setUsage({ 
          questionsViewedToday: 0, 
          questionPacksCreated: 0,
          unlimitedAccess: true 
        });
      } else if (response && response.success) {
        // Extract the actual subscription data from the response
        const subscriptionData = response.subscription;
        const isAdmin = response.isAdmin || false;
        
        console.log('Subscription data from Firebase:', {
          status: subscriptionData?.status,
          plan: subscriptionData?.plan,
          fullAccess: subscriptionData?.fullAccess,
          isAdmin: isAdmin
        });
        
        // Check if user has an active subscription
        if (subscriptionData && subscriptionData.status === 'active') {
          console.log('User has active subscription - granting full access');
          setSubscription({
            ...subscriptionData,
            fullAccess: true,
            isAdmin: isAdmin
          });
          setUsage({ 
            questionsViewedToday: 0, 
            questionPacksCreated: 0,
            unlimitedAccess: true 
          });
        } else if (isAdmin) {
          // Admin user detected through database
          setSubscription({
            status: 'active',
            plan: 'admin',
            fullAccess: true,
            isAdmin: true,
            role: response.role || 'admin'
          });
          setUsage({ 
            questionsViewedToday: 0, 
            questionPacksCreated: 0,
            unlimitedAccess: true 
          });
        } else {
          // Logged in but no active subscription - can interact with limited features
          setSubscription({ 
            status: subscriptionData?.status || 'inactive', 
            plan: subscriptionData?.plan || 'free',
            fullAccess: false,
            isAdmin: false,
            ...subscriptionData // Include any other subscription fields
          });
          setUsage({ 
            questionsViewedToday: response.usage?.questionsViewedToday || 0, 
            questionPacksCreated: response.usage?.questionPacksCreated || 0,
            unlimitedAccess: false 
          });
        }
      } else {
        // Logged in but no active subscription - can interact with limited features
        setSubscription({ 
          status: 'inactive', 
          plan: 'free',
          fullAccess: false,
          isAdmin: false
        });
        setUsage({ 
          questionsViewedToday: 0, 
          questionPacksCreated: 0,
          unlimitedAccess: false 
        });
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setSubscription({ 
        status: 'inactive', 
        plan: 'free',
        fullAccess: false,
        isAdmin: false
      });
      setUsage({ 
        questionsViewedToday: 0, 
        questionPacksCreated: 0,
        unlimitedAccess: false 
      });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [user]);
  
  // Add an interval to refresh subscription data periodically
  useEffect(() => {
    if (!user) return;
    
    // Refresh subscription status every 30 seconds when user is logged in
    const interval = setInterval(() => {
      console.log('Refreshing subscription status...');
      loadSubscriptionData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  // Check if user has access to a specific feature
  const checkFeatureAccess = (feature) => {
    if (!subscription) return false;
    
    // Full access for paid subscribers
    if (subscription.fullAccess) return true;
    
    // Define what guests (not logged in) can do
    const guestFeatures = ['view_interface', 'see_filters', 'browse_pages'];
    
    // Define what free users (logged in but no subscription) can do
    const freeFeatures = [...guestFeatures, 'basic_interaction'];
    
    if (subscription.plan === 'guest') {
      return guestFeatures.includes(feature);
    }
    
    if (subscription.plan === 'free') {
      return freeFeatures.includes(feature);
    }
    
    return false;
  };

  // Check usage limits for users
  const checkUsage = async (feature) => {
    if (!subscription) {
      return { allowed: false, unlimited: false, reason: 'No subscription data' };
    }
    
    // Full access for paid subscribers
    if (subscription.fullAccess) {
      return { allowed: true, unlimited: true, reason: 'Full subscription access' };
    }
    
    // Special handling for video solutions - guests get 1 per day
    if (feature === 'video_solutions') {
      if (subscription.plan === 'guest') {
        return { allowed: true, unlimited: false, reason: 'Limited daily access' };
      }
      return { 
        allowed: false, 
        unlimited: false, 
        reason: 'Subscription required' 
      };
    }
    
    // Block other interactive features for non-subscribers
    const blockedFeatures = [
      'video_playback', 'video_playbook', 'dashboard_tabs', 'question_results', 'vocabulary_test', 
      'community_submit', 'search_functionality', 'question_interaction'
    ];
    
    if (blockedFeatures.includes(feature)) {
      return { 
        allowed: false, 
        unlimited: false, 
        reason: subscription.plan === 'guest' ? 'Sign up required' : 'Subscription required' 
      };
    }
    
    return { allowed: true, unlimited: false, reason: 'Basic access' };
  };

  // Cancel subscription function (for recurring subscriptions only)
  const cancelSubscription = async () => {
    if (!user || !subscription) {
      return { success: false, error: 'No active subscription to cancel' };
    }

    console.log('Cancel subscription - Current subscription data:', subscription);
    console.log('Available subscription fields:', Object.keys(subscription));
    
    // Check if this is a one-time payment (Pro plan) that can't be cancelled
    if (subscription.paymentType === 'one_time' || subscription.plan === 'pro') {
      return { 
        success: false, 
        error: 'This is a one-time payment plan that doesn\'t require cancellation. Your access will remain until the end of the current period.' 
      };
    }
    
    // Try different possible field names for the Stripe subscription ID
    const subscriptionId = subscription.stripeSubscriptionId || 
                          subscription.subscriptionId || 
                          subscription.id || 
                          subscription.stripe_subscription_id;
    
    console.log('Checking subscription fields:');
    console.log('- stripeSubscriptionId:', subscription.stripeSubscriptionId);
    console.log('- subscriptionId:', subscription.subscriptionId);
    console.log('- id:', subscription.id);
    console.log('- stripe_subscription_id:', subscription.stripe_subscription_id);
    console.log('- paymentType:', subscription.paymentType);
    console.log('- plan:', subscription.plan);
    console.log('Final subscriptionId found:', subscriptionId);
    
    if (!subscriptionId) {
      console.error('No Stripe subscription ID found in subscription object:', subscription);
      
      // Let's also try to get fresh subscription data in case it's stale
      console.log('Attempting to refresh subscription data...');
      await loadSubscriptionData();
      
      // Check if after refresh we still don't have a subscription ID but have a recurring subscription
      const refreshedSubscription = subscription;
      if (refreshedSubscription?.paymentType === 'recurring' || refreshedSubscription?.plan === 'study') {
        return { 
          success: false, 
          error: 'Unable to find subscription ID for your recurring subscription. Please contact support for assistance with cancellation.' 
        };
      } else {
        return { 
          success: false, 
          error: 'This subscription cannot be cancelled automatically. If you need assistance, please contact support.' 
        };
      }
    }

    try {
      const result = await cancelUserSubscription(user.uid, subscriptionId);
      
      if (result.success) {
        // Refresh subscription data after successful cancellation
        await loadSubscriptionData();
      }
      
      return result;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user's plan info
  const getPlanInfo = () => {
    if (!subscription) {
      return { name: 'Loading...', isPaid: false, isGuest: true };
    }
    
    if (subscription.plan === 'guest') {
      return { name: 'Guest', isPaid: false, isGuest: true };
    }
    
    if (subscription.plan === 'free') {
      return { name: 'Free Account', isPaid: false, isGuest: false };
    }
    
    return { 
      name: subscription.plan === 'pro' ? 'Pro Plan' : 'Paid Plan', 
      isPaid: true, 
      isGuest: false 
    };
  };

  return {
    subscription,
    usage,
    loading,
    error,
    checkFeatureAccess,
    checkUsage,
    cancelSubscription,
    getPlanInfo,
    isLoggedIn: !!user,
    isPaidUser: subscription?.fullAccess || false,
    isGuest: subscription?.plan === 'guest',
    isAdmin: subscription?.isAdmin || false,
    // Helper function to refresh data
    refreshSubscription: loadSubscriptionData,
  };
};