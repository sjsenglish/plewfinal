// Updated SubscriptionPlansPage.js - Trial plan removed, additional info section removed
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { createCheckoutSession } from '../services/checkoutService';
import { usePaywall } from '../hooks/usePaywall';

const SubscriptionPlansPage = () => {
  const [loading, setLoading] = useState({ study: false, pro: false });
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  const {
    subscription,
    usage,
    loading: paywallLoading,
    getPlanInfo,
    isLoggedIn,
    isPaidUser,
  } = usePaywall();

  const planInfo = getPlanInfo();

  // Updated plan configurations - trial removed
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Unlimited daily search',
        '1 video solution per day',
      ],
      buttonText: 'Current Plan',
      popular: false,
      current: !isPaidUser
    },
    {
      id: 'study',
      name: 'Monthly Plan',
      price: 20,
      period: 'month',
      priceId: process.env.REACT_APP_STRIPE_STUDY_PLAN_PRICE_ID,
      description: 'Everything you need for exam prep',
      features: [
        'Unlimited daily search',
        'Unlimited video solutions',
        'Unlimited question packs',
        'Practice mode with timer',
        'Priority community support',
        'Workshop access',
        'Weekly quizzes',
      ],
      buttonText: 'Upgrade Now',
      current: subscription?.plan === 'study'
    },
    {
      id: 'pro',
      name: 'Full Access 2025',
      price: 50,
      period: 'one-time until end of 2025',
      priceId: process.env.REACT_APP_STRIPE_PRO_PLAN_PRICE_ID,
      description: 'Same features, one payment until end of 2025',
      features: [
        'Everything in the monthly plan',
        'Interview prep',
        'Personal statement support',
      ],
      buttonText: 'Get Full Access',
      popular: false,
      current: subscription?.plan === 'pro',
    }
  ];

  const handleUpgrade = async (plan) => {
    if (!user) {
      alert('Please log in to upgrade your plan');
      return;
    }

    if (plan.id === 'free') return;

    setLoading(prev => ({ ...prev, [plan.id]: true }));
    setSelectedPlan(plan.id);

    try {
      const result = await createCheckoutSession(
        plan.priceId,
        user.uid,
        user.email,
        false // No trial flag needed anymore
      );

      if (!result.success) {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [plan.id]: false }));
      setSelectedPlan(null);
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `£${price}`;
  };

  if (paywallLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      {/* Header */}
      <div className="header-section">
        <div className="header-background"></div>
        <div className="header-content">
          <h1 className="header-title">Choose Your Plan</h1>
          <p className="header-subtitle">
            Unlock everything you need for successful university admissions prep
          </p>
        </div>
      </div>

      <div className="main-content">
        {/* Login Notice */}
        {!isLoggedIn && (
          <div className="login-notice">
            <div className="login-notice-content">
              <div className="warning-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="login-notice-text">
                <strong>Note:</strong> You'll need to{' '}
                <a href="/login" className="login-link">log in</a>{' '}
                to subscribe to a plan.
              </p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.popular ? 'plan-popular' : ''} ${plan.current ? 'plan-current' : ''}`}
            >
              {/* Badges */}

              {/* Current Badge */}
              {plan.current && (
                <div className="badge-current">Current</div>
              )}

              <div className="plan-content">
                {/* Plan Header */}
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-description">{plan.description}</p>
                  <div className="price-container">
                    <span className={`price ${plan.popular ? 'price-popular' : ''}`}>
                      {formatPrice(plan.price)}
                    </span>
                    {plan.period && (
                      <span className="price-period">
                        {plan.period === 'one-time until end of 2025' ? 'one-time' : `/${plan.period}`}
                      </span>
                    )}
                  </div>
                  {plan.period === 'one-time until end of 2025' && (
                    <p className="access-period">Access until Dec 31, 2025</p>
                  )}
                </div>

                {/* Features */}
                <div className="features-section">
                  <h4 className="features-title">What's included:</h4>
                  <ul className="features-list">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="feature-item">
                        <svg className="feature-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="feature-text">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading[plan.id] || plan.current || (plan.id !== 'free' && !isLoggedIn)}
                  className={`plan-button ${
                    plan.current ? 'button-current' : 
                    plan.id === 'free' ? 'button-free' : 'button-default'
                  } ${
                    (loading[plan.id] || (plan.id !== 'free' && !isLoggedIn)) && !plan.current ? 'button-disabled' : ''
                  }`}
                >
                  {loading[plan.id] ? (
                    <div className="button-loading">
                      <div className="button-spinner"></div>
                      <span>Processing...</span>
                    </div>
                  ) : plan.current ? (
                    '✓ Current Plan'
                  ) : plan.id === 'free' ? (
                    'Free Forever'
                  ) : !isLoggedIn ? (
                    'Log in to Subscribe'
                  ) : (
                    plan.buttonText
                  )}
                </button>

                {/* Payment Info */}
                {plan.id !== 'free' && (
                  <div className="payment-info">
                    <p className="payment-text">
                      Secure payment by Stripe<br/>
                      {plan.id === 'study' ? 'Cancel anytime • ' : ''}
                      30-day money-back guarantee
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;