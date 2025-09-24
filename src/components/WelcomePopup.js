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
          {/* Default advertisement image */}
          <div className="welcome-popup-image">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fplew-site-logo.svg?alt=media&token=b01d0e4e-1458-4979-84dc-c2cc581db3de"
              alt="PLEW Advertisement"
              style={{ width: '200px', height: 'auto' }}
            />
          </div>

          <div className="welcome-popup-text">
            <h2>Welcome to PLEW! 🎉</h2>
            <p>Your ultimate platform for Korean SAT English preparation</p>
            <p>Access thousands of questions, personalized study tools, and comprehensive learning materials.</p>
          </div>

          <div className="welcome-popup-actions">
            <Link 
              to="/premium" 
              className="welcome-popup-study-button"
              onClick={handleClose}
            >
              <span>📚</span>
              학습도우미 (Go to Study)
            </Link>
          </div>
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