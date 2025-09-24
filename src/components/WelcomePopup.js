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
            <h2>Welcome to PLEW</h2>
            <p className="welcome-intro">Here you can:</p>
            <div className="welcome-features">
              <div className="feature-item">
                <span className="bullet">•</span>
                <span>Learn like a native - the most effective way to read academic passages</span>
              </div>
              <div className="feature-item">
                <span className="bullet">•</span>
                <span>The only questionbank with 100s of original, high quality questions produced by an Oxford graduate team.</span>
              </div>
            </div>
            
            <div className="welcome-cta-section">
              <p className="cta-header">Not sure where to start?</p>
              <div className="cta-buttons">
                <div className="cta-item">
                  <span className="bullet">•</span>
                  <Link 
                    to="/premium" 
                    className="cta-link"
                    onClick={handleClose}
                  >
                    Click here to start our week-by-week course with video support
                  </Link>
                </div>
                <div className="cta-item">
                  <span className="bullet">•</span>
                  <Link 
                    to="/question-pack" 
                    className="cta-link"
                    onClick={handleClose}
                  >
                    Click here to start practicing with our tailored question packs
                  </Link>
                </div>
              </div>
            </div>
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