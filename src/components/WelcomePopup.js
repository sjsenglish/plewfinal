import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './WelcomePopup.css';

const WelcomePopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has chosen "don't show again"
    const hidePopup = localStorage.getItem('hideWelcomePopup');
    if (hidePopup === 'true') {
      return;
    }

    // Show popup after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (dontShowAgain) {
      localStorage.setItem('hideWelcomePopup', 'true');
    }
  };

  const handleDontShowAgain = () => {
    setDontShowAgain(!dontShowAgain);
  };

  if (!isVisible) return null;

  return (
    <div className="welcome-popup-overlay" style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div className="welcome-popup" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
        borderRadius: '20px',
        maxWidth: '750px',
        width: '90%',
        fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        <div className="welcome-popup-header">
          <button 
            className="welcome-popup-close"
            onClick={handleClose}
            aria-label="Close popup"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '32px',
              height: '32px',
              background: 'rgba(120, 120, 128, 0.12)',
              color: '#1d1d1f',
              border: 'none',
              borderRadius: '50%',
              fontSize: '16px',
              fontWeight: '400',
              fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(120, 120, 128, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(120, 120, 128, 0.12)';
            }}
          >
            ×
          </button>
        </div>

        <div className="welcome-popup-content">
          <div className="welcome-popup-text">
            <div style={{
              padding: '3rem 2.5rem',
              fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '600',
                  margin: '0 0 24px 0',
                  lineHeight: '1.3',
                  color: '#1d1d1f',
                  fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                  옥스포드 졸업생 팀에서 학생들의 자신감과 끝없는 수능 공부 시간 단축을 돕기 위해서 개발한 리딩법이에요!
                </h2>
                
                <div style={{
                  background: 'rgba(0, 122, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  marginBottom: '24px',
                  border: '1px solid rgba(0, 122, 255, 0.1)'
                }}>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    margin: '0',
                    lineHeight: '1.4',
                    color: '#007AFF',
                    fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  }}>
                    지금 베타 버젼 가입하시면 특별가격으로 평생 멤버십을 사용할 수 있어요
                  </p>
                </div>
                
                <p style={{
                  fontSize: '16px',
                  margin: '0 0 16px 0',
                  lineHeight: '1.5',
                  color: '#86868b',
                  fontWeight: '400',
                  fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                  전 레벨 수준 높은 오리지널 문제들로 가득 찬 문제 은행 그리고 새 문제들과 비디오 풀이법도 계속 업데이트 되고 있어요.
                </p>
                
                <p style={{
                  fontSize: '16px',
                  margin: '0 0 32px 0',
                  lineHeight: '1.5',
                  color: '#86868b',
                  fontWeight: '400',
                  fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                  그리고 네이티브들의 학술적 리딩법을 배우는 비디오 코스를 반드시, 꼭꼭 확인하고 평생 쓰는 실력을 익혀 보세요.
                </p>
              </div>
                
                {/* Three action buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <button
                    className="welcome-action-btn welcome-btn-primary"
                    onClick={() => {
                      handleClose();
                      setTimeout(() => {
                        const firstQuestionCard = document.querySelector('.csat-question-card, .korean-english-hit, .tsa-hit, .hit-wrapper');
                        if (firstQuestionCard) {
                          firstQuestionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          const videoButtons = document.querySelectorAll('[data-action="video-solution"]');
                          videoButtons.forEach(btn => {
                            btn.style.animation = 'pulse-glow 1.5s infinite';
                            btn.style.transition = 'background-color 0.3s ease';
                            const currentBg = window.getComputedStyle(btn).backgroundColor;
                            if (currentBg === 'rgba(0, 0, 0, 0)' || currentBg === 'transparent') {
                              btn.style.backgroundColor = '#faa61a';
                            }
                          });
                          setTimeout(() => {
                            videoButtons.forEach(btn => {
                              btn.style.animation = '';
                            });
                          }, 5000);
                        }
                      }, 300);
                    }}
                  >
                    문제 은행과 풀이법은 여기서 확인
                  </button>

                  <Link
                    to="/premium"
                    className="welcome-action-btn welcome-btn-secondary"
                    onClick={handleClose}
                    style={{ textDecoration: 'none' }}
                  >
                    맞춤형 학습으로 바로 가려면 여기
                  </Link>

                  <button
                    className="welcome-action-btn welcome-btn-accent"
                    onClick={() => {
                      window.open('https://www.examrizzsearch.com', '_blank');
                    }}
                  >
                    여기서 영국 프로젝트를 확인해 보세요
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Apple-inspired minimalist styling */}
          <style jsx>{`
            .welcome-action-btn {
              padding: 14px 28px;
              border: none;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 500;
              font-family: 'Futura', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              cursor: pointer;
              transition: all 0.2s ease;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              text-decoration: none;
              letter-spacing: -0.01em;
            }
            
            .welcome-btn-primary {
              background: #007AFF;
              color: white;
              box-shadow: 0 1px 3px rgba(0, 122, 255, 0.3);
            }
            
            .welcome-btn-primary:hover {
              background: #0056CC;
              box-shadow: 0 2px 6px rgba(0, 122, 255, 0.4);
              transform: translateY(-1px);
            }
            
            .welcome-btn-secondary {
              background: rgba(120, 120, 128, 0.12);
              color: #007AFF;
              border: 1px solid rgba(120, 120, 128, 0.16);
            }
            
            .welcome-btn-secondary:hover {
              background: rgba(120, 120, 128, 0.16);
              color: #0056CC;
              transform: translateY(-1px);
            }
            
            .welcome-btn-accent {
              background: rgba(0, 122, 255, 0.08);
              color: #007AFF;
              border: 1px solid rgba(0, 122, 255, 0.2);
            }
            
            .welcome-btn-accent:hover {
              background: rgba(0, 122, 255, 0.12);
              color: #0056CC;
              transform: translateY(-1px);
            }
            
            @keyframes pulse-glow {
              0% { 
                transform: scale(1);
                box-shadow: 0 0 5px rgba(250, 166, 26, 0.5);
              }
              50% { 
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(250, 166, 26, 0.8);
              }
              100% { 
                transform: scale(1);
                box-shadow: 0 0 5px rgba(250, 166, 26, 0.5);
              }
            }
            
            @media (max-width: 768px) {
              .welcome-action-btn {
                font-size: 15px;
                padding: 12px 24px;
              }
            }
          `}</style>
        </div>

        <div className="welcome-popup-footer" style={{
          padding: '20px 2.5rem 1.5rem',
          borderTop: '1px solid rgba(120, 120, 128, 0.08)',
          fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}>
          <label className="welcome-popup-checkbox" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#86868b',
            cursor: 'pointer',
            fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}>
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={handleDontShowAgain}
              style={{
                marginRight: '8px',
                accentColor: '#007AFF'
              }}
            />
            <span>Don't show again</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;