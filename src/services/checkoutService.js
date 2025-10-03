// src/services/checkoutService.js - Complete updated version
import { getAuth } from 'firebase/auth';

// Create checkout using Stripe Checkout Sessions
export const createCheckoutSession = async (priceId, userId, userEmail, isTrial = false) => {
  try {
    console.log('Starting checkout session for:', { priceId, userId, userEmail, isTrial });

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User must be logged in to purchase');
    }

    // Determine which plan based on price ID or trial flag
    let planType = 'tier1'; // Default to tier1 for the premium plan
    if (isTrial) {
      planType = 'trial';
    } else if (priceId === process.env.REACT_APP_STRIPE_PRO_PLAN_PRICE_ID) {
      planType = 'pro';
    } else if (priceId === 'price_1Rl7p3RslRN77kT81et1VUvh') {
      // Hardcoded tier1 price ID from SubscriptionPlans.js
      planType = 'tier1';
    } else if (priceId === process.env.REACT_APP_STRIPE_STUDY_PLAN_PRICE_ID) {
      planType = 'study';
    }

    console.log('🏷️ Plan detection:', { 
      priceId, 
      envProPriceId: process.env.REACT_APP_STRIPE_PRO_PLAN_PRICE_ID, 
      detectedPlanType: planType, 
      isTrial 
    });

    // Create checkout session via your backend API
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        planType: planType,
        isTrial: isTrial, // Pass trial flag to backend
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscription-plans`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Checkout session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Provide more specific error messages
      if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid payment information. Please check your details and try again.');
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please log in and try again.');
      } else if (response.status === 402) {
        throw new Error('Payment required. Please check your payment method and try again.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again in a few minutes.');
      } else {
        throw new Error(errorData.error || `Payment setup failed (${response.status}). Please try again.`);
      }
    }

    const session = await response.json();

    console.log('Checkout session created:', session.id);

    // Redirect to Stripe Checkout
    window.location.href = session.url;

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Handle successful payment (backup method - webhook should handle this)
export const handleSuccessfulPayment = async (sessionId) => {
  try {
    console.log('Payment successful, session ID:', sessionId);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // The webhook should handle subscription activation
    // This is just for user feedback
    console.log('Webhook should have processed this payment');

    // Show success message
    alert('🎉 Payment successful! Your subscription should be activated shortly.');

    // Redirect to profile after a delay
    setTimeout(() => {
      window.location.href = '/profile';
    }, 2000);

    return { success: true };
  } catch (error) {
    console.error('Error handling successful payment:', error);
    return { success: false, error: error.message };
  }
};