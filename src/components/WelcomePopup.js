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
    <div className="welcome-popup-overlay">
      <div className="welcome-popup">
        <div className="welcome-popup-header">
          <button 
            className="welcome-popup-close"
            onClick={handleClose}
            aria-label="Close popup"
          >
            ×
          </button>
        </div>

        <div className="welcome-popup-content">
          <div className="welcome-popup-text">
            <div style={{
              textAlign: 'left',
              maxWidth: '100%',
              lineHeight: '1.5'
            }}>
              <p style={{
                fontSize: '24px',
                fontWeight: '600',
                margin: '0 0 20px 0',
                lineHeight: '1.3',
                color: '#111827'
              }}>
                옥스포드 졸업생 팀에서 학생들의 자신감과 끝없는 수능 공부 시간 단축을 돕기 위해서 개발한 리딩법이에요!
              </p>
              
              <p style={{
                fontSize: '20px',
                fontWeight: '500',
                margin: '0 0 16px 0',
                lineHeight: '1.4',
                color: '#5865f2'
              }}>
                지금 베타 버젼 가입하시면 특별가격으로 평생 멤버십을 사용할 수 있어요
              </p>
              
              <p style={{
                fontSize: '18px',
                margin: '0 0 16px 0',
                lineHeight: '1.5',
                color: '#4b5563'
              }}>
                전 레벨 수준 높은 오리지널 문제들로 가득 찬 문제 은행 그리고 새 문제들과 비디오 풀이법도 계속 업데이트 되고 있어요.
              </p>
              
              <p style={{
                fontSize: '18px',
                margin: '0 0 24px 0',
                lineHeight: '1.5',
                color: '#4b5563'
              }}>
                그리고 네이티브들의 학술적 리딩법을 배우는 비디오 코스를 반드시, 꼭꼭 확인하고 평생 쓰는 실력을 익혀 보세요.
              </p>
              
              {/* Three action buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '32px'
              }}>
                <button
                  onClick={() => {
                    handleClose();
                    setTimeout(() => {
                      const firstQuestionCard = document.querySelector('.csat-question-card, .korean-english-hit, .tsa-hit, .hit-wrapper');
                      if (firstQuestionCard) {
                        firstQuestionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add pulsing effect to video solution buttons
                        const videoButtons = document.querySelectorAll('[data-action="video-solution"]');
                        videoButtons.forEach(btn => {
                          btn.style.animation = 'pulse-glow 1.5s infinite';
                          btn.style.transition = 'background-color 0.3s ease';
                          // Only change background if it's not already styled
                          const currentBg = window.getComputedStyle(btn).backgroundColor;
                          if (currentBg === 'rgba(0, 0, 0, 0)' || currentBg === 'transparent') {
                            btn.style.backgroundColor = '#faa61a';
                          }
                        });
                        // Remove animation after 5 seconds
                        setTimeout(() => {
                          videoButtons.forEach(btn => {
                            btn.style.animation = '';
                          });
                        }, 5000);
                      }
                    }, 300);
                  }}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: '#6EA399',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#5a8a7f';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#6EA399';
                  }}
                >
                  문제 은행과 풀이법은 여기서 확인
                </button>

                <button
                  onClick={() => {
                    handleClose();
                    // Navigate to premium dashboard
                    window.location.href = '/premium-dashboard';
                  }}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: '#5865f2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#4752c4';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#5865f2';
                  }}
                >
                  맞춤형 학습으로 바로 가려면 여기
                </button>

                <button
                  onClick={() => {
                    window.open('https://www.examrizzsearch.com', '_blank');
                  }}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: '#faa61a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e8941a';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#faa61a';
                  }}
                >
                  여기서 영국 프로젝트를 확인해 보세요
                </button>
              </div>
            </div>
          </div>

          {/* Add CSS for animations */}
          <style jsx>{`
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