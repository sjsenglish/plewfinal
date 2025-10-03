// SubscriptionPlans.js - Clean single tier Premium subscription
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { createCheckoutSession } from '../services/checkoutService';
import { usePaywall } from '../hooks/usePaywall';

const SubscriptionPlansPage = () => {
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
    name: '프리미엄',
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
    buttonText: '프리미엄 구독',
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
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">플랜 로딩 중...</p>
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
          <h1 className="header-title">프리미엄 플랜</h1>
          <p className="header-subtitle">
            모든 학습 기능에 무제한 액세스하세요
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
                <strong>참고:</strong> 플랜을 구독하려면{' '}
                <a href="/login" className="login-link">로그인</a>{' '}
                하세요.
              </p>
            </div>
          </div>
        )}

        {/* Free Plan */}
        <div className="plans-grid">
          <div className="plan-card">
            <div className="plan-content">
              <div className="plan-header">
                <h3 className="plan-name">무료</h3>
                <p className="plan-description">기본 기능</p>
                <div className="price-container">
                  <span className="price">₩0</span>
                  <span className="price-period">/월</span>
                </div>
              </div>

              <div className="features-section">
                <h4 className="features-title">포함 내용:</h4>
                <ul className="features-list">
                  <li className="feature-item">
                    <svg className="feature-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="feature-text">제한된 검색</span>
                  </li>
                  <li className="feature-item">
                    <svg className="feature-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="feature-text">기본 기능</span>
                  </li>
                </ul>
              </div>

              <button
                disabled
                className="plan-button button-current"
              >
                현재 플랜
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className={`plan-card ${plan.popular ? 'plan-popular' : ''} ${plan.current ? 'plan-current' : ''}`}>
            {/* Popular Badge */}
            {plan.popular && (
              <div className="badge-popular">추천</div>
            )}

            {/* Current Badge */}
            {plan.current && (
              <div className="badge-current">현재</div>
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
                  <span className="price-period">
                    /{plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="features-section">
                <h4 className="features-title">포함 내용:</h4>
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
                onClick={handleUpgrade}
                disabled={loading || plan.current || !isLoggedIn}
                className={`plan-button ${
                  plan.current ? 'button-current' : 
                  'button-default'
                } ${
                  (loading || !isLoggedIn) && !plan.current ? 'button-disabled' : ''
                }`}
              >
                {loading ? (
                  <div className="button-loading">
                    <div className="button-spinner"></div>
                    <span>처리 중...</span>
                  </div>
                ) : plan.current ? (
                  '✓ 현재 플랜'
                ) : !isLoggedIn ? (
                  '구독하려면 로그인'
                ) : (
                  plan.buttonText
                )}
              </button>

              {/* Payment Info */}
              <div className="payment-info">
                <p className="payment-text">
                  Stripe 보안 결제<br/>
                  언제든지 취소 • 30일 환불 보장
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;