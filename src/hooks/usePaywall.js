// src/hooks/usePaywall.js - Updated without trial support
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  cancelUserSubscription,
} from '../services/subscriptionService';

export const usePaywall = () => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  // Load user subscription data - PAYWALL REMOVED: Everyone gets full access
  const loadSubscriptionData = async () => {
    // PAYWALL REMOVED: All users now get full access regardless of subscription status
    setSubscription({ 
      status: 'active', 
      plan: 'pro',
      paywall_removed: true,
      fullAccess: true
    });
    setUsage({ 
      questionsViewedToday: 0, 
      questionPacksCreated: 0,
      unlimitedAccess: true 
    });
    setLoading(false);
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [user]);

  // Check if user has access to a specific feature - PAYWALL REMOVED: Always true
  const checkFeatureAccess = (feature) => {
    // All users now have access to all features - paywall removed
    return true;
  };

  // Check usage limits for free users - PAYWALL REMOVED: Always allowed
  const checkUsage = async (feature) => {
    // All users now have unlimited usage - paywall removed
    return { allowed: true, unlimited: true, reason: 'Full access enabled' };
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

  // Get user's plan info - PAYWALL REMOVED: Everyone has full access
  const getPlanInfo = () => {
    // All users now have full access - paywall removed
    return { name: 'Full Access (Free)', isPaid: true, paywallRemoved: true };
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
    isPaidUser: true, // Everyone now has paid user access
    // Helper function to refresh data
    refreshSubscription: loadSubscriptionData,
  };
};