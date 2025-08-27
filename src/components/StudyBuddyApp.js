import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { usePaywall } from '../hooks/usePaywall';
// Feature flags removed - all features now enabled for all users
import EnhancedStudyBuddy from './EnhancedStudyBuddy';
import StudyProgressDashboard from './StudyProgressDashboard';
import ProfileSetupWizard from './ProfileSetupWizard';
import userStorage from '../utils/userStorage';

// Apple-inspired Design System
const COLORS = {
  mint: '#d8f0ed',
  darkGreen: '#2a4442',
  lavenderLight: '#e1dfff',
  purpleDark: '#221468',
  lavender: '#d4d0ff',
  teal: '#00ced1',
  mediumGreen: '#5b8f8a',
  mediumPurple: '#9691c4',
  navyBlue: '#1e3a8a',
  lightPurple: '#ccccff',
  pastelAmber: '#fef3c7',
  primary: '#00ced1',
  secondary: '#5b8f8a',
  glassBg: 'rgba(255, 255, 255, 0.95)',
  shadowLight: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowMedium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  shadowLarge: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

// Apple-inspired Typography System
const TYPOGRAPHY = {
  h1: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1.25',
    letterSpacing: '-0.025em'
  },
  h2: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '1.3',
    letterSpacing: '-0.02em'
  },
  h3: {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.35',
    letterSpacing: '-0.01em'
  },
  h4: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '1.4',
    letterSpacing: '-0.005em'
  },
  h5: {
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '1.45'
  },
  h6: {
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.5'
  },
  body: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.55',
    letterSpacing: '0.01em'
  },
  bodySmall: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.6',
    letterSpacing: '0.01em'
  },
  caption: {
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '1.5',
    letterSpacing: '0.02em'
  }
};

const ANIMATIONS = {
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  hover: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  fadeIn: 'opacity 0.5s ease-in-out'
};

const StudyBuddyApp = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState('checking'); // 'checking', 'needs-setup', 'complete'
  
  // Get subscription info
  const { checkFeatureAccess, loading: paywallLoading } = usePaywall();
  
  // Determine initial view based on URL route
  const getInitialView = () => {
    if (location.pathname === '/study-progress') {
      return 'dashboard';
    }
    return 'chat'; // Default for /study-buddy
  };
  
  const [currentView, setCurrentView] = useState(getInitialView); // 'chat', 'dashboard', 'setup'
  const [profileData, setProfileData] = useState(null);

  const FUNCTIONS_BASE_URL = 'https://us-central1-plewcsat1.cloudfunctions.net';

  // Auth listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        checkProfileStatus(currentUser);
      } else {
        setProfileStatus('needs-setup');
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync current view with URL changes
  useEffect(() => {
    setCurrentView(getInitialView());
  }, [location.pathname]);

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error('No authenticated user');
  };

  const checkProfileStatus = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      
      const response = await fetch(`${FUNCTIONS_BASE_URL}/getStudyProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const profile = result.studyProfile || result;
        
        // TEMPORARILY DISABLED: Profile setup check - always set to complete
        // const hasBasicSetup = (
        //   profile.setupCompleted === true ||
        //   (profile.currentSubjects && profile.currentSubjects.length > 0) ||
        //   (profile.subjects && profile.subjects.length > 0) ||
        //   profile.userArchetype
        // );

        // if (hasBasicSetup) {
        //   setProfileStatus('complete');
        //   setProfileData(profile);
        // } else {
        //   setProfileStatus('needs-setup');
        // }

        // Always set to complete to skip profile setup
        setProfileStatus('complete');
        setProfileData(profile);
      } else if (response.status === 404) {
        // TEMPORARILY DISABLED: Profile doesn't exist yet - still set to complete
        // setProfileStatus('needs-setup');
        setProfileStatus('complete');
        setProfileData({}); // Set empty profile data
      } else {
        console.error('Error checking profile status:', response.status);
        // TEMPORARILY DISABLED: Error case - still set to complete
        // setProfileStatus('needs-setup');
        setProfileStatus('complete');
        setProfileData({}); // Set empty profile data
      }
    } catch (error) {
      console.error('Error checking profile status:', error);
      // TEMPORARILY DISABLED: Error case - still set to complete
      // setProfileStatus('needs-setup');
      setProfileStatus('complete');
      setProfileData({}); // Set empty profile data
    }
  };

  const handleSetupComplete = async () => {
    // Refresh profile data after setup
    if (user) {
      await checkProfileStatus(user);
      setCurrentView('dashboard'); // Navigate to dashboard after setup
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await checkProfileStatus(user);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    console.log('DEBUG: handleProfileUpdate called with:', updatedProfile);
    
    // Update local profile data with enhanced insights
    setProfileData(updatedProfile);
    
    // Save to localStorage using userStorage to persist the data
    try {
      userStorage.set('profileData', updatedProfile);
      console.log('DEBUG: Profile saved to localStorage successfully');
    } catch (error) {
      console.error('Error saving profile to localStorage:', error);
    }
  };

  const handleHomeNavigation = () => {
    // Navigate to homepage - you can customize this based on your routing setup
    // Option 1: If using React Router
    // navigate('/');
    
    // Option 2: If using window.location
    window.location.href = '/';
    
    // Option 3: If you have a specific homepage component to show
    // setCurrentView('home');
  };

  // Loading states - Apple-inspired
  if (authLoading || profileStatus === 'checking') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, rgba(216, 240, 237, 0.4) 0%, transparent 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        position: 'relative'
      }}>
        {/* Background overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '32px',
          padding: '48px 60px',
          textAlign: 'center',
          boxShadow: COLORS.shadowLarge,
          border: '1px solid rgba(255, 255, 255, 0.5)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(0, 206, 209, 0.2)',
            borderTop: '4px solid #00ced1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <p style={{ 
            ...TYPOGRAPHY.body,
            color: COLORS.mediumGreen, 
            margin: 0,
            fontWeight: '500'
          }}>
            {authLoading ? 'Checking authentication...' : 'Loading your study profile...'}
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated - Apple-inspired
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, rgba(216, 240, 237, 0.4) 0%, transparent 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Background overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '32px',
          padding: '48px 60px',
          textAlign: 'center',
          boxShadow: COLORS.shadowLarge,
          border: '1px solid rgba(255, 255, 255, 0.5)',
          maxWidth: '480px',
          width: '100%',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ fontSize: '64px', marginBottom: '32px' }}>🎓</div>
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.darkGreen,
            margin: '0 0 16px 0'
          }}>
            Ask Bo
          </h1>
          <p style={{
            ...TYPOGRAPHY.body,
            color: COLORS.mediumGreen,
            marginBottom: '40px',
            fontWeight: '500'
          }}>
            Your comprehensive UK university application mentor. Get personalized guidance, track your progress, and build compelling applications.
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center'
          }}>
            <a 
              href="/login"
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                color: 'white',
                padding: '16px 32px',
                borderRadius: '16px',
                textDecoration: 'none',
                ...TYPOGRAPHY.bodySmall,
                fontWeight: '600',
                boxShadow: '0 8px 24px rgba(0, 206, 209, 0.3)',
                transition: ANIMATIONS.transition,
                border: 'none'
              }}
            >
              Log In
            </a>
            <a 
              href="/signup"
              style={{
                backgroundColor: 'transparent',
                color: COLORS.primary,
                border: `2px solid ${COLORS.primary}`,
                padding: '16px 32px',
                borderRadius: '16px',
                textDecoration: 'none',
                ...TYPOGRAPHY.bodySmall,
                fontWeight: '600',
                transition: ANIMATIONS.transition
              }}
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }

  // TEMPORARILY DISABLED: Profile needs setup - skip and go straight to dashboard
  // if (profileStatus === 'needs-setup') {
  //   return <ProfileSetupWizard onSetupComplete={handleSetupComplete} />;
  // }

  // Check feature flag access - only test users can access
  if (user) {
    const isApplicationBuilder = location.pathname === '/study-progress';
    const isStudyBuddy = location.pathname === '/study-buddy';
    
    const hasAccess = true; // All users have access now
    
    if (!hasAccess) {
      const featureName = isApplicationBuilder ? 'Application Builder' : 'Ask Bo';
      return (
        <div style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, #d8f0ed 0%, #ccccff 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '48px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 16px 0'
            }}>
              Access Restricted
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '32px',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              {featureName} is currently in limited testing. Contact support for access.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <a 
                href="/"
                style={{
                  backgroundColor: '#00ced1',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Go Back to Home
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  // Profile exists - show main app with navigation - Apple-inspired
  return (
    <div style={{ position: 'relative' }}>
      {/* Enhanced Navigation Bar - Apple-inspired */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '16px 32px',
        zIndex: 1000,
        display: currentView === 'dashboard' ? 'none' : 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px'
        }}>
          {/* Home Button & Logo - Apple-inspired */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <button
              onClick={handleHomeNavigation}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '12px',
                transition: ANIMATIONS.transition,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 206, 209, 0.1)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.transform = 'scale(1)';
              }}
              title="Back to Homepage"
            >
              🏠
            </button>
            
            <h2 style={{
              ...TYPOGRAPHY.h4,
              margin: 0,
              color: COLORS.darkGreen
            }}>
              Ask Bo
            </h2>
          </div>
          
          {/* View Toggle - Apple-inspired */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            padding: '6px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
          }}>
            {[
              { id: 'chat', label: 'Bo', title: 'AI Study Mentor' },
              { id: 'dashboard', label: 'App Builder', title: 'Progress Overview' }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                title={view.title}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: currentView === view.id 
                    ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`
                    : 'transparent',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: ANIMATIONS.transition,
                  ...TYPOGRAPHY.bodySmall,
                  fontWeight: '600',
                  color: currentView === view.id ? '#ffffff' : COLORS.darkGreen,
                  boxShadow: currentView === view.id 
                    ? '0 4px 16px rgba(0, 206, 209, 0.3)'
                    : 'none',
                  textShadow: currentView === view.id 
                    ? '0 1px 2px rgba(0,0,0,0.2)'
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (currentView !== view.id) {
                    e.target.style.background = 'rgba(0, 206, 209, 0.1)';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== view.id) {
                    e.target.style.background = 'transparent';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Info & Actions - Apple-inspired */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Profile Status Indicator - Apple-inspired */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(16, 185, 129, 0.1)',
            backdropFilter: 'blur(8px)',
            padding: '8px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            transition: ANIMATIONS.transition
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '50%',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{
              ...TYPOGRAPHY.caption,
              color: COLORS.mediumGreen,
              fontWeight: '600'
            }}>Profile Active</span>
          </div>

          {/* Quick Stats - Apple-inspired */}
          {profileData && (
            <div style={{
              display: 'flex',
              gap: '16px',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              padding: '8px 16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '14px' }}>🎯</span>
                <span style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.darkGreen,
                  fontWeight: '600'
                }}>
                  {(profileData.universityTargets || profileData.universities || []).length}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '14px' }}>📚</span>
                <span style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.darkGreen,
                  fontWeight: '600'
                }}>
                  {((profileData.supercurricular?.lowLevel?.books) || []).length}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '14px' }}>💡</span>
                <span style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.darkGreen,
                  fontWeight: '600'
                }}>
                  {(profileData.knowledgeInsights || profileData.insights || []).length}
                </span>
              </div>
            </div>
          )}

          {/* Refresh Button - Apple-inspired */}
          <button
            onClick={refreshProfile}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${COLORS.primary}20`,
              borderRadius: '12px',
              padding: '10px 16px',
              cursor: 'pointer',
              ...TYPOGRAPHY.caption,
              color: COLORS.primary,
              fontWeight: '600',
              transition: ANIMATIONS.transition,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0, 206, 209, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = `linear-gradient(135deg, ${COLORS.primary}10, ${COLORS.secondary}10)`;
              e.target.style.borderColor = COLORS.primary;
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 206, 209, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.9)';
              e.target.style.borderColor = `${COLORS.primary}20`;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 206, 209, 0.1)';
            }}
          >
            <span style={{ fontSize: '14px' }}>↻</span>
            Refresh
          </button>

          {/* User Email - Apple-inspired */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '8px 14px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            maxWidth: '180px'
          }}>
            <span style={{
              ...TYPOGRAPHY.caption,
              color: COLORS.mediumGreen,
              fontWeight: '500',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.email}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        paddingTop: '0', // No padding needed - components handle their own layout
        minHeight: '100vh'
      }}>
        {currentView === 'chat' && (
          <EnhancedStudyBuddy 
            key="chat" 
            profileData={profileData} 
            onProfileUpdate={handleProfileUpdate}
          />
        )}
        {currentView === 'dashboard' && (
          <StudyProgressDashboard 
            key="dashboard" 
            profileData={profileData}
            onProfileUpdate={handleProfileUpdate}
            refreshProfile={refreshProfile}
          />
        )}
      </div>

      {/* Enhanced Quick Switch Floating Buttons - Apple-inspired */}
      <div style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        display: currentView === 'dashboard' ? 'none' : 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 999
      }}>
        {/* Home button - Apple-inspired */}
        <button
          onClick={handleHomeNavigation}
          style={{
            width: '56px',
            height: '56px',
            background: 'rgba(107, 114, 128, 0.95)',
            backdropFilter: 'blur(20px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '20px',
            boxShadow: '0 8px 32px rgba(107, 114, 128, 0.4)',
            transition: ANIMATIONS.transition,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1) translateY(-2px)';
            e.target.style.boxShadow = '0 12px 40px rgba(107, 114, 128, 0.6)';
            e.target.style.background = 'rgba(107, 114, 128, 1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1) translateY(0)';
            e.target.style.boxShadow = '0 8px 32px rgba(107, 114, 128, 0.4)';
            e.target.style.background = 'rgba(107, 114, 128, 0.95)';
          }}
          title="Back to Homepage"
        >
          🏠
        </button>

        {/* View switch button - Apple-inspired */}
        <button
          onClick={() => setCurrentView(currentView === 'chat' ? 'dashboard' : 'chat')}
          style={{
            width: '64px',
            height: '64px',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
            backdropFilter: 'blur(20px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '24px',
            boxShadow: '0 12px 40px rgba(0, 206, 209, 0.4)',
            transition: ANIMATIONS.transition,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.15) translateY(-3px)';
            e.target.style.boxShadow = '0 16px 48px rgba(0, 206, 209, 0.6)';
            e.target.style.filter = 'brightness(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1) translateY(0)';
            e.target.style.boxShadow = '0 12px 40px rgba(0, 206, 209, 0.4)';
            e.target.style.filter = 'brightness(1)';
          }}
          title={currentView === 'chat' ? 'View Dashboard' : 'Open Chat'}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}></div>
          {currentView === 'chat' ? '📊' : '💬'}
        </button>
      </div>

      {/* Add CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.8);
          }
          100% {
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default StudyBuddyApp;