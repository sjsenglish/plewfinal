// src/contexts/StripeContext.js
import React, { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Load Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Create context
const StripeContext = createContext();

// Custom hook to use Stripe context
export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

// Stripe provider component
export const StripeProvider = ({ children }) => {
  const plans = {
    study: {
      name: 'Study Plan',
      price: '$9/month',
      priceId: process.env.REACT_APP_STRIPE_STUDY_PLAN_PRICE_ID,
      features: [
        'Unlimited question search',
        'View all answers',
        'Create up to 5 question packs',
        'Video solutions',
        'Community access',
      ],
    },
    pro: {
      name: 'Pro Plan',
      price: '$19/month',
      priceId: process.env.REACT_APP_STRIPE_PRO_PLAN_PRICE_ID,
      features: [
        'Everything in Study Plan',
        'Unlimited question packs',
        'PDF exports',
        'Practice mode with analytics',
        'Priority community support',
      ],
    },
  };

  const value = {
    plans,
    stripePromise,
  };

  return (
    <StripeContext.Provider value={value}>
      <Elements stripe={stripePromise}>{children}</Elements>
    </StripeContext.Provider>
  );
};