// Updated Navbar.js - Premium Dashboard Structure with Study Features + Beta Tag
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { Button } from './ui';
import { usePaywall } from '../hooks/usePaywall';
// Feature flags removed - all features now enabled for all users
import './Navbar.css';

const Navbar = ({ onSubjectChange }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const auth = getAuth();

  // Get subscription info
  const {
    subscription,
    isPaidUser,
    getPlanInfo,
    checkFeatureAccess,
    loading: paywallLoading
  } = usePaywall();

  const planInfo = getPlanInfo();

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Don't show navbar on login and signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  // Get upgrade button style
  const getUpgradeButtonStyle = () => {
    return {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      border: '2px solid',
      background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      color: 'white',
      borderColor: '#f59e0b',
      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
    };
  };

  const getPremiumButtonStyle = () => {
    return {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: 'white',
      border: '2px solid #6366f1',
      boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
    };
  };

  // Study Buddy button style
  const getStudyBuddyButtonStyle = () => {
    return {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: '2px solid #10b981',
      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
    };
  };

  // Study Dashboard button style
  const getStudyDashboardButtonStyle = () => {
    return {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      background: 'linear-gradient(135deg, #8b5ca5 0%, #6b5ca5 100%)',
      color: 'white',
      border: '2px solid #8b5ca5',
      boxShadow: '0 2px 4px rgba(139, 92, 165, 0.2)'
    };
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-left">
          <div className="navbar-logo">
            <Link to="/" className="navbar-brand-link">
              <span className="navbar-brand-text">
                examrizzsearch
                <span className="navbar-beta-label">BETA</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="navbar-right">
          <div className="navbar-links">
            {/* Study Features - Hidden for now */}
            {/* 
            <Link 
              to="/study-buddy" 
              className="navbar-glass-button"
            >
              <span></span>
              Ask Bo
            </Link>

            <Link 
              to="/study-progress" 
              className="navbar-glass-button"
            >
              <span></span>
              Application Builder
            </Link>
            */}

            {/* Video Streaming */}
            <Link 
              to="/videos" 
              className="navbar-glass-button"
            >
              <span></span>
              Video Lessons
            </Link>

            {/* Premium Dashboard - Always visible, authentication handled by routes */}
            <Link 
              to="/premium" 
              className="navbar-glass-button"
            >
              <span></span>
              Question Packs
            </Link>
          </div>

          <div className="navbar-auth" style={{ marginLeft: '2rem' }}>
            {/* User authentication and upgrade/plans button */}
            {loading || paywallLoading ? (
              <div className="nav-loading"></div>
            ) : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Show upgrade button for free users */}
                {!isPaidUser ? (
                  <Link
                    to="/subscription-plans"
                    className="navbar-upgrade-button-exact"
                  >
                    <span>⚡</span>
                    Upgrade
                  </Link>
                ) : (
                  <Link
                    to="/subscription-plans"
                    className="navbar-upgrade-button-exact"
                  >
                    <span>✓</span>
                    {planInfo.name}
                  </Link>
                )}

                <button onClick={handleSignOut} className="navbar-glass-button">
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="navbar-login-button-exact"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CSS for beta label and responsive design */}
      <style jsx>{`
        .navbar-brand-link {
          text-decoration: none;
          color: inherit;
        }
        
        .navbar-brand-text {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }
        
        .navbar-beta-label {
          background: linear-gradient(135deg, #00ced1 0%, #ccccff 100%) !important;
          color: white !important;
          font-size: 9px !important;
          font-weight: 700 !important;
          padding: 2px 6px !important;
          border-radius: 8px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          box-shadow: 0 2px 6px rgba(0, 206, 209, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          backdrop-filter: blur(8px) !important;
          display: inline-block !important;
          white-space: nowrap !important;
          z-index: 10 !important;
          position: relative !important;
          top: -1px !important;
          animation: navbar-beta-glow 2s ease-in-out infinite alternate !important;
          line-height: 1 !important;
        }
        
        @keyframes navbar-beta-glow {
          0% {
            box-shadow: 0 2px 6px rgba(0, 206, 209, 0.4);
            transform: scale(1);
          }
          100% {
            box-shadow: 0 3px 10px rgba(0, 206, 209, 0.6);
            transform: scale(1.05);
          }
        }
        
        @media (max-width: 1024px) {
          .navbar-links {
            gap: 0.5rem;
          }
          
          .navbar-links a {
            padding: 0.375rem 0.75rem !important;
            font-size: 0.8rem !important;
          }
          
          .navbar-links span {
            display: none;
          }
          
          .navbar-beta-label {
            font-size: 8px !important;
            padding: 1px 4px !important;
            gap: 6px;
          }
        }
        
        @media (max-width: 768px) {
          .navbar-links {
            display: none;
          }
          
          .navbar-auth {
            margin-left: 0 !important;
          }
          
          .navbar-beta-label {
            font-size: 7px !important;
            padding: 1px 3px !important;
          }
          
          .navbar-brand-text {
            gap: 4px;
          }
        }
        
        /* Premium Feature Disabled Button Styles */
        .navbar-disabled-button {
          filter: grayscale(100%) !important;
          transition: none !important;
        }
        
        .navbar-disabled-button:hover {
          opacity: 0.4 !important;
          transform: none !important;
        }
        
        .navbar-premium-tooltip {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s ease;
          z-index: 1000;
        }
        
        .navbar-premium-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.9);
        }
        
        .navbar-disabled-button:hover .navbar-premium-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(-5px);
        }
      `}</style>
    </nav>
  );
};

export default Navbar;