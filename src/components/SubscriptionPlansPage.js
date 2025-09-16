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
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '5rem 2rem 4rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Geometric shapes for modern look */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(45deg, #06b6d4, #0891b2)',
          borderRadius: '30%',
          opacity: '0.1',
          transform: 'rotate(45deg)',
          filter: 'blur(20px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '15%',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(45deg, #10b981, #059669)',
          borderRadius: '40%',
          opacity: '0.1',
          transform: 'rotate(-30deg)',
          filter: 'blur(15px)'
        }} />
        
        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
            borderRadius: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2.5rem auto',
            fontSize: '48px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}>
            💎
          </div>
          
          <h1 style={{
            fontSize: '56px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #f8fafc, #cbd5e1)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 1.5rem 0',
            letterSpacing: '-0.02em',
            textShadow: 'none'
          }}>
            프리미엄 플랜
          </h1>
          
          <p style={{
            fontSize: '22px',
            color: '#94a3b8',
            margin: '0',
            lineHeight: '1.7',
            fontWeight: '400',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            수능 준비를 위한 완전한 프리미엄 경험
          </p>
        </div>
      </div>

      <div style={{
        padding: '4rem 2rem 2rem 2rem',
        background: '#f8fafc',
        minHeight: 'calc(100vh - 300px)'
      }}>
        {/* Login Notice */}
        {!isLoggedIn && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '3rem'
          }}>
            <div style={{
              maxWidth: '600px',
              width: '100%',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)'
              }}>
                <svg 
                  width="24" 
                  height="24" 
                  fill="white" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  로그인이 필요합니다
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#64748b',
                  margin: '0',
                  fontWeight: '400'
                }}>
                  프리미엄 플랜을 구독하려면{' '}
                  <a 
                    href="/login" 
                    style={{
                      color: '#f59e0b',
                      textDecoration: 'none',
                      fontWeight: '600',
                      borderBottom: '2px solid #f59e0b'
                    }}
                  >
                    로그인
                  </a>{' '}
                  하세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '0 1rem'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%'
          }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  position: 'relative',
                  backgroundColor: 'white',
                  borderRadius: '32px',
                  boxShadow: '0 32px 64px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
                  border: plan.current 
                    ? '2px solid #10b981' 
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  margin: '0 auto',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbff 100%)'
                }}
                onMouseEnter={(e) => {
                  if (!plan.current) {
                    e.target.style.transform = 'translateY(-12px) scale(1.02)';
                    e.target.style.boxShadow = '0 40px 80px rgba(0, 0, 0, 0.16), 0 8px 32px rgba(0, 0, 0, 0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 32px 64px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)';
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '24px',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 12px 32px rgba(30, 41, 59, 0.4)',
                    zIndex: 10,
                    border: '2px solid white'
                  }}>
                    ✨ 추천 플랜
                  </div>
                )}

                {/* Current Badge */}
                {plan.current && (
                  <div style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                  }}>
                    ✓ 현재 이용중
                  </div>
                )}

                <div style={{
                  padding: '3.5rem 3rem 3rem 3rem'
                }}>
                  {/* Plan Header */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '3rem',
                    paddingBottom: '2.5rem',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      background: 'linear-gradient(135deg, #1e293b, #334155)',
                      borderRadius: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 2rem auto',
                      fontSize: '36px',
                      boxShadow: '0 16px 40px rgba(30, 41, 59, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      ⚡
                    </div>
                    
                    <h3 style={{
                      fontSize: '32px',
                      fontWeight: '900',
                      color: '#0f172a',
                      margin: '0 0 1rem 0',
                      letterSpacing: '-0.02em'
                    }}>
                      {plan.name}
                    </h3>
                    
                    <p style={{
                      fontSize: '18px',
                      color: '#64748b',
                      margin: '0 0 2.5rem 0',
                      lineHeight: '1.6',
                      maxWidth: '400px',
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}>
                      {plan.description}
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        fontSize: '56px',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #1e293b, #64748b)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: '1'
                      }}>
                        {formatPrice(plan.price)}
                      </span>
                      {plan.period && (
                        <span style={{
                          fontSize: '20px',
                          color: '#64748b',
                          fontWeight: '600'
                        }}>
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    
                    <p style={{
                      fontSize: '14px',
                      color: '#94a3b8',
                      margin: '0',
                      fontWeight: '500'
                    }}>
                      VAT 포함 • 언제든지 취소 가능
                    </p>
                  </div>

                  {/* Features */}
                  <div style={{
                    marginBottom: '3rem'
                  }}>
                    <h4 style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: '#1e293b',
                      margin: '0 0 2rem 0',
                      textAlign: 'center'
                    }}>
                      포함된 모든 기능
                    </h4>
                    
                    <div style={{
                      display: 'grid',
                      gap: '1.25rem'
                    }}>
                      {plan.features.map((feature, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem 1.25rem',
                          backgroundColor: 'rgba(248, 250, 252, 0.8)',
                          borderRadius: '16px',
                          border: '1px solid rgba(226, 232, 240, 0.6)',
                          transition: 'all 0.2s ease',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(241, 245, 249, 1)';
                          e.target.style.borderColor = 'rgba(203, 213, 225, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'rgba(248, 250, 252, 0.8)';
                          e.target.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                        }}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}>
                            <svg 
                              width="16" 
                              height="16" 
                              fill="white" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                          <span style={{
                            fontSize: '16px',
                            color: '#374151',
                            fontWeight: '600',
                            lineHeight: '1.4'
                          }}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading[plan.id] || plan.current || !isLoggedIn}
                    style={{
                      width: '100%',
                      padding: '1.25rem 2rem',
                      fontSize: '18px',
                      fontWeight: '700',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: (loading[plan.id] || plan.current || !isLoggedIn) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: plan.current 
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #1e293b, #0f172a)',
                      color: 'white',
                      opacity: (loading[plan.id] || !isLoggedIn) && !plan.current ? 0.6 : 1,
                      boxShadow: plan.current 
                        ? '0 12px 28px rgba(16, 185, 129, 0.3)'
                        : '0 12px 28px rgba(30, 41, 59, 0.4)',
                      marginBottom: '2rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!plan.current && !loading[plan.id] && isLoggedIn) {
                        e.target.style.transform = 'translateY(-3px)';
                        e.target.style.boxShadow = '0 16px 36px rgba(30, 41, 59, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = plan.current 
                        ? '0 12px 28px rgba(16, 185, 129, 0.3)'
                        : '0 12px 28px rgba(30, 41, 59, 0.4)';
                    }}
                  >
                    {/* Button shine effect */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                      transition: 'left 0.6s ease'
                    }} />
                    
                    {loading[plan.id] ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          border: '2px solid transparent',
                          borderTop: '2px solid currentColor',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        <span>처리 중...</span>
                      </div>
                    ) : plan.current ? (
                      '✓ 현재 이용 중인 플랜'
                    ) : !isLoggedIn ? (
                      '먼저 로그인해 주세요'
                    ) : (
                      `지금 ${plan.buttonText}`
                    )}
                  </button>

                  {/* Payment Info */}
                  <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <p style={{
                      fontSize: '13px',
                      color: '#64748b',
                      margin: '0',
                      lineHeight: '1.5'
                    }}>
                      🔒 <strong>Stripe 보안 결제</strong><br/>
                      언제든지 취소 가능 • 30일 환불 보장
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Subscription Section - Only for paying users */}
        {isPaidUser && subscription?.status === 'active' && subscription?.plan === 'tier1' && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '0 2rem',
            marginTop: '3rem'
          }}>
            <div style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: '#fefefe',
              border: '1px solid #f1f5f9',
              borderRadius: '20px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#fef2f2',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                fontSize: '20px'
              }}>
                ❌
              </div>
              
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 1rem 0'
              }}>
                구독을 취소하고 싶으신가요?
              </h3>
              
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '0 0 2rem 0',
                lineHeight: '1.6'
              }}>
                언제든지 월간 구독을 취소할 수 있습니다. 유료 기능에 대한 액세스를 즉시 잃게 됩니다.
              </p>
              
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  border: '1px solid #ef4444',
                  backgroundColor: cancelLoading ? '#f3f4f6' : 'white',
                  color: cancelLoading ? '#9ca3af' : '#ef4444',
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!cancelLoading) {
                    e.target.style.backgroundColor = '#ef4444';
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!cancelLoading) {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#ef4444';
                  }
                }}
              >
                {cancelLoading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>취소 중...</span>
                  </div>
                ) : (
                  '구독 취소'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;