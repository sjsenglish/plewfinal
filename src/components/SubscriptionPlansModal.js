// SubscriptionPlansModal.js - Clean single tier Premium subscription modal
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { createCheckoutSession } from '../services/checkoutService';
import { usePaywall } from '../hooks/usePaywall';

const SubscriptionPlansModal = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  const {
    subscription,
    loading: paywallLoading,
    isLoggedIn,
    isPaidUser,
  } = usePaywall();

  // Premium plan configuration
  const plan = {
    id: 'premium',
    name: '프리미엄 멤버십',
    price: 20000,
    period: '월',
    description: '모든 기능에 무제한 액세스',
    features: [
      '무제한 일일 검색',
      '무제한 비디오 솔루션',
      '무제한 문제 팩',
      '타이머 연습 모드',
      '우선 커뮤니티 지원',
      '주간 큐레이션 콘텐츠',
      '고급 분석 대시보드',
      '개인화된 학습 계획',
    ],
    buttonText: 'Start with Premium',
    popular: true,
    current: isPaidUser
  };

  const handleUpgrade = async () => {
    if (!user) {
      alert('구독하려면 로그인하세요');
      return;
    }

    if (isPaidUser) {
      alert('이미 프리미엄 구독자입니다!');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Starting Premium subscription for user:', user.uid);
      
      const result = await createCheckoutSession();

      if (!result.success) {
        alert(`오류: ${result.error}`);
      }
      // createCheckoutSession will redirect to Stripe, so no need for further action
      
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('결제를 시작할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={{ 
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
      {/* Header */}
      <div style={{
        padding: '48px 24px 36px',
        textAlign: 'center',
        position: 'relative',
        background: 'radial-gradient(circle at 50% 0%, rgba(88, 101, 242, 0.08) 0%, transparent 50%)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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

        <h1 style={{
          fontSize: '36px',
          fontWeight: '600',
          margin: '0 0 16px 0',
          letterSpacing: '-1.5px',
          lineHeight: '1.1'
        }}>
          프리미엄으로 업그레이드
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.6)',
          margin: '0 auto',
          maxWidth: '480px',
          lineHeight: '1.5'
        }}>
          모든 학습 기능에 무제한 액세스하세요
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        padding: '0 24px 48px'
      }}>
        {/* Login Notice */}
        {!isLoggedIn && (
          <div style={{
            maxWidth: '480px',
            margin: '0 auto 32px',
            padding: '16px 20px',
            backgroundColor: 'rgba(250, 166, 26, 0.1)',
            border: '1px solid rgba(250, 166, 26, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
              <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 5C10.5523 5 11 5.44772 11 6V10C11 10.5523 10.5523 11 10 11C9.44772 11 9 10.5523 9 10V6C9 5.44772 9.44772 5 10 5ZM10 15C9.44772 15 9 14.5523 9 14C9 13.4477 9.44772 13 10 13C10.5523 13 11 13.4477 11 14C11 14.5523 10.5523 15 10 15Z" fill="#faa61a"/>
            </svg>
            
            <div style={{ flex: 1 }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: '1.5'
              }}>
                구독하려면{' '}
                <span style={{
                  color: '#faa61a',
                  textDecoration: 'none',
                  borderBottom: '1px solid #faa61a',
                  cursor: 'pointer'
                }} onClick={onClose}>
                  로그인
                </span>
                {' '}하세요
              </p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Free Plan */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '32px',
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
              기본적인 기능
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
                제한된 검색
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
                기본 기능
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
            현재 플랜
          </button>
        </div>

        {/* Premium Plan */}
        <div
          style={{
            backgroundColor: 'rgba(88, 101, 242, 0.05)',
            borderRadius: '16px',
            padding: '32px',
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
            onClick={handleUpgrade}
            disabled={loading || plan.current || !isLoggedIn}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: plan.current ? 'rgba(16, 185, 129, 0.1)' : '#5865f2',
              color: plan.current ? '#10b981' : 'white',
              border: plan.current ? '1px solid rgba(16, 185, 129, 0.2)' : 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: (loading || plan.current || !isLoggedIn) ? 'not-allowed' : 'pointer',
              opacity: (loading || !isLoggedIn) && !plan.current ? 0.5 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!plan.current && !loading && isLoggedIn) {
                e.target.style.backgroundColor = '#4752c4';
              }
            }}
            onMouseLeave={(e) => {
              if (!plan.current && !loading && isLoggedIn) {
                e.target.style.backgroundColor = '#5865f2';
              }
            }}
          >
            {loading ? (
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
              '로그인 하세요'
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
            Stripe 보안 결제 • 언제든지 취소
          </p>
        </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '32px'
        }}>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0
          }}>
            문의사항이 있으시면 이메일로 연락하세요:{' '}
            <a 
              href="mailto:team@plew.co.kr"
              style={{ color: '#5865f2', textDecoration: 'none' }}
            >
              team@plew.co.kr
            </a>
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
  );
};

export default SubscriptionPlansModal;