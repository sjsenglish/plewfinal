// Updated SubscriptionPlansPage.js - Trial plan removed, additional info section removed
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { createCheckoutSession } from '../services/checkoutService';
import { usePaywall } from '../hooks/usePaywall';

const SubscriptionPlansPage = () => {
  const [loading, setLoading] = useState({ tier1: false });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  const {
    subscription,
    usage,
    loading: paywallLoading,
    getPlanInfo,
    isLoggedIn,
    isPaidUser,
    cancelSubscription,
  } = usePaywall();

  const planInfo = getPlanInfo();

  // Premium plan configuration
  const plans = [
    {
      id: 'tier1',
      name: '프리미엄',
      price: 29000,
      period: '월',
      priceId: 'price_1Rl7p3RslRN77kT81et1VUvh',
      paymentLink: 'https://buy.stripe.com/8x23cxcsjfHl2Lw08d8EM01',
      description: '수능 준비를 위한 완전한 프리미엄 플랜',
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
      buttonText: '프리미엄 선택',
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

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;
    
    const confirmed = window.confirm(
      '정말로 구독을 취소하시겠습니까? 유료 기능에 대한 액세스를 즉시 잃게 됩니다.'
    );
    
    if (!confirmed) return;
    
    setCancelLoading(true);
    
    try {
      const result = await cancelSubscription();
      
      if (result.success) {
        alert('구독이 성공적으로 취소되었습니다. 그동안 이용해 주셔서 감사합니다!');
      } else {
        alert(`구독 취소 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('구독 취소에 실패했습니다. 다시 시도하거나 고객지원에 문의하세요.');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
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
            수능 준비를 위한 완전한 프리미엄 경험
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
                    {plan.period && (
                      <span className="price-period">
                        `/${plan.period}`
                      </span>
                    )}
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
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading[plan.id] || plan.current || !isLoggedIn}
                  className={`plan-button ${
                    plan.current ? 'button-current' : 
                    'button-default'
                  } ${
                    (loading[plan.id] || !isLoggedIn) && !plan.current ? 'button-disabled' : ''
                  }`}
                >
                  {loading[plan.id] ? (
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
          ))}
        </div>

        {/* Cancel Subscription Section - Only for paying users */}
        {isPaidUser && subscription?.status === 'active' && subscription?.plan === 'tier1' && (
          <div className="cancel-subscription-section">
            <div className="cancel-card">
              <div className="cancel-content">
                <h3 className="cancel-title">구독을 취소하고 싶으신가요?</h3>
                <p className="cancel-description">
                  언제든지 월간 구독을 취소할 수 있습니다. 유료 기능에 대한 액세스를 즉시 잃게 됩니다.
                </p>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="cancel-button"
                >
                  {cancelLoading ? (
                    <div className="button-loading">
                      <div className="button-spinner"></div>
                      <span>취소 중...</span>
                    </div>
                  ) : (
                    '구독 취소'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;