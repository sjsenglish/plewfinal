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

  // New tier configurations
  const plans = [
    {
      id: 'tier1',
      name: '티어 1 프리미엄',
      price: 29000,
      period: '월',
      priceId: 'price_1Rl7p3RslRN77kT81et1VUvh',
      paymentLink: 'https://buy.stripe.com/8x23cxcsjfHl2Lw08d8EM01',
      features: [
        '무제한 일일 검색',
        '무제한 비디오 솔루션', 
        '무제한 문제 팩',
        '타이머 연습 모드',
        '우선 커뮤니티 지원',
        '주간 큐레이션 콘텐츠',
      ],
      buttonText: '티어 1 선택',
      popular: true,
      current: subscription?.plan === 'tier1'
    },
    {
      id: 'tier2',
      name: '티어 2 프리미엄',
      price: 49000,
      period: '월',
      priceId: 'price_1Rl7qwRslRN77kT8cBvGyMXo',
      paymentLink: 'https://buy.stripe.com/5kQbJ377ZeDh4TE8EJ8EM02',
      features: [
        '티어 1의 모든 기능',
        '고급 분석 대시보드',
        '개인화된 학습 계획',
        '1:1 과외 세션',
        '독점 워크숍 액세스',
        '우선 이메일 지원',
        '맞춤 문제 팩 생성',
      ],
      buttonText: '티어 2 선택',
      popular: false,
      current: subscription?.plan === 'tier2'
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
            프리미엄 티어 선택
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            수능 준비를 위한 두 가지 프리미엄 티어
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
                현재 플랜
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
                인기
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
                현재
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
                    /{plan.period}
                  </div>
                )}
              </div>
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
                  처리 중...
                </>
              ) : plan.current ? (
                '✓ 현재 플랜'
              ) : !isLoggedIn ? (
                '로그인 필요'
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
                Stripe 보안 결제<br/>
                언제든지 취소 • 30일 환불 보장
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
          문의사항이 있으시면 이메일로 연락하세요:{' '}
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