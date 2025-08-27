// src/hooks/usePaywall.js - Updated without trial support
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  getUserSubscription,
  hasFeatureAccess,
  checkUsageLimit,
  cancelUserSubscription,
} from '../services/subscriptionService';

export const usePaywall = () => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  // Load user subscription data
  const loadSubscriptionData = async () => {
    if (!user) {
      setSubscription({ status: 'free', plan: null });
      setUsage({ questionsViewedToday: 0, questionPacksCreated: 0 });
      setLoading(false);
      return;
    }

    try {
      const result = await getUserSubscription(user.uid);

      if (result.success) {
        // Check if user is an admin
        if (result.isAdmin || result.role === 'admin') {
          // Admin users get full access
          setSubscription({ 
            status: 'active', 
            plan: 'pro',
            isAdmin: true,
            stripeSubscriptionId: 'admin_permanent'
          });
          setUsage({ 
            questionsViewedToday: 0, 
            questionPacksCreated: 0,
            unlimitedAccess: true 
          });
        } else {
          setSubscription(result.subscription);
          setUsage(result.usage);
        }
      } else {
        console.error('Error loading subscription:', result.error);
        // Set defaults on error
        setSubscription({ status: 'free', plan: null });
        setUsage({ questionsViewedToday: 0, questionPacksCreated: 0 });
        setError(result.error);
      }
    } catch (err) {
      console.error('Error in loadSubscriptionData:', err);
      setSubscription({ status: 'free', plan: null });
      setUsage({ questionsViewedToday: 0, questionPacksCreated: 0 });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [user]);

  // Check if user has access to a specific feature
  const checkFeatureAccess = (feature) => {
    if (!subscription) return false;
    return hasFeatureAccess(subscription, feature);
  };

  // Check usage limits for free users
  const checkUsage = async (feature) => {
    if (!user) return { allowed: false, reason: 'Please log in' };

    try {
      const result = await checkUsageLimit(user.uid, feature);
      return result;
    } catch (error) {
      console.error('Error checking usage:', error);
      return { allowed: false, reason: 'Error checking usage' };
    }
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

  // Get user's plan info - updated without trial
  const getPlanInfo = () => {
    if (!subscription) return { name: 'Free', isPaid: false };

    switch (subscription.plan) {
      case 'study':
        return { name: 'Monthly Plan', isPaid: true };
      case 'pro':
        return { name: 'Full Access 2025', isPaid: true };
      default:
        return { name: 'Free', isPaid: false };
    }
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
    isPaidUser: subscription?.status === 'active',
    // Helper function to refresh data
    refreshSubscription: loadSubscriptionData,
  };
};