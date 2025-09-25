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
      background: 'rgba(23, 67, 77, 0.9)',
      backdropFilter: 'blur(12px)'
    }}>
      <div className="welcome-popup" style={{
        background: 'linear-gradient(135deg, #ccccff 0%, #ffffff 100%)',
        border: '2px solid #6EA399',
        boxShadow: '0 20px 60px rgba(23, 67, 77, 0.3)',
        borderRadius: '24px',
        maxWidth: '600px',
        fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        <div className="welcome-popup-header">
          <button 
            className="welcome-popup-close"
            onClick={handleClose}
            aria-label="Close popup"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #6EA399, #17434D)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(110, 163, 153, 0.3)',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #00CED1, #17434D)';
              e.target.style.transform = 'scale(1.1) rotate(90deg)';
              e.target.style.boxShadow = '0 6px 16px rgba(0, 206, 209, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #6EA399, #17434D)';
              e.target.style.transform = 'scale(1) rotate(0deg)';
              e.target.style.boxShadow = '0 4px 12px rgba(110, 163, 153, 0.3)';
            }}
          >
            ×
          </button>
        </div>

        <div className="welcome-popup-content">
          <div className="welcome-popup-text">
            <div style={{
              background: 'linear-gradient(135deg, #ccccff 0%, #ffffff 100%)',
              borderRadius: '20px',
              padding: '2rem',
              border: '2px solid #6EA399',
              boxShadow: '0 8px 32px rgba(110, 163, 153, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Gradient accent bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #6EA399, #00CED1)'
              }} />
              
              <div style={{
                textAlign: 'left',
                fontFamily: 'Futura, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  margin: '0 0 24px 0',
                  lineHeight: '1.2',
                  color: '#17434D',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  옥스포드 졸업생 팀에서 학생들의 자신감과 끝없는 수능 공부 시간 단축을 돕기 위해서 개발한 리딩법이에요!
                </h2>
                
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 206, 209, 0.1), rgba(110, 163, 153, 0.1))',
                  borderLeft: '4px solid #00CED1',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '20px'
                }}>
                  <p style={{
                    fontSize: '22px',
                    fontWeight: '600',
                    margin: '0',
                    lineHeight: '1.3',
                    color: '#17434D'
                  }}>
                    지금 베타 버젼 가입하시면 특별가격으로 평생 멤버십을 사용할 수 있어요
                  </p>
                </div>
                
                <p style={{
                  fontSize: '18px',
                  margin: '0 0 16px 0',
                  lineHeight: '1.6',
                  color: '#17434D',
                  fontWeight: '400'
                }}>
                  전 레벨 수준 높은 오리지널 문제들로 가득 찬 문제 은행 그리고 새 문제들과 비디오 풀이법도 계속 업데이트 되고 있어요.
                </p>
                
                <p style={{
                  fontSize: '18px',
                  margin: '0 0 32px 0',
                  lineHeight: '1.6',
                  color: '#17434D',
                  fontWeight: '400'
                }}>
                  그리고 네이티브들의 학술적 리딩법을 배우는 비디오 코스를 반드시, 꼭꼭 확인하고 평생 쓰는 실력을 익혀 보세요.
                </p>
                
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

          {/* Enhanced CSS for sleek styling */}
          <style jsx>{`
            .welcome-action-btn {
              padding: 16px 24px;
              border: none;
              border-radius: 30px;
              font-size: 16px;
              font-weight: 600;
              font-family: 'Futura', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              cursor: pointer;
              transition: all 0.3s ease;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
              position: relative;
              overflow: hidden;
            }
            
            .welcome-action-btn::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
              transition: left 0.5s;
            }
            
            .welcome-action-btn:hover::before {
              left: 100%;
            }
            
            .welcome-btn-primary {
              background: linear-gradient(135deg, #6EA399, #17434D);
              color: white;
            }
            
            .welcome-btn-primary:hover {
              background: linear-gradient(135deg, #00CED1, #17434D);
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 206, 209, 0.4);
            }
            
            .welcome-btn-secondary {
              background: linear-gradient(135deg, #00CED1, #6EA399);
              color: white;
            }
            
            .welcome-btn-secondary:hover {
              background: linear-gradient(135deg, #17434D, #00CED1);
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(23, 67, 77, 0.4);
            }
            
            .welcome-btn-accent {
              background: linear-gradient(135deg, #ccccff, #6EA399);
              color: #17434D;
              border: 2px solid #6EA399;
            }
            
            .welcome-btn-accent:hover {
              background: linear-gradient(135deg, #6EA399, #00CED1);
              color: white;
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(110, 163, 153, 0.4);
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
                padding: 14px 20px;
              }
            }
          `}</style>
        </div>

        <div className="welcome-popup-footer">
          <label className="welcome-popup-checkbox">
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={handleDontShowAgain}
            />
            <span>Don't show again</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;