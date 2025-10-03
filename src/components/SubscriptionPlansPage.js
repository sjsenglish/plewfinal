// SubscriptionPlansPage.js - Discord/Claude-inspired clean design
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
      name: '프리미엄 멤버십',
      price: 20000,
      period: '월',
      priceId: 'price_1SEEyCRslRN77kT8VpdUsQbW',
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
      alert('Please sign in to upgrade your plan');
      return;
    }

    setLoading(prev => ({ ...prev, [plan.id]: true }));
    setSelectedPlan(plan.id);

    try {
      console.log('🚀 Starting programmatic checkout for plan:', plan.id);
      
      const result = await createCheckoutSession();
      
      if (!result.success) {
        alert(`Error: ${result.error}`);
        setLoading(prev => ({ ...prev, [plan.id]: false }));
        setSelectedPlan(null);
      }
      // createCheckoutSession will redirect to Stripe, so no need to reset loading here
      
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Unable to start checkout. Please try again.');
      setLoading(prev => ({ ...prev, [plan.id]: false }));
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel? You will lose access to premium features immediately.'
    );
    
    if (!confirmed) return;
    
    setCancelLoading(true);
    
    try {
      const result = await cancelSubscription();
      
      if (result.success) {
        alert('Your subscription has been cancelled successfully.');
      } else {
        alert(`Failed to cancel subscription: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please contact support.');
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          borderTop: '2px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        background: 'radial-gradient(circle at 50% 0%, rgba(88, 101, 242, 0.08) 0%, transparent 50%)'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '600',
          margin: '0 0 16px 0',
          letterSpacing: '-1.5px',
          lineHeight: '1.1'
        }}>
          원하는 플랜을 골라 보세요
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.6)',
          margin: '0 auto',
          maxWidth: '480px',
          lineHeight: '1.5'
        }}>
          무제한 검색 기능을 사용할 수 있습니다.
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px 80px'
      }}>
        {/* Login Notice */}
        {!isLoggedIn && (
          <div style={{
            maxWidth: '480px',
            margin: '0 auto 48px',
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
                Please{' '}
                <a href="/login" style={{
                  color: '#faa61a',
                  textDecoration: 'none',
                  borderBottom: '1px solid #faa61a'
                }}>
                  로그인
                </a>
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
          marginBottom: '48px'
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
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 8px 0'
              }}>
                무료 멤버십
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0 0 24px 0'
              }}>
                무제한 검색 기능을 사용할 수 있습니다.
              </p>
              
              <div style={{
                fontSize: '36px',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                ₩0
                <span style={{
                  fontSize: '16px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '400',
                  marginLeft: '8px'
                }}>
                  /월
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <ul style={{
                margin: 0,
                padding: 0,
                listStyle: 'none'
              }}>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  무제한 검색 기능을 사용할 수 있습니다.
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </li>
              </ul>
            </div>

            <button
              disabled
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'not-allowed'
              }}
            >
              Current plan
            </button>
          </div>

          {/* Premium Plan */}
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                backgroundColor: 'rgba(88, 101, 242, 0.05)',
                border: '2px solid rgba(88, 101, 242, 0.3)',
                borderRadius: '16px',
                padding: '32px',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Popular Badge */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '32px',
                backgroundColor: '#5865f2',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                추천
              </div>

              {plan.current && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  Active
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 8px 0'
                }}>
                  {plan.name}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: '0 0 24px 0'
                }}>
                  {plan.description}
                </p>
                
                <div style={{
                  fontSize: '36px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  {formatPrice(plan.price)}
                  <span style={{
                    fontSize: '16px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: '400',
                    marginLeft: '8px'
                  }}>
                    /{plan.period}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <ul style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none'
                }}>
                  {plan.features.map((feature, index) => (
                    <li key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 0',
                      fontSize: '14px',
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

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={loading[plan.id] || plan.current || !isLoggedIn}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: plan.current ? 'rgba(16, 185, 129, 0.1)' : '#5865f2',
                  color: plan.current ? '#10b981' : 'white',
                  border: plan.current ? '1px solid rgba(16, 185, 129, 0.2)' : 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (loading[plan.id] || plan.current || !isLoggedIn) ? 'not-allowed' : 'pointer',
                  opacity: (loading[plan.id] || !isLoggedIn) && !plan.current ? 0.5 : 1,
                  transition: 'all 0.2s ease'
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
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.3)',
                textAlign: 'center',
                marginTop: '12px',
                margin: '12px 0 0 0'
              }}>
                Secure payment via Stripe • Cancel anytime
              </p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div style={{
          maxWidth: '640px',
          margin: '80px auto 0',
          padding: '40px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: '0 0 32px 0',
            textAlign: 'center'
          }}>
            자주 묻는 질문
          </h2>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '500',
                margin: '0 0 8px 0',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                멤버십 취소 가능할까?
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                lineHeight: '1.6'
              }}>
                네, 언제든 취소할 수 있습니다. 취소 후에도 결제 기간까지 사이트 이용 가능합니다. 
              </p>
            </div>

            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '500',
                margin: '0 0 8px 0',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                결제 방법은? 
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                lineHeight: '1.6'
              }}>
                안전한 결제 대행사인 Stripe을 통해 주요 신용카드, 직불카드, 디지털 지갑을 받습니다.
              </p>
            </div>

            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '500',
                margin: '0 0 8px 0',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                환불 정책은? 
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                lineHeight: '1.6'
              }}>
                만족하지 않으실 경우 고객지원팀에 연락하시면 30일 환불 보장 해드립니다.
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Subscription Section */}
        {isPaidUser && subscription?.status === 'active' && subscription?.plan === 'tier1' && (
          <div style={{
            maxWidth: '480px',
            margin: '48px auto 0',
            padding: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '500',
              margin: '0 0 8px 0'
            }}>
              Need to cancel?
            </h3>
            
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '0 0 20px 0'
            }}>
              You can cancel your subscription at any time.
            </p>
            
            <button
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: cancelLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!cancelLoading) {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!cancelLoading) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }
              }}
            >
              {cancelLoading ? 'Cancelling...' : 'Cancel subscription'}
            </button>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPlansPage;