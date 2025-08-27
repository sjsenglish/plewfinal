// components/SubscriptionPlansModal.js - Updated without trial plan
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { createCheckoutSession } from '../services/checkoutService';
import { usePaywall } from '../hooks/usePaywall';

const SubscriptionPlansModal = ({ onClose }) => {
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
      id: 'study',
      name: 'Monthly Plan',
      price: 20,
      period: 'month',
      priceId: process.env.REACT_APP_STRIPE_STUDY_PLAN_PRICE_ID,
      features: [
        'Unlimited daily search',
        'Unlimited video solutions',
        'Unlimited question packs',
        'Practice mode with timer',
        'Priority community support',
        'Workshop access',
        'Weekly quizzes',
      ],
      buttonText: 'Choose Monthly Plan',
      popular: true, // Made monthly plan popular
      current: subscription?.plan === 'study'
    },
    {
      id: 'pro',
      name: 'Full Access 2025',
      price: 50,
      period: 'one-time until end of 2025',
      priceId: process.env.REACT_APP_STRIPE_PRO_PLAN_PRICE_ID,
      features: [
        'Everything in the monthly plan',
        'Access until December 31, 2025',
        'Best for 2026 university applicants',
        'No recurring payments',
      ],
      buttonText: 'Get Full Access',
      popular: false,
      current: subscription?.plan === 'pro'
    }
  ];

  const handleUpgrade = async (plan) => {
    if (!user) {
      alert('Please log in to upgrade your plan');
      return;
    }

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
      // Note: If successful, user will be redirected to Stripe
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
      <div style={{ 
        padding: '3rem',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
          <p style={{ color: '#64748b' }}>Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Modal Header */}
      <div style={{
        padding: '2rem 2rem 1rem 2rem',
        borderBottom: '1px solid #e5e7eb',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f3f4f6';
            e.target.style.color = '#6b7280';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#9ca3af';
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            marginBottom: '0.5rem',
            color: '#1f2937'
          }}>
            Choose Your Plan
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            Unlock everything you need for successful university admissions prep
          </p>
          
          {isLoggedIn && (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'inline-block'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                Current Plan
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                {planInfo.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{ 
        padding: '2rem',
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem'
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: plan.popular ? '2px solid #6366f1' : plan.current ? '2px solid #10b981' : '1px solid #e5e7eb',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#6366f1',
                color: 'white',
                padding: '0.25rem 1rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                POPULAR
              </div>
            )}

            {/* Current plan badge */}
            {plan.current && (
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '1rem',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                CURRENT
              </div>
            )}

            {/* Plan header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#1f2937',
                marginBottom: '0.5rem'
              }}>
                {plan.name}
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '800', 
                  color: plan.popular ? '#6366f1' : '#1f2937'
                }}>
                  {formatPrice(plan.price)}
                </span>
                {plan.period && (
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    marginTop: '0.25rem'
                  }}>
                    {plan.period === 'one-time until end of 2025' ? 'one-time payment' : `/${plan.period}`}
                  </div>
                )}
              </div>
              {plan.period === 'one-time until end of 2025' && (
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#6366f1',
                  fontWeight: '600',
                  margin: 0
                }}>
                  Access until Dec 31, 2025
                </p>
              )}
            </div>

            {/* Features list */}
            <div style={{ marginBottom: '1.5rem' }}>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                display: 'grid',
                gap: '0.5rem'
              }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.5rem'
                  }}>
                    <span style={{ 
                      color: '#10b981', 
                      fontSize: '1rem',
                      marginTop: '2px',
                      flexShrink: 0
                    }}>
                      ✓
                    </span>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#374151',
                      lineHeight: '1.4'
                    }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action button */}
            <button
              onClick={() => handleUpgrade(plan)}
              disabled={loading[plan.id] || plan.current || !isLoggedIn}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: plan.current 
                  ? '#10b981' 
                  : plan.popular 
                    ? '#6366f1' 
                    : '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: (loading[plan.id] || plan.current || !isLoggedIn) 
                  ? 'not-allowed' 
                  : 'pointer',
                transition: 'all 0.2s ease',
                opacity: (loading[plan.id] || plan.current || !isLoggedIn) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!plan.current && !loading[plan.id] && isLoggedIn) {
                  if (plan.popular) {
                    e.target.style.backgroundColor = '#5856eb';
                  } else {
                    e.target.style.backgroundColor = '#111827';
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!plan.current && !loading[plan.id]) {
                  if (plan.popular) {
                    e.target.style.backgroundColor = '#6366f1';
                  } else {
                    e.target.style.backgroundColor = '#1f2937';
                  }
                }
              }}
            >
              {loading[plan.id] ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Processing...
                </>
              ) : plan.current ? (
                '✓ Current Plan'
              ) : !isLoggedIn ? (
                'Log in Required'
              ) : (
                plan.buttonText
              )}
            </button>

            {/* Additional info */}
            <div style={{ 
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#9ca3af',
                margin: 0,
                lineHeight: '1.3'
              }}>
                Secure payment by Stripe<br/>
                {plan.id === 'study' ? 'Cancel anytime • ' : ''}
                30-day money-back guarantee
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem 2rem 2rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280',
          margin: 0
        }}>
          Questions? Email us at{' '}
          <a 
            href="mailto:team@examrizzsearch.com"
            style={{ color: '#6366f1', textDecoration: 'none' }}
          >
            team@examrizzsearch.com
          </a>
        </p>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPlansModal;