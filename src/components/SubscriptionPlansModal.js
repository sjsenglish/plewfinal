// components/SubscriptionPlansModal.js - Updated without trial plan
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { createCheckoutSession } from '../services/checkoutService';
import { usePaywall } from '../hooks/usePaywall';

const SubscriptionPlansModal = ({ onClose }) => {
  const [loading, setLoading] = useState({ tier1: false });
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

  // Premium plan configuration - matching SubscriptionPlansPage
  const plans = [
    {
      id: 'tier1',
      name: '프리미엄 멤버십',
      price: 20000,
      period: '월',
      priceId: 'price_1Rl7p3RslRN77kT81et1VUvh',
      paymentLink: 'https://buy.stripe.com/8x23cxcsjfHl2Lw08d8EM01',
      description: 'Everything you need for exam preparation',
      features: [
        '옥스포드 영어에서 독점 제작하는 프리미엄 독해 문제들을 무제한 검색할 수 있습니다.',
        '강의 시리즈와 문제 풀이 비디오들을 무제한 검색할 수 있습니다.',
        '다양한 필터를 이용해 필요한 문제지를 무제한 제작할 수 있습니다.',
        '단어 학습과 리딩의 연계를 통해 효율적인 단어 학습이 가능한 이노베이션 단어 은행을  제공합니다.',
        '실전 대비 타이머 시험을 이용할 수 있습니다. ',
        '학생들 간, 학생과  관리자 간 소통과 필요한 정보, 다양한 영어 관련 콘텐츠를 제공하는 커뮤니티를 운영하고 있습니다.',
        '자율적 학습에 익숙하지 않은 학생들은 학습 도우미를 활용할 수 있습니다.',
      ],
      buttonText: 'Start with Premium',
      popular: true,
      current: subscription?.plan === 'tier1'
    }
  ];

  const handleUpgrade = async (plan) => {
    if (!user) {
      alert('플랜 업그레이드를 하려면 로그인하세요');
      return;
    }

    setLoading(prev => ({ ...prev, [plan.id]: true }));
    setSelectedPlan(plan.id);

    try {
      // Use Stripe payment links for direct checkout
      window.open(plan.paymentLink, '_blank');
    } catch (error) {
      console.error('Error opening payment link:', error);
      alert('결제 페이지를 열 수 없습니다. 다시 시도해주세요.');
    } finally {
      setLoading(prev => ({ ...prev, [plan.id]: false }));
      setSelectedPlan(null);
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `₩${price.toLocaleString()}`;
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
          <p style={{ color: '#64748b' }}>플랜 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Modal Header */}
      <div style={{
        padding: '2rem 2rem 1rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        background: 'radial-gradient(circle at 50% 0%, rgba(88, 101, 242, 0.08) 0%, transparent 50%)'
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
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = 'rgba(255, 255, 255, 0.5)';
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '600', 
            marginBottom: '0.5rem',
            color: '#ffffff',
            letterSpacing: '-1px'
          }}>
            원하는 플랜을 골라 보세요
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '1rem'
          }}>
            무제한 검색 기능을 사용할 수 있습니다.
          </p>
          
          {isLoggedIn && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'inline-block'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>
                현재 플랜
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>
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
        {/* Free Plan */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '2rem',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: '0 0 0.5rem 0',
              color: '#ffffff'
            }}>
              무료 멤버십
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '0 0 1.5rem 0'
            }}>
              기본적인 검색 기능
            </p>
            
            <div style={{
              fontSize: '2.25rem',
              fontWeight: '600',
              marginBottom: '0.25rem',
              color: '#ffffff'
            }}>
              ₩0
              <span style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '400',
                marginLeft: '0.5rem'
              }}>
                /월
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <ul style={{
              margin: 0,
              padding: 0,
              listStyle: 'none'
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                인터페이스 보기 가능
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                필터 및 검색 UI 접근
              </li>
            </ul>
          </div>

          <button
            disabled
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'not-allowed'
            }}
          >
            Current plan
          </button>
        </div>

        {/* Premium Plans */}
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: 'rgba(88, 101, 242, 0.05)',
              borderRadius: '16px',
              padding: '2rem',
              border: '2px solid rgba(88, 101, 242, 0.3)',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '2rem',
                backgroundColor: '#5865f2',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                추천
              </div>
            )}

            {/* Current plan badge */}
            {plan.current && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                Active
              </div>
            )}

            {/* Plan header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#ffffff',
                marginBottom: '0.5rem'
              }}>
                {plan.name}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0 0 1.5rem 0'
              }}>
                {plan.description}
              </p>
              
              <div style={{
                fontSize: '2.25rem',
                fontWeight: '600',
                marginBottom: '0.25rem',
                color: '#ffffff'
              }}>
                {formatPrice(plan.price)}
                <span style={{
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '400',
                  marginLeft: '0.5rem'
                }}>
                  /{plan.period}
                </span>
              </div>
            </div>

            {/* Features list */}
            <div style={{ marginBottom: '2rem' }}>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0
              }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    padding: '0.5rem 0',
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#5865f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {feature}
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
                backgroundColor: plan.current ? 'rgba(16, 185, 129, 0.1)' : '#5865f2',
                color: plan.current ? '#10b981' : 'white',
                border: plan.current ? '1px solid rgba(16, 185, 129, 0.2)' : 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: (loading[plan.id] || plan.current || !isLoggedIn) ? 'not-allowed' : 'pointer',
                opacity: (loading[plan.id] || !isLoggedIn) && !plan.current ? 0.5 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!plan.current && !loading[plan.id] && isLoggedIn) {
                  e.target.style.backgroundColor = '#4752c4';
                }
              }}
              onMouseLeave={(e) => {
                if (!plan.current && !loading[plan.id] && isLoggedIn) {
                  e.target.style.backgroundColor = '#5865f2';
                }
              }}
            >
              {loading[plan.id] ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Processing...
                </span>
              ) : plan.current ? (
                'Current plan'
              ) : !isLoggedIn ? (
                'Sign in to subscribe'
              ) : (
                plan.buttonText
              )}
            </button>

            <p style={{
              fontSize: '0.6875rem',
              color: 'rgba(255, 255, 255, 0.3)',
              textAlign: 'center',
              marginTop: '0.75rem',
              margin: '0.75rem 0 0 0'
            }}>
              Secure payment via Stripe • Cancel anytime
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem 2rem 2rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'rgba(255, 255, 255, 0.5)',
          margin: 0
        }}>
          문의사항이 있으시면 이메일로 연락하세요:{' '}
          <a 
            href="mailto:team@examrizzsearch.com"
            style={{ color: '#5865f2', textDecoration: 'none' }}
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