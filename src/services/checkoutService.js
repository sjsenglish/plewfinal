// src/services/checkoutService.js - Programmatic checkout service
import { getAuth } from 'firebase/auth';

// Create checkout session for tier1 subscription
export const createCheckoutSession = async () => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User must be logged in to subscribe');
    }

    console.log('🛒 Starting checkout for user:', currentUser.uid);

    // Call backend API to create checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: currentUser.uid,
        userEmail: currentUser.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const session = await response.json();
    console.log('✅ Checkout session created:', session.id);

    // Redirect to Stripe Checkout
    window.location.href = session.url;

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Handle successful payment (backup method - webhook handles this)
export const handleSuccessfulPayment = async (sessionId) => {
  try {
    console.log('🎉 Payment successful, session ID:', sessionId);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // The webhook should handle subscription activation
    // This is just for user feedback
    console.log('ℹ️ Webhook should have processed this payment');

    return { success: true };
  } catch (error) {
    console.error('❌ Error handling successful payment:', error);
    return { success: false, error: error.message };
  }
};