import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { InstantSearch, Stats, Hits, Configure } from 'react-instantsearch';
import './firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { StripeProvider } from './contexts/StripeContext';
// Feature flags removed - all features now enabled for all users

// Import components
import './App.css';
import './korean-fonts.css';
import HitWrapper from './components/HitWrapper';
import Navbar from './components/Navbar';
import Login from './components/Login';
import SignUp from './components/SignUp';
import { CommunityPage } from './components/CommunityPage';
import { QuestionPackPage } from './components/QuestionPackPage';
import { ProfilePage } from './components/ProfilePage';
import PackViewer from './components/PackViewer';
import SuccessPage from './components/SuccessPage';
import QuizCreator from './components/QuizCreator';
import QuizTaking from './components/QuizTaking';
import QuizResults from './components/QuizResults';
// import LiveLeaderboard from './components/LiveLeaderboard'; // HIDDEN - Leaderboard functionality disabled
import TestPage from './components/TestPage';
import { ErrorBoundary } from './components/ui';
import SubscriptionPlansPage from './components/SubscriptionPlansPage';
import PremiumDashboard from './components/PremiumDashboard';
import CustomSearchBox from './components/CustomSearchBox';
import PracticeMode from './components/PracticeMode';
import PasswordResetConfirm from './components/PasswordResetConfirm';
import CommunitySearch from './components/CommunitySearch';
import AdminQuestionUpload from './components/AdminQuestionUpload';
import SubmitQuestionForm from './components/SubmitQuestionForm';
import LearnContentAdmin from './components/LearnContentAdmin';
// import MathsSubmitQuestionForm from './components/MathsSubmitQuestionForm'; // HIDDEN
// import MathsFilters from './components/MathsFilters'; // HIDDEN
import KoreanEnglishFilters from './components/KoreanEnglishFilters';
// import VocabularySearch from './components/VocabularySearch';
import VocabularyPinterest from './components/VocabularyPinterest';
import VideoStreaming from './components/VideoStreaming';
import DemoMode from './components/DemoMode';
// import StudyBuddyApp from './components/StudyBuddyApp'; // HIDDEN - Ask Bo and Application Builder
import FeatureFlagDebug from './components/FeatureFlagDebug';
// import EnhancedPersonalStatementGrader from './components/EnhancedPersonalStatementGrader'; // HIDDEN
import DebugTest from './components/DebugTest';
import AdminSetup from './components/AdminSetup';
import AdminPackCreator from './components/AdminPackCreator';

// Create Quiz Context to manage navbar visibility
const QuizContext = createContext();

export const useQuizContext = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuizContext must be used within a QuizProvider');
  }
  return context;
};

const QuizProvider = ({ children }) => {
  const [isQuizActive, setIsQuizActive] = useState(false);

  const showQuiz = useCallback(() => {
    setIsQuizActive(true);
  }, []);

  const hideQuiz = useCallback(() => {
    setIsQuizActive(false);
  }, []);

  return (
    <QuizContext.Provider value={{ isQuizActive, showQuiz, hideQuiz }}>
      {children}
    </QuizContext.Provider>
  );
};

let searchClient;
try {
  if (process.env.REACT_APP_ALGOLIA_APP_ID && process.env.REACT_APP_ALGOLIA_SEARCH_KEY) {
    searchClient = algoliasearch(
      process.env.REACT_APP_ALGOLIA_APP_ID,
      process.env.REACT_APP_ALGOLIA_SEARCH_KEY
    );
  } else {
    console.error('❌ Missing Algolia environment variables. Please check your .env file.');
    // Create a mock client to prevent crashes
    searchClient = {
      search: () => Promise.resolve({ hits: [], nbHits: 0 }),
      searchForFacetValues: () => Promise.resolve({ facetHits: [] })
    };
  }
} catch (error) {
  console.error('❌ Failed to initialize Algolia client:', error);
  // Create a mock client to prevent crashes
  searchClient = {
    search: () => Promise.resolve({ hits: [], nbHits: 0 }),
    searchForFacetValues: () => Promise.resolve({ facetHits: [] })
  };
}

if (!process.env.REACT_APP_OPENAI_API_KEY) {
  console.warn('⚠️ Missing OpenAI API key. Vocabulary features will have limited functionality.');
}

// Updated SUBJECTS - Korean-English, Vocabulary, and Community
const SUBJECTS = {
  'korean-english': {
    index: 'korean-english-question-pairs',
    theme: 'korean-english-theme',
    bannerText: 'master the CSAT through practise questions',
    displayName: '문제은행',
    searchType: 'algolia'
  },
  vocabulary: {
    theme: 'vocabulary-theme',
    bannerText: 'master the vocab you need for exams',
    displayName: 'Vocabulary',
    searchType: 'firebase'
  },
  community: {
    index: 'plewcommunity',
    theme: 'community-theme',
    bannerText: 'get help with real student questions and applications',
    displayName: 'Community',
    searchType: 'pinecone'
  }
};

const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div style={{ textAlign: 'center', color: '#6b5ca5' }}>
      <div style={{
        width: '40px', height: '40px', border: '4px solid #f3f3f3',
        borderTop: '4px solid #6b5ca5', borderRadius: '50%',
        animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto',
      }} />
      <div>buffering...</div>
    </div>
  </div>
);

// Fixed Video Popup Component with correct YouTube embed URL
const VideoPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '40px'
  };

  const containerStyle = {
    position: 'relative',
    width: '80vw',
    maxWidth: '900px',
    aspectRatio: '16 / 9',
    background: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
  };

  const contentStyle = {
    width: '100%',
    height: '100%',
    position: 'relative'
  };

  const iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '-15px',
    right: '-15px',
    background: '#ff4757',
    color: 'white',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 10001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(255, 71, 87, 0.4)',
    transition: 'all 0.3s ease'
  };

  // Mobile responsive adjustments
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    overlayStyle.padding = '20px';
    containerStyle.width = '90vw';
    closeButtonStyle.top = '-10px';
    closeButtonStyle.right = '-10px';
    closeButtonStyle.width = '35px';
    closeButtonStyle.height = '35px';
    closeButtonStyle.fontSize = '16px';
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        <button 
          style={closeButtonStyle} 
          onClick={onClose}
          onMouseEnter={(e) => {
            e.target.style.background = '#ff3742';
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 16px rgba(255, 71, 87, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#ff4757';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(255, 71, 87, 0.4)';
          }}
        >
          ✕
        </button>
        <div style={contentStyle}>
          <iframe
            src="https://www.youtube.com/embed/eKqn5_zBZu4?autoplay=1&rel=0&modestbranding=1"
            title="ExamRizz Introduction"
            style={iframeStyle}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
};

// Updated Subject Toggle Component with daily updates indicator
const SubjectToggle = ({ currentSubject, onSubjectChange }) => {
  return (
    <div className="subject-toggle-container">
      <div className="subject-toggle">
        {Object.entries(SUBJECTS).map(([key, subject]) => (
          <button
            key={key}
            className={`subject-toggle-button ${currentSubject === key ? 'active' : ''} ${
              (key === 'maths' || key === 'community') ? 'has-indicator' : ''
            }`}
            onClick={() => onSubjectChange(key)}
            title={subject.displayName}
          >
            {subject.displayName}
            {(key === 'maths' || key === 'community') && (
              <div className="daily-updates-indicator">
                <div className="pulse-dot"></div>
                <span className="update-text">daily updates</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Updated SearchPage component with MathsFilters integration
const SearchPage = ({ currentSubject, subjectConfig, bannerText, user, handleSubjectChange }) => {
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [showDemoMode, setShowDemoMode] = useState(false);
  // const [showPSGrader, setShowPSGrader] = useState(false); // HIDDEN
  const [koreanEnglishFilters, setKoreanEnglishFilters] = useState({});


  const handleCloseVideo = () => {
    setShowVideoPopup(false);
  };

  // Handle filter changes for Korean-English subject  
  const handleKoreanEnglishFiltersChange = (filters) => {
    try {
      console.log('Received Korean-English filters in App.js:', filters);
      setKoreanEnglishFilters(filters || {});
    } catch (error) {
      console.error('Error handling Korean-English filters:', error);
      setKoreanEnglishFilters({});
    }
  };

// Replace your current buildAlgoliaFilters function in App.js with this:

const buildAlgoliaFilters = (filters) => {
  try {
    if (!filters || typeof filters !== 'object') {
      return '';
    }
    
    const filterArray = [];
    
    // Handle each filter type with proper field mapping
    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      try {
        if (filterValue && typeof filterValue === 'string' && filterValue.trim() !== '') {
          // Check if the filter value is already properly formatted (contains field:value pattern)
          if (filterValue.includes(':')) {
            // Already properly formatted filter string from MathsFilters
            filterArray.push(filterValue);
          } else {
            // Legacy format - convert to proper Algolia filter format
            const cleanValue = String(filterValue).replace(/"/g, '').trim();
            switch (filterKey) {
              case 'year':
                filterArray.push(`paper_info.year:"${cleanValue}"`);
                break;
              case 'month':
                filterArray.push(`paper_info.month:"${cleanValue}"`);
                break;
              case 'paperTitle':
                filterArray.push(`paper_info.paper_title:"${cleanValue}"`);
                break;
              case 'specTopic':
                filterArray.push(`spec_topic:"${cleanValue}"`);
                break;
              case 'questionTopic':
                filterArray.push(`question_topic:"${cleanValue}"`);
                break;
              default:
                // For any other simple filters
                filterArray.push(`${filterKey}:"${cleanValue}"`);
                break;
            }
          }
        }
      } catch (filterError) {
        console.warn('Error processing filter:', filterKey, filterValue, filterError);
      }
    });
    
    const result = filterArray.join(' AND ');
    console.log('Built Algolia filters:', result);
    return result;
  } catch (error) {
    console.error('Error building Algolia filters:', error);
    return '';
  }
};


  const statsComponent = useMemo(() => (
    <Stats translations={{
      stats(nbHits, processingTimeMS) {
        try {
          const hits = Number(nbHits) || 0;
          const time = Number(processingTimeMS) || 0;
          return hits === 0
            ? '🚫 No results'
            : `✅ ${hits.toLocaleString()} results found in ${time.toLocaleString()}ms`;
        } catch (error) {
          console.error('Error formatting stats:', error);
          return 'Search results loading...';
        }
      },
    }} />
  ), []);

  // Only check for index if using Algolia search
  if (subjectConfig.searchType === 'algolia' && !subjectConfig?.index) {
    return <div className="container" style={{ padding: '2rem 0' }}><h1>buffering .. </h1></div>;
  }

  // Main component JSX
  const headerContent = (
    <header className="modern-main-header">
      {/* Floating decorations */}
      <div className="floating-decoration decoration-left">
        <img src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/ghost_couch.svg?alt=media&token=6def55fb-aa28-48b7-8262-d40e1acc9561" alt="Ghost couch" width="100" height="100" />
      </div>
      <div className="floating-decoration decoration-right">
        <img src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/ghost_couch.svg?alt=media&token=6def55fb-aa28-48b7-8262-d40e1acc9561" alt="Ghost couch" width="100" height="100" />        
      </div>
      
      {/* Header Action Buttons Container */}
      <div className="header-actions-container">
      </div>

      {/* Social links */}
      <div className="modern-header-social">
        <a href="https://www.youtube.com/@examrizz." target="_blank" rel="noopener noreferrer" className="modern-social-link youtube-link" aria-label="YouTube Channel">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
        <a href="https://www.tiktok.com/@examrizz" target="_blank" rel="noopener noreferrer" className="modern-social-link tiktok-link" aria-label="TikTok Profile">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        </a>
        <a href="https://discord.gg/examrizzsearch" target="_blank" rel="noopener noreferrer" className="discord-enhanced-button" aria-label="Discord Server">
          <svg width="24" height="24" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54.1,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.34,46,96.13,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          <span>ask us anything</span>
        </a>
      </div>

      <div className="container">
        <div className="modern-header-content">
          {/* Subject Toggle */}
          <SubjectToggle 
            currentSubject={currentSubject}
            onSubjectChange={handleSubjectChange}
          />

          <div className="brand-section">
            <div className="brand-title-container">
              <h1 className="modern-brand-title">
                옥스포드 영어 - PLEW
              </h1>
            </div>
            <div className="brand-glow"></div>
          </div>
          
          {/* Dynamic typing section */}
          <div className="modern-typing-container">
            <span className="typing-text">{bannerText}</span>
            <span className="modern-cursor">|</span>
          </div>

          {/* Grade My Personal Statement Button - HIDDEN */}

          {/* Submit Question Button - only for Community */}
          {currentSubject === 'community' && (
            <div className="submit-question-cta">
              <a 
                href="/submit-question" 
                className="submit-question-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                submit a question
              </a>
            </div>
          )}

{/* Search bar - only show in header for Algolia search */}
{subjectConfig.searchType === 'algolia' && (
  <div className="header-search-container">
    <CustomSearchBox
      placeholder={`search ${subjectConfig.displayName.toLowerCase()} questions...`}
      className="header-searchbox"
      showSearchIcon={true}
      showClearButton={true}
      autoFocus={false}
    />
  </div>
)}

{/* Demo button for TSA - separate container below search */}
{currentSubject === 'tsa' && subjectConfig.searchType === 'algolia' && (
  <div className="demo-button-container">
    <button 
      onClick={() => setShowDemoMode(true)}
      className="see-how-it-works-button-new exact-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
      try question pack demo
    </button>
  </div>
)}
          
          {/* CTA for non-logged in users */}
          {!user && (
            <div className="modern-header-cta">
              <a href="/signup" className="modern-signup-button">
                <span>sign up for free</span>
                <div className="button-glow"></div>
              </a>
              <div className="coming-soon-message">
                <span>A Level subjects coming soon...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  // For Algolia search, we need InstantSearch wrapper around the entire component
  if (subjectConfig && subjectConfig.searchType === 'algolia' && subjectConfig.index) {
    try {
      return (
        <>
          <InstantSearch 
            key={`${currentSubject}-${subjectConfig.index}`} 
            indexName={subjectConfig.index} 
            searchClient={searchClient} 
            future={{ preserveSharedStateOnUnmount: false }}
          >
            {/* Configure Algolia with filters */}
            <Configure 
              key={`filters-${currentSubject}-${JSON.stringify(currentSubject === 'korean-english' ? koreanEnglishFilters : {})}`}
              filters={buildAlgoliaFilters(currentSubject === 'korean-english' ? koreanEnglishFilters : {})} 
            />
            
            {headerContent}

            {/* Search Results Section - ONLY for Algolia subjects */}
            <div className="modern-search-wrapper">
              <div className="container">
                {/* Add KoreanEnglishFilters component for Korean-English subject */}
                {currentSubject === 'korean-english' && user && (
                  <KoreanEnglishFilters 
                    onFiltersChange={handleKoreanEnglishFiltersChange}
                    currentFilters={koreanEnglishFilters}
                  />
                )}

                {/* Only render Algolia components here - NO VocabularyPinterest */}
                <div className="results-container">
                  <div className="stats-container">{statsComponent}</div>
                  <div className="hits-container">
                    {user && <Hits hitComponent={HitWrapper} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Popout Components */}
            {/* <LiveLeaderboard subject={currentSubject} /> */}
          </InstantSearch>

          {/* Video Popup */}
          <VideoPopup isOpen={showVideoPopup} onClose={handleCloseVideo} />
          {/* Demo Mode */}
          {showDemoMode && (
            <DemoMode onClose={() => setShowDemoMode(false)} />
          )}
        </>
      );
    } catch (error) {
      console.error('Error rendering Algolia search:', error);
      // Fallback to basic header if InstantSearch fails
      return (
        <>
          {headerContent}
          <div className="modern-search-wrapper">
            <div className="container">
              <div className="error-message" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                Search temporarily unavailable. Please refresh the page.
              </div>
            </div>
          </div>
        </>
      );
    }
  }

  // For Firebase search (Vocabulary), render component directly
  if (subjectConfig && subjectConfig.searchType === 'firebase') {
    try {
      return (
        <>
          {headerContent}

          {/* Vocabulary Pinterest Interface */}
          <div className="modern-search-wrapper">
            <div className="container">
              <VocabularyPinterest key={`vocab-${currentSubject}`} />
            </div>
          </div>

          {/* Video Popup */}
          <VideoPopup isOpen={showVideoPopup} onClose={handleCloseVideo} />
          {/* Demo Mode */}
          {showDemoMode && (
            <DemoMode onClose={() => setShowDemoMode(false)} />
          )}
        </>
      );
    } catch (error) {
      console.error('Error rendering vocabulary search:', error);
      return (
        <>
          {headerContent}
          <div className="modern-search-wrapper">
            <div className="container">
              <div className="error-message" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                Vocabulary search temporarily unavailable. Please refresh the page.
              </div>
            </div>
          </div>
        </>
      );
    }
  }

  // For Pinecone search (Community) or fallback, no InstantSearch wrapper needed
  try {
    return (
      <>
        {headerContent}

        {/* Community Search Interface */}
        <div className="modern-search-wrapper">
          <div className="container">
            <CommunitySearch 
              key={`community-${currentSubject}`}
              user={user} 
              placeholder={`search ${(subjectConfig && subjectConfig.displayName) ? subjectConfig.displayName.toLowerCase() : 'community'} questions...`}
            />
          </div>
        </div>

        {/* Popout Components */}
        {/* <LiveLeaderboard subject={currentSubject} /> */}

        {/* Video Popup */}
        <VideoPopup isOpen={showVideoPopup} onClose={handleCloseVideo} />
        {/* Demo Mode */}
        {showDemoMode && (
          <DemoMode onClose={() => setShowDemoMode(false)} />
        )}

        {/* Personal Statement Grader - HIDDEN */}

        {/* Add CSS for the grading button */}
        <style jsx>{`
          .grading-button-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }
          
          .grading-locked-message {
            font-size: 11px;
            color: #999;
            font-weight: 400;
            text-align: center;
            white-space: nowrap;
            opacity: 0.8;
          }
          
          @media (max-width: 768px) {
            .grading-button-container {
              gap: 2px;
            }
            
            .grading-locked-message {
              font-size: 10px;
            }
          }
        `}</style>
      </>
    );
  } catch (error) {
    console.error('Error rendering community search:', error);
    return (
      <>
        {headerContent}
        <div className="modern-search-wrapper">
          <div className="container">
            <div className="error-message" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
              Search temporarily unavailable. Please refresh the page.
            </div>
          </div>
        </div>
      </>
    );
  }
};

function App() {
  // Start with TSA as default subject
  const [currentSubject, setCurrentSubject] = useState('vocabulary');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bannerText, setBannerText] = useState('');

  const subjectConfig = useMemo(() => {
    try {
      const config = SUBJECTS && SUBJECTS[currentSubject] ? SUBJECTS[currentSubject] : SUBJECTS['vocabulary'];
      return config || {
        theme: 'vocabulary-theme',
        bannerText: 'welcome to PLEW',
        displayName: 'App',
        searchType: 'firebase'
      };
    } catch (error) {
      console.error('Error getting subject config:', error);
      return {
        theme: 'vocabulary-theme',
        bannerText: 'welcome to PLEW',
        displayName: 'App',
        searchType: 'firebase'
      };
    }
  }, [currentSubject]);

  useEffect(() => {
    try {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        try {
          setUser(currentUser);
          setAuthLoading(false);
        } catch (error) {
          console.error('Error setting user state:', error);
          setAuthLoading(false);
        }
      });
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      setBannerText('');
      const bannerTextValue = (subjectConfig && subjectConfig.bannerText) ? subjectConfig.bannerText : `Welcome to ${String(currentSubject || 'App').toUpperCase()}`;
      const fullText = String(bannerTextValue);
      let currentIndex = 0;
      let typingInterval = null;
      const startTimeout = setTimeout(() => {
        typingInterval = setInterval(() => {
          if (currentIndex <= fullText.length) {
            setBannerText(fullText.slice(0, currentIndex));
            currentIndex++;
          } else {
            clearInterval(typingInterval);
          }
        }, 50);
      }, 100);
      return () => {
        clearTimeout(startTimeout);
        if (typingInterval) clearInterval(typingInterval);
      };
    } catch (error) {
      console.error('Error in banner text effect:', error);
      setBannerText('Welcome to PLEW');
    }
  }, [currentSubject, subjectConfig]);

  const handleSubjectChange = useCallback((subject) => {
    try {
      // Validate subject and ensure it exists in SUBJECTS
      if (subject && 
          typeof subject === 'string' && 
          subject !== currentSubject && 
          SUBJECTS && 
          SUBJECTS[subject]) {
        
        console.log(`Switching from ${currentSubject} to ${subject}`);
        
        // Clear any existing state that might interfere
        setBannerText('');
        
        // Change subject
        setCurrentSubject(subject);
      } else if (subject && !SUBJECTS[subject]) {
        console.warn(`Unknown subject: ${subject}. Available subjects:`, Object.keys(SUBJECTS));
      }
    } catch (error) {
      console.error('Error changing subject:', error, {
        from: currentSubject,
        to: subject,
        availableSubjects: Object.keys(SUBJECTS || {})
      });
    }
  }, [currentSubject]);

  const ProtectedRoute = useMemo(() => {
    const Component = ({ children }) => {
      if (authLoading) return <LoadingScreen />;
      if (!user) return <Navigate to="/login" />;
      return children;
    };
    Component.displayName = 'ProtectedRoute';
    return Component;
  }, [authLoading, user]);

  // Feature Protected Route - simplified to just check authentication

  const SearchComponent = useMemo(() => {
    // Add defensive checks for subject transitions
    if (!currentSubject || !subjectConfig) {
      return (
        <LoadingScreen />
      );
    }

    try {
      return (
        <SearchPage
          key={`search-${currentSubject}-${subjectConfig.searchType}`}
          currentSubject={currentSubject}
          subjectConfig={subjectConfig}
          bannerText={bannerText}
          user={user}
          handleSubjectChange={handleSubjectChange}
        />
      );
    } catch (error) {
      console.error('Error creating SearchComponent:', error);
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '50vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Loading Error</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Unable to load the search interface. Please refresh the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
  }, [currentSubject, subjectConfig, bannerText, user, handleSubjectChange]);

  if (authLoading) return <LoadingScreen />;

  try {
    const theme = (subjectConfig && subjectConfig.theme) ? subjectConfig.theme : 'vocabulary-theme';
    
    return (
      <StripeProvider>
        <QuizProvider>
          <Router>
            <div className={`app ${theme}`}>
              <NavbarWrapper onSubjectChange={handleSubjectChange} />
              <ErrorBoundary theme={theme}>
                <Routes>
                  <Route path="/" element={SearchComponent} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/success" element={<SuccessPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/vocabulary" element={<VocabularyPinterest />} />
                  <Route path="/videos" element={<VideoStreaming />} />
                  <Route path="/admin/quiz-creator" element={<QuizCreator />} />
                  <Route path="/test" element={<TestPage />} />
                  <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
                  <Route path="/quiz/:subject" element={<ProtectedRoute><QuizTaking /></ProtectedRoute>} />
                  <Route path="/quiz/:subject/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/question-pack" element={<ProtectedRoute><QuestionPackPage /></ProtectedRoute>} />
                  <Route path="/pack/:packId" element={<ProtectedRoute><PackViewer /></ProtectedRoute>} />
                  <Route path="/premium/*" element={<ProtectedRoute><PremiumDashboard /></ProtectedRoute>} />
                  <Route path="/practice/:packId" element={<ProtectedRoute><PracticeMode /></ProtectedRoute>} />
                  <Route path="/premium/quiz/:subject" element={<ProtectedRoute><QuizTaking /></ProtectedRoute>} />
                  <Route path="/premium/quiz/:subject/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
                  <Route path="/reset-password" element={<ProtectedRoute><PasswordResetConfirm /></ProtectedRoute>} />
                  <Route path="/admin/questions" element={<ProtectedRoute><AdminQuestionUpload /></ProtectedRoute>} />
                  <Route path="/admin/learn-content" element={<ProtectedRoute><LearnContentAdmin /></ProtectedRoute>} />
                  <Route path="/admin/setup" element={<AdminSetup />} />
                  <Route path="/submit-question" element={<SubmitQuestionForm />} />
                  <Route path="/admin/pack-creator" element={<AdminPackCreator />} />
                  <Route path="/debug" element={<DebugTest />} />
                </Routes>
              </ErrorBoundary>
              <FeatureFlagDebug user={user} />
              <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js"></script>
            </div>
          </Router>
        </QuizProvider>
      </StripeProvider>
    );
  } catch (error) {
    console.error('Fatal error rendering App:', error);
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>Application Error</h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '400px' }}>
          We're sorry, but the application encountered a critical error. Please refresh the page to try again.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }
}

// Navbar Wrapper Component that uses Quiz Context
const NavbarWrapper = ({ onSubjectChange }) => {
  // React Hooks must be called at the top level - cannot be conditional
  let isQuizActive = false;
  let contextError = null;
  
  try {
    const context = useQuizContext();
    isQuizActive = context.isQuizActive;
  } catch (error) {
    console.error('Error accessing QuizContext:', error);
    contextError = error;
  }
  
  // Don't render navbar if quiz is active (or if there's a context error, show navbar as fallback)
  if (isQuizActive && !contextError) {
    return null;
  }
  
  return <Navbar onSubjectChange={onSubjectChange} />;
};

export default App;