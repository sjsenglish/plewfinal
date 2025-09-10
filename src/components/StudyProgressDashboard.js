import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import EnhancedUniversityTab from './EnhancedUniversityTab';
import EnhancedSupercurricularTab from './EnhancedSupercurricularTab';
import EnhancedPersonalStatementBuilder from './EnhancedPersonalStatementBuilder';
import userStorage from '../utils/userStorage'; 

// Simplified Color Palette - Only 3 colors
const COLORS = {
  primary: '#2a4442',    // Dark green for main elements
  secondary: '#5b8f8a',  // Medium green for accents  
  light: '#d8f0ed'       // Light mint for backgrounds
};

// Apple-inspired Typography System
const TYPOGRAPHY = {
  // Headings
  h1: {
    fontSize: '32px',
    fontWeight: '700', // Slightly lighter for Apple feel
    lineHeight: '1.25', // More breathing room
    letterSpacing: '-0.025em'
  },
  h2: {
    fontSize: '24px',
    fontWeight: '600', // Apple-style weight
    lineHeight: '1.35', // Better readability
    letterSpacing: '-0.015em'
  },
  h3: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '1.4',
    letterSpacing: '-0.01em'
  },
  h4: {
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '1.45', // More space
    letterSpacing: '-0.005em'
  },
  h5: {
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.5',
    letterSpacing: '0'
  },
  // Body text with improved readability
  bodyLarge: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.65', // Apple-style line height
    letterSpacing: '0'
  },
  body: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.55', // Better spacing
    letterSpacing: '0.01em'
  },
  bodySmall: {
    fontSize: '13px',
    fontWeight: '400',
    lineHeight: '1.45',
    letterSpacing: '0.01em'
  },
  // UI elements
  caption: {
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '1.35',
    letterSpacing: '0.025em'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.45',
    letterSpacing: '0.015em'
  },
  button: {
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.45',
    letterSpacing: '0.02em'
  }
};

// Custom Icons
const ICONS = {
  trophy: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftrophy.svg?alt=media&token=ac0b5d6a-9b79-4cb4-afd2-0fa07f70d443',
  toaster: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftoaster.svg?alt=media&token=744ba4bf-336d-4dd2-b2dc-25bd4df85af6',
  ghost: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20white.svg?alt=media&token=599d4414-99cf-4084-858b-5b3512557023',
  bulb: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbulb.svg?alt=media&token=1f21ae0e-764d-4b03-ba1d-f1423329c325',
  bookYellow: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook_yellow.svg?alt=media&token=d951aa02-015d-45eb-9782-9ed989aa549c',
  bookPink: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook_pink.svg?alt=media&token=eca318d2-2785-4ffe-b806-e15381734a28',
  bagback: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbagback.svg?alt=media&token=65739e08-36db-4810-951c-91641f5d0084'
};

// Background image
const BACKGROUND_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fsite%20bg.png?alt=media&token=f2f5f72f-4b54-4139-9b6e-a365232e40b6'; 

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

const StudyProgressDashboard = ({ profileData, onProfileUpdate, refreshProfile }) => {
  const location = useLocation();
  const [studyProfile, setStudyProfile] = useState(profileData || null);
  const [loading, setLoading] = useState(!profileData);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('university');
  
  // Update studyProfile when profileData changes (from Study Buddy updates)
  useEffect(() => {
    if (profileData) {
      setStudyProfile(profileData);
    }
  }, [profileData]);

  // Force a re-render periodically to catch localStorage updates from Study Buddy
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if localStorage has newer data than what we currently have
      const localProfile = userStorage.get('profileData');
      if (localProfile && localProfile.knowledgeInsights && 
          localProfile.knowledgeInsights.length > (studyProfile?.knowledgeInsights?.length || 0)) {
        // Trigger a state update to force re-render with new localStorage data
        setStudyProfile(prev => ({ ...prev, lastUpdated: Date.now() }));
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [studyProfile]);

  const windowSize = useWindowSize();

  const FUNCTIONS_BASE_URL = 'https://us-central1-plewcsat1.cloudfunctions.net';

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    // Check if we should navigate to personal statement grading
    if (tab === 'personal-statement' || tab === 'grade-statement') {
      setActiveTab('personal-statement');
      
      // Scroll to grading section after a short delay to ensure content is loaded
      setTimeout(() => {
        const gradingSection = document.querySelector('[data-grading-section]');
        if (gradingSection) {
          gradingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [location]);

  // Add CSS reset on mount
  useEffect(() => {
    const originalBodyStyle = document.body.style.cssText;
    const originalHtmlStyle = document.documentElement.style.cssText;
    
    // Remove all margins and padding from body and html
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.minHeight = '100vh';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.minHeight = '100vh';
    
    return () => {
      document.body.style.cssText = originalBodyStyle;
      document.documentElement.style.cssText = originalHtmlStyle;
    };
  }, []);

  // Sync with shared profile data
  useEffect(() => {
    if (profileData) {
      setStudyProfile(profileData);
      setLoading(false);
      setError(null);
    }
  }, [profileData]);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      // Only fetch profile if we don't have shared profile data
      if (!profileData) {
        fetchStudyProfile();
      }
    } else {
      setLoading(false);
    }
  }, [profileData]);

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error('No authenticated user');
  };

  const fetchStudyProfile = async () => {
    // Use shared refresh function if available
    if (refreshProfile) {
      try {
        setLoading(true);
        await refreshProfile();
        setError(null);
      } catch (error) {
        console.error('Error refreshing profile:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback to local fetch if no shared refresh function
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      const response = await fetch(`${FUNCTIONS_BASE_URL}/getStudyProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const result = await response.json();
      console.log('Fetched study profile:', result);
      setStudyProfile(result);
      setError(null);
    } catch (error) {
      console.error('Error fetching study profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Common background style for all states
  const backgroundStyle = {
    width: '100vw',
    height: '100vh',
    minHeight: '100vh',
    background: `url(${BACKGROUND_IMAGE}) center center / cover, linear-gradient(135deg, ${COLORS.light} 0%, ${COLORS.secondary} 50%, ${COLORS.primary} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    position: 'relative',
    animation: 'float 6s ease-in-out infinite',
    padding: '20px 0',
    boxSizing: 'border-box'
  };

  // Dashboard-specific background style - full viewport, no centering
  const dashboardBackgroundStyle = {
    width: '100vw',
    height: '100vh',
    minHeight: '100vh',
    background: `url(${BACKGROUND_IMAGE}) center center / cover, linear-gradient(135deg, ${COLORS.light} 0%, ${COLORS.secondary} 50%, ${COLORS.primary} 100%)`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    position: 'relative',
    // Removed animation to keep background still
    padding: 0,
    margin: 0,
    boxSizing: 'border-box',
    overflow: 'auto'
  };

  if (!user) {
    return (
      <div style={backgroundStyle}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.light} 0%, rgba(255, 255, 255, 0.95) 100%)`,
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 16px 64px rgba(42, 68, 66, 0.2)',
          border: `2px solid ${COLORS.secondary}`
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundImage: `url(${ICONS.toaster})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            margin: '0 auto 20px',
            opacity: 0.8
          }}></div>
          <h3 style={{ margin: '0 0 16px 0', color: COLORS.primary, fontSize: '24px', fontWeight: '700' }}>Login Required</h3>
          <p style={{ margin: '0 0 32px 0', color: COLORS.secondary, fontSize: '16px' }}>Please log in to view your study progress</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button style={{
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
              color: 'white',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 6px 20px rgba(42, 68, 66, 0.3)',
              transition: 'all 0.3s ease'
            }}>Log In</button>
            <button style={{
              background: 'transparent',
              color: COLORS.primary,
              border: `2px solid ${COLORS.primary}`,
              padding: '14px 28px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}>Sign Up</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={backgroundStyle}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid #a8dcc6'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2a4442',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading your study profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={backgroundStyle}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid #a8dcc6'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#dc2626' }}>Error Loading Profile</h3>
          <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>{error}</p>
          <button 
            onClick={fetchStudyProfile}
            style={{
              background: '#2a4442',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Safe data extraction with better error handling
  // Merge profile data from props with localStorage data to ensure insights are always visible
  const baseProfile = studyProfile?.studyProfile || studyProfile || {};
  const localStorageProfile = userStorage.get('profileData') || {};
  
  // Merge with localStorage data, prioritizing more recent data
  const profile = {
    ...baseProfile,
    ...localStorageProfile,
    // Ensure arrays are properly merged, not overwritten
    knowledgeInsights: [
      ...(baseProfile.knowledgeInsights || []),
      ...(localStorageProfile.knowledgeInsights || [])
    ].filter((insight, index, arr) => {
      // Remove duplicates based on id or content
      return index === arr.findIndex(i => 
        (i.id && insight.id && i.id === insight.id) ||
        (i.content === insight.content && i.addedAt === insight.addedAt)
      );
    }),
    supercurricular: {
      ...(baseProfile.supercurricular || {}),
      ...(localStorageProfile.supercurricular || {}),
      lowLevel: {
        ...(baseProfile.supercurricular?.lowLevel || {}),
        ...(localStorageProfile.supercurricular?.lowLevel || {}),
        books: [
          ...(baseProfile.supercurricular?.lowLevel?.books || []),
          ...(localStorageProfile.supercurricular?.lowLevel?.books || [])
        ].filter((book, index, arr) => {
          // Remove duplicates based on id or title
          return index === arr.findIndex(b => 
            (b.id && book.id && b.id === book.id) ||
            (b.title === book.title || b.name === book.name)
          );
        })
      }
    }
  };
  const conversations = studyProfile?.conversations || [];

  // Statistics with safe fallbacks
  const currentSubjects = profile.currentSubjects || profile.subjects || [];
  const universityTargets = profile.universityTargets || profile.universities || [];
  const supercurricular = profile.supercurricular || {};
  const highLevelProjects = supercurricular.highLevel || [];
  const mediumLevelActivities = supercurricular.mediumLevel || [];
  const lowLevelActivities = supercurricular.lowLevel || {};
  const books = lowLevelActivities.books || [];
  const knowledgeInsights = profile.knowledgeInsights || profile.insights || [];
  
  const totalSubjects = currentSubjects.length;
  const totalUniversityTargets = universityTargets.length;
  const totalHighLevelProjects = highLevelProjects.length;
  const totalMediumLevelActivities = mediumLevelActivities.length;
  const totalBooks = books.length;
  const completedBooks = books.filter(book => book.status === 'completed' || book.completed === true).length;
  const totalKnowledgeInsights = knowledgeInsights.length;


  const InsightsTab = () => {
    const [taggedInsights, setTaggedInsights] = useState(new Set());
    const [selectedInsights, setSelectedInsights] = useState(new Set());
    const [filter, setFilter] = useState('all'); // all, reading, academic, general

    // Initialize taggedInsights from existing profile data
    useEffect(() => {
      const initialTagged = new Set();
      knowledgeInsights.forEach(insight => {
        if (insight.taggedAsEvidence === true) {
          initialTagged.add(insight.id || insight.addedAt);
        }
      });
      setTaggedInsights(initialTagged);
    }, [knowledgeInsights]);

    const handleTagAsEvidence = (insightId) => {
      const updatedTagged = new Set(taggedInsights);
      if (taggedInsights.has(insightId)) {
        updatedTagged.delete(insightId);
      } else {
        updatedTagged.add(insightId);
      }
      setTaggedInsights(updatedTagged);
      
      // Update the insight in the profile
      const updatedProfile = { ...profile };
      const insightIndex = updatedProfile.knowledgeInsights.findIndex(i => i.id === insightId || i.addedAt === insightId);
      if (insightIndex !== -1) {
        updatedProfile.knowledgeInsights[insightIndex].taggedAsEvidence = updatedTagged.has(insightId);
        onProfileUpdate(updatedProfile);
      }
    };

    const generatePersonalStatement = () => {
      const evidenceInsights = knowledgeInsights.filter(insight => 
        taggedInsights.has(insight.id || insight.addedAt)
      );
      
      if (evidenceInsights.length === 0) {
        alert('Please tag some insights as evidence first!');
        return;
      }
      
      // Switch to personal statement tab with evidence
      setActiveTab('personal-statement');
      // You could also pass the evidence insights to the personal statement builder
    };

    // Filter insights by category
    const filteredInsights = knowledgeInsights.filter(insight => {
      if (filter === 'all') return true;
      if (filter === 'reading') return insight.category === 'reading' || insight.bookSource;
      if (filter === 'academic') return insight.category === 'academic-refinement' || insight.type === 'insight-refinement';
      if (filter === 'ps') return insight.taggedForPS === true || insight.personalStatementVersion;
      return true;
    });

    return (
      <div style={{ padding: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ ...TYPOGRAPHY.h2, marginBottom: '8px', color: COLORS.primary }}>
                Knowledge Insights
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {filteredInsights.length} of {knowledgeInsights.length} insights
              </p>
            </div>
            {taggedInsights.size > 0 && (
              <button
                onClick={generatePersonalStatement}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(42, 68, 66, 0.2)'
                }}
              >
                Generate Statement ({taggedInsights.size} insights)
              </button>
            )}
          </div>
          
          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'academic', label: 'Academic' },
              { key: 'ps', label: 'Personal Statement' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                style={{
                  background: filter === filterOption.key ? COLORS.secondary : 'rgba(255, 255, 255, 0.8)',
                  color: filter === filterOption.key ? 'white' : COLORS.primary,
                  border: `1px solid ${filter === filterOption.key ? COLORS.secondary : 'rgba(168, 220, 198, 0.3)'}`,
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {knowledgeInsights.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '16px',
            border: '1px solid rgba(168, 220, 198, 0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
            <h3 style={{ color: COLORS.primary, marginBottom: '8px' }}>No insights yet</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Start chatting with Study Buddy to capture insights from your learning journey
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredInsights.map((insight, index) => {
              const insightId = insight.id || insight.addedAt || index;
              const isTagged = taggedInsights.has(insightId);
              
              return (
                <div
                  key={insightId}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: `2px solid ${isTagged ? COLORS.secondary : 'rgba(168, 220, 198, 0.3)'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleTagAsEvidence(insightId)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: '0 0 12px 0', 
                        color: COLORS.primary, 
                        fontWeight: '500',
                        lineHeight: '1.5',
                        fontSize: '15px'
                      }}>
                        {insight.content || insight.concept || 'Insight captured'}
                      </p>
                      
                      {insight.originalThought && (
                        <div style={{ 
                          margin: '0 0 10px 0', 
                          padding: '8px 12px',
                          background: 'rgba(107, 114, 128, 0.1)',
                          borderRadius: '6px',
                          borderLeft: '3px solid #6b7280'
                        }}>
                          <p style={{ 
                            margin: 0, 
                            color: '#6b7280', 
                            fontSize: '13px',
                            fontStyle: 'italic'
                          }}>
                            Original thought: {insight.originalThought}
                          </p>
                        </div>
                      )}
                      
                      {insight.application && (
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          color: '#059669', 
                          fontSize: '13px'
                        }}>
                          🎯 Application: {insight.application}
                        </p>
                      )}
                      
                      {insight.evidence && (
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          color: '#dc2626', 
                          fontSize: '13px'
                        }}>
                          📋 Evidence: {insight.evidence}
                        </p>
                      )}
                      
                      {insight.bookSource && (
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          color: '#8b5cf6', 
                          fontSize: '13px'
                        }}>
                          📚 From: {insight.bookSource}
                        </p>
                      )}
                      
                      {insight.personalStatementVersion && (
                        <div style={{
                          margin: '8px 0',
                          padding: '8px 12px',
                          background: 'rgba(168, 220, 198, 0.2)',
                          borderRadius: '6px',
                          borderLeft: '3px solid #a8dcc6'
                        }}>
                          <p style={{
                            margin: 0,
                            color: COLORS.primary,
                            fontSize: '13px',
                            fontWeight: '500'
                          }}>
                            Personal Statement Version: {insight.personalStatementVersion}
                          </p>
                        </div>
                      )}
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        alignItems: 'center',
                        marginTop: '12px',
                        fontSize: '12px',
                        color: '#9ca3af'
                      }}>
                        <span>{insight.source || 'Study Buddy'}</span>
                        {insight.addedAt && (
                          <span>• {new Date(insight.addedAt).toLocaleDateString()}</span>
                        )}
                        <span>• {insight.type || 'insight'}</span>
                      </div>
                    </div>
                    
                    <button
                      style={{
                        background: isTagged ? COLORS.secondary : 'rgba(168, 220, 198, 0.2)',
                        color: isTagged ? 'white' : COLORS.primary,
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        marginLeft: '16px',
                        flexShrink: 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagAsEvidence(insightId);
                      }}
                    >
                      {isTagged ? '✓ Evidence' : '+ Tag as Evidence'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const AcademicTab = () => {
    const [showSubjectForm, setShowSubjectForm] = useState(false);
    const [newSubject, setNewSubject] = useState({
      name: '',
      examBoard: '',
      currentGrade: '',
      targetGrade: '',
      specification: '',
      topics: [],
      progress: {}
    });
    const [selectedSubject, setSelectedSubject] = useState(null);

    const handleAddSubject = () => {
      if (!newSubject.name.trim()) return;

      const updatedProfile = { ...profile };
      const subjects = updatedProfile.currentSubjects || updatedProfile.subjects || [];
      
      const subjectToAdd = {
        ...newSubject,
        id: Date.now(),
        topics: newSubject.topics.filter(topic => topic.trim()),
        dateAdded: new Date().toISOString()
      };

      updatedProfile.currentSubjects = [...subjects, subjectToAdd];
      onProfileUpdate(updatedProfile);

      setNewSubject({
        name: '',
        examBoard: '',
        currentGrade: '',
        targetGrade: '',
        specification: '',
        topics: [],
        progress: {}
      });
      setShowSubjectForm(false);
    };

    const handleRemoveSubject = (subjectId) => {
      const updatedProfile = { ...profile };
      const subjects = updatedProfile.currentSubjects || updatedProfile.subjects || [];
      updatedProfile.currentSubjects = subjects.filter(subject => 
        (subject.id !== subjectId) && (subject.name !== subjectId)
      );
      onProfileUpdate(updatedProfile);
    };

    const handleTopicAdd = (topic) => {
      if (!topic.trim()) return;
      setNewSubject(prev => ({
        ...prev,
        topics: [...prev.topics, topic.trim()]
      }));
    };

    const handleTopicRemove = (index) => {
      setNewSubject(prev => ({
        ...prev,
        topics: prev.topics.filter((_, i) => i !== index)
      }));
    };

    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundImage: `url(${ICONS.toaster})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              marginRight: '20px'
            }}></div>
            <div>
              <h2 style={{ 
                margin: '0 0 8px 0', 
                color: COLORS.primary, 
                ...TYPOGRAPHY.h1
              }}>
                Academic Profile & A-Level Subjects
              </h2>
              <p style={{ 
                margin: '0', 
                color: '#6b7280', 
                ...TYPOGRAPHY.bodyLarge
              }}>
                Manage your A-Level subjects, specifications, and track progress
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSubjectForm(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.secondary} 100%)`,
              color: 'white',
              ...TYPOGRAPHY.button,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 206, 209, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(0, 206, 209, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 206, 209, 0.3)';
            }}
          >
            ➕ Add Custom Subject
          </button>
        </div>

        {/* Instructions Banner */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.light} 0%, rgba(255, 255, 255, 0.9) 100%)`,
          border: `2px solid ${COLORS.secondary}`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(91, 143, 138, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ fontSize: '24px' }}>📚</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                color: COLORS.primary, 
                ...TYPOGRAPHY.h3
              }}>
                Subject Management Options
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ ...TYPOGRAPHY.body, color: '#374151' }}>
                  <strong style={{ ...TYPOGRAPHY.label }}>✨ Chat-based:</strong> Tell Bo about your subjects: "I'm taking A-Level Mathematics with Edexcel..."
                </div>
                <div style={{ ...TYPOGRAPHY.body, color: '#374151' }}>
                  <strong style={{ ...TYPOGRAPHY.label }}>📝 Manual entry:</strong> Use the "Add Custom Subject" button to manually enter any A-Level subject
                </div>
                <div style={{ ...TYPOGRAPHY.body, color: '#374151' }}>
                  <strong style={{ ...TYPOGRAPHY.label }}>🎯 Custom specs:</strong> Add specification points, topics, and track progress for any subject
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Subjects Grid */}
        {currentSubjects.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {currentSubjects.map((subject, index) => (
              <div key={subject.id || index} style={{
                background: `linear-gradient(135deg, ${COLORS.light} 0%, ${COLORS.light} 100%)`,
                borderRadius: '16px',
                padding: '24px',
                border: `2px solid ${COLORS.primary}`,
                boxShadow: '0 8px 32px rgba(34, 20, 104, 0.15)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ 
                      margin: '0 0 6px 0', 
                      color: COLORS.primary, 
                      ...TYPOGRAPHY.h4
                    }}>
                      {subject.name || subject}
                    </h4>
                    {subject.examBoard && (
                      <div style={{ 
                        background: COLORS.primary, 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        ...TYPOGRAPHY.caption,
                        display: 'inline-block',
                        marginBottom: '8px'
                      }}>
                        {subject.examBoard}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSubject(subject.id || subject.name || subject)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#ef4444',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#ef4444';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#ef4444';
                    }}
                  >
                    Remove
                  </button>
                </div>

                {/* Grades */}
                {(subject.currentGrade || subject.targetGrade || subject.grade) && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {(subject.currentGrade || subject.grade) && (
                        <div style={{ ...TYPOGRAPHY.caption }}>
                          <strong style={{ color: COLORS.primary }}>Current:</strong> {subject.currentGrade || subject.grade}
                        </div>
                      )}
                      {subject.targetGrade && (
                        <div style={{ ...TYPOGRAPHY.caption }}>
                          <strong style={{ color: COLORS.primary }}>Target:</strong> {subject.targetGrade}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Specification & Topics */}
                {subject.specification && (
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ 
                      color: COLORS.primary, 
                      ...TYPOGRAPHY.caption,
                      display: 'block',
                      marginBottom: '4px'
                    }}>Specification:</strong>
                    <div style={{ 
                      color: '#6b7280', 
                      ...TYPOGRAPHY.bodySmall
                    }}>
                      {subject.specification}
                    </div>
                  </div>
                )}

                {subject.topics && subject.topics.length > 0 && (
                  <div>
                    <strong style={{ 
                      color: COLORS.primary, 
                      ...TYPOGRAPHY.caption, 
                      display: 'block', 
                      marginBottom: '8px' 
                    }}>
                      Topics & Specification Points:
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {subject.topics.map((topic, idx) => (
                        <span key={idx} style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          color: COLORS.primary,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          ...TYPOGRAPHY.caption,
                          border: `1px solid ${COLORS.primary}30`
                        }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '48px 32px',
            borderRadius: '16px',
            border: '1px solid #a8dcc6',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              color: COLORS.primary, 
              ...TYPOGRAPHY.h3
            }}>
              No A-Level Subjects Added
            </h3>
            <p style={{ 
              margin: '0', 
              color: '#6b7280', 
              ...TYPOGRAPHY.body
            }}>
              Add your A-Level subjects to track progress and manage specifications
            </p>
          </div>
        )}

        {/* Subject Addition Modal */}
        {showSubjectForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
              <h2 style={{ 
                margin: '0 0 24px 0', 
                color: COLORS.primary, 
                ...TYPOGRAPHY.h2
              }}>
                Add Custom A-Level Subject
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    color: COLORS.primary,
                    ...TYPOGRAPHY.label
                  }}>
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mathematics, Further Mathematics, Physics"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = COLORS.secondary}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      color: COLORS.primary,
                      ...TYPOGRAPHY.label
                    }}>
                      Exam Board
                    </label>
                    <select
                      value={newSubject.examBoard}
                      onChange={(e) => setNewSubject(prev => ({ ...prev, examBoard: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = COLORS.secondary}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    >
                      <option value="">Select exam board</option>
                      <option value="AQA">AQA</option>
                      <option value="Edexcel">Edexcel</option>
                      <option value="OCR">OCR</option>
                      <option value="CCEA">CCEA</option>
                      <option value="WJEC">WJEC</option>
                      <option value="CIE">CIE (Cambridge International)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      color: COLORS.primary,
                      ...TYPOGRAPHY.label
                    }}>
                      Current Grade
                    </label>
                    <select
                      value={newSubject.currentGrade}
                      onChange={(e) => setNewSubject(prev => ({ ...prev, currentGrade: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = COLORS.secondary}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    >
                      <option value="">Select grade</option>
                      <option value="A*">A*</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="Predicted">Predicted</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    color: COLORS.primary,
                    ...TYPOGRAPHY.label
                  }}>
                    Specification/Syllabus Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 9MA0 (Edexcel), H240 (OCR)"
                    value={newSubject.specification}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, specification: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = COLORS.secondary}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    color: COLORS.primary,
                    ...TYPOGRAPHY.label
                  }}>
                    Topics & Specification Points
                  </label>
                  <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="Add a topic or specification point"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleTopicAdd(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.target.previousElementSibling;
                          handleTopicAdd(input.value);
                          input.value = '';
                        }}
                        style={{
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: COLORS.secondary,
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                    
                    {newSubject.topics.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {newSubject.topics.map((topic, idx) => (
                          <span key={idx} style={{
                            background: COLORS.secondary + '20',
                            color: COLORS.primary,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {topic}
                            <button
                              onClick={() => handleTopicRemove(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: '0 2px'
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button
                  onClick={() => setShowSubjectForm(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    ...TYPOGRAPHY.button,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubject}
                  disabled={!newSubject.name.trim()}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: newSubject.name.trim() ? COLORS.secondary : '#d1d5db',
                    color: 'white',
                    ...TYPOGRAPHY.button,
                    cursor: newSubject.name.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Subject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const UniversityTab = () => (
    <EnhancedUniversityTab 
      profile={profile} 
      currentSubjects={currentSubjects}
      onProfileUpdate={onProfileUpdate}
    />
  );

  const SupercurricularTab = () => (
  <EnhancedSupercurricularTab 
    key={`supercurricular-${JSON.stringify(profile).substring(0, 20)}`}
    profile={profile} 
    currentSubjects={currentSubjects}
    universityTargets={universityTargets}
    onProfileUpdate={onProfileUpdate}
  />
);




  return (
    <div style={dashboardBackgroundStyle}>
      {/* Floating background graphics */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '120%',
        height: '120%',
        background: `
          radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 30%),
          radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 25%)
        `,
        animation: 'floatBackground 8s ease-in-out infinite',
        zIndex: 0
      }}></div>

      <div style={{
        position: 'absolute',
        top: '-5%',
        left: '-5%',
        width: '110%',
        height: '110%',
        background: `
          radial-gradient(circle at 40% 60%, rgba(139, 207, 255, 0.2) 0%, transparent 35%),
          radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.15) 0%, transparent 30%)
        `,
        animation: 'floatBackground 6s ease-in-out infinite reverse',
        zIndex: 0
      }}></div>

      {/* Main container - full viewport layout */}
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        minHeight: '100vh',
        background: '#ffffff',
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        margin: '0 auto',
        padding: '0'
      }}>
        {/* Header with Navigation */}
        <div style={{
          padding: '32px 32px 24px 32px', // Extra top padding to prevent cut-off
          borderBottom: '1px solid #e5e7eb', // Clean light gray border
          flexShrink: 0,
          background: '#ffffff', // Pure white background
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', // Subtle shadow
          minHeight: '80px' // Ensure minimum height for visibility
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Navigation buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#374151',
                  fontWeight: '500',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f9fafb';
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                }}
                title="Back to Homepage"
              >
                Home
              </button>
              
              <div style={{ marginLeft: '8px' }}>
                <h1 style={{
                  margin: '0 0 4px 0', // Small margin for better spacing
                  ...TYPOGRAPHY.h2,
                  color: COLORS.primary
                }}>Application Builder</h1>
                <p style={{
                  margin: '0',
                  ...TYPOGRAPHY.bodySmall,
                  color: '#6b7280',
                  opacity: 0.8 // Subtle opacity for hierarchy
                }}>Talk to Bo and build your application</p>
              </div>
            </div>

            
            {/* View switcher */}
            <div style={{
              display: 'flex',
              background: '#f3f4f6',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
              <button
                onClick={() => window.location.href = '/study-buddy'}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#6b7280',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
                title="Switch to Chat"
              >
                Bo
              </button>
              <button
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: '#ffffff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                title="Current: Dashboard"
              >
                App Builder
              </button>
            </div>
          </div>

          {/* User info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <span>{user.email}</span>
            {(profile.profileVersion || profile.version) && (
              <span style={{
                background: '#f3f4f6',
                color: '#6b7280',
                padding: '3px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '500',
                border: '1px solid #a8dcc6'
              }}>v{profile.profileVersion || profile.version}</span>
            )}
            <button 
              onClick={fetchStudyProfile}
              style={{
                background: '#2a4442',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '500'
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs - Full width with clean spacing */}
        <div style={{
          display: 'flex',
          background: '#ffffff',
          padding: '16px 32px',
          margin: '0',
          borderRadius: '0',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0,
          gap: '12px',
          boxShadow: '0 1px 0 rgba(0, 0, 0, 0.05)'
        }}>
{[
  // { id: 'academic', label: 'Academic' }, // Hidden from view
  { id: 'insights', label: 'Insights' },
  { id: 'university', label: 'University' },
  { id: 'supercurricular', label: 'Portfolio' },
  { id: 'personal-statement', label: 'Statement' }
].filter(tab => tab).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 20px',
                border: activeTab === tab.id ? 'none' : '1px solid #d1d5db',
                background: activeTab === tab.id ? '#374151' : '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: '500',
                color: activeTab === tab.id ? '#ffffff' : '#374151',
                boxShadow: activeTab === tab.id 
                  ? '0 2px 4px rgba(0, 0, 0, 0.1)' 
                  : '0 1px 2px rgba(0, 0, 0, 0.05)',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = '#f9fafb';
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.color = '#374151';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.color = '#374151';
                  e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Instructions Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '32px',
          margin: '24px 32px',
          border: '1px solid rgba(168, 220, 198, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
          maxWidth: '1400px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '32px' 
          }}>
            {/* Getting Started Section */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  🚀
                </div>
                <h3 style={{
                  margin: '0',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: COLORS.primary,
                  letterSpacing: '-0.01em'
                }}>Getting Started</h3>
              </div>
              <div style={{ paddingLeft: '52px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    1
                  </div>
                  <p style={{
                    margin: '0',
                    color: '#374151',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>Ask Bo for book recommendations, insights, project suggestions, and more.</p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    2
                  </div>
                  <p style={{
                    margin: '0',
                    color: '#374151',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>Request that Bo save your insights, books, and projects to your profile (this lets you see them in your app builder)</p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '0'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    3
                  </div>
                  <p style={{
                    margin: '0',
                    color: '#374151',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>Alternatively, manually add any existing projects you have</p>
                </div>
              </div>
            </div>

            {/* Building Your Statement Section */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}>
                  ✏️
                </div>
                <h3 style={{
                  margin: '0',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: COLORS.primary,
                  letterSpacing: '-0.01em'
                }}>Building Your Statement</h3>
              </div>
              <div style={{ paddingLeft: '52px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    1
                  </div>
                  <p style={{
                    margin: '0',
                    color: '#374151',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>Tag projects or books with "PS" if you want to use them in your statement</p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    2
                  </div>
                  <p style={{
                    margin: '0',
                    color: '#374151',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>Select your evidence</p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '0'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    3
                  </div>
                  <p style={{
                    margin: '0',
                    color: '#374151',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>Click "Generate"</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area with Apple-inspired spacing */}
        <div style={{
          flex: 1,
          padding: '32px', // More generous padding
          overflow: 'auto',
          ...TYPOGRAPHY.body,
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.02)' // Subtle background differentiation
        }}>
          {/* {activeTab === 'academic' && <AcademicTab />} */}
          {activeTab === 'insights' && <InsightsTab />}
          {activeTab === 'university' && <UniversityTab />}
          {activeTab === 'supercurricular' && <SupercurricularTab />}
          {activeTab === 'personal-statement' && <EnhancedPersonalStatementBuilder profile={studyProfile} onProfileUpdate={onProfileUpdate} />}
        </div>
      </div>

      <style>{`
        @keyframes backgroundMove {
          0%, 100% {
            background-position: 0% 50%;
            transform: scale(1);
          }
          25% {
            background-position: 25% 25%;
            transform: scale(1.02);
          }
          50% {
            background-position: 100% 50%;
            transform: scale(1);
          }
          75% {
            background-position: 75% 75%;
            transform: scale(1.02);
          }
        }

        @keyframes float {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes floatBackground {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-10px, -5px) scale(1.02);
          }
          66% {
            transform: translate(5px, -10px) scale(0.98);
          }
        }

        .overview-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2) !important;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StudyProgressDashboard;