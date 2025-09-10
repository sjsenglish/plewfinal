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
import VocabularySearch from './components/VocabularySearch';
import VideoStreaming from './components/VideoStreaming';
import DemoMode from './components/DemoMode';
// import StudyBuddyApp from './components/StudyBuddyApp'; // HIDDEN - Ask Bo and Application Builder
import FeatureFlagDebug from './components/FeatureFlagDebug';
// import EnhancedPersonalStatementGrader from './components/EnhancedPersonalStatementGrader'; // HIDDEN
import DebugTest from './components/DebugTest';
import AdminSetup from './components/AdminSetup';

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

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Add error handling for missing environment variables
if (!process.env.REACT_APP_ALGOLIA_APP_ID || !process.env.REACT_APP_ALGOLIA_SEARCH_KEY) {
  console.error('❌ Missing Algolia environment variables. Please check your .env file.');
}

if (!process.env.REACT_APP_OPENAI_API_KEY) {
  console.warn('⚠️ Missing OpenAI API key. Vocabulary features will have limited functionality.');
}

// Updated SUBJECTS - Korean-English, Vocabulary, and Community
const SUBJECTS = {
  koreanEnglish: {
    index: 'korean-english-question-pairs',
    theme: 'korean-english-theme',
    bannerText: 'master the CSAT through practise questions',
    displayName: '문제은행',
    searchType: 'algolia'
  },
  vocabulary: {
    index: 'korean-english-question-pairs',
    theme: 'vocabulary-theme',
    bannerText: 'master the vocab you need for exams',
    displayName: 'Vocabulary',
    searchType: 'algolia'
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
    console.log('Received Korean-English filters in App.js:', filters);
    setKoreanEnglishFilters(filters);
  };

// Replace your current buildAlgoliaFilters function in App.js with this:

const buildAlgoliaFilters = (filters) => {
  const filterArray = [];
  
  // Handle each filter type with proper field mapping
  Object.entries(filters).forEach(([filterKey, filterValue]) => {
    if (filterValue && filterValue.trim() !== '') {
      // Check if the filter value is already properly formatted (contains field:value pattern)
      if (filterValue.includes(':')) {
        // Already properly formatted filter string from MathsFilters
        filterArray.push(filterValue);
      } else {
        // Legacy format - convert to proper Algolia filter format
        switch (filterKey) {
          case 'year':
            filterArray.push(`paper_info.year:"${filterValue}"`);
            break;
          case 'month':
            filterArray.push(`paper_info.month:"${filterValue}"`);
            break;
          case 'paperTitle':
            filterArray.push(`paper_info.paper_title:"${filterValue}"`);
            break;
          case 'specTopic':
            filterArray.push(`spec_topic:"${filterValue}"`);
            break;
          case 'questionTopic':
            filterArray.push(`question_topic:"${filterValue}"`);
            break;
          default:
            // For any other simple filters
            filterArray.push(`${filterKey}:"${filterValue}"`);
            break;
        }
      }
    }
  });
  
  console.log('Built Algolia filters:', filterArray.join(' AND ')); // Debug log
  return filterArray.join(' AND ');
};


  const statsComponent = useMemo(() => (
    <Stats translations={{
      stats(nbHits, processingTimeMS) {
        return nbHits === 0
          ? '🚫 No results'
          : `✅ ${nbHits.toLocaleString()} results found in ${processingTimeMS.toLocaleString()}ms`;
      },
    }} />
  ), []);

  if (!subjectConfig?.index) {
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
          <i className="fab fa-youtube"></i>
        </a>
        <a href="https://www.tiktok.com/@examrizz" target="_blank" rel="noopener noreferrer" className="modern-social-link tiktok-link" aria-label="TikTok Profile">
          <i className="fab fa-tiktok"></i>
        </a>
        <a href="https://discord.gg/examrizzsearch" target="_blank" rel="noopener noreferrer" className="discord-enhanced-button" aria-label="Discord Server">
          <i className="fab fa-discord"></i>
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
                <i className="fas fa-plus"></i>
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
      <i className="fas fa-play-circle"></i>
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
  if (subjectConfig.searchType === 'algolia') {
    return (
      <>
        <InstantSearch 
  key={currentSubject} 
  indexName={subjectConfig.index} 
  searchClient={searchClient} 
  future={{ preserveSharedStateOnUnmount: false }}
>
          {/* Configure Algolia with filters */}
          <Configure 
            key={JSON.stringify(currentSubject === 'koreanEnglish' ? koreanEnglishFilters : {})} 
            filters={buildAlgoliaFilters(currentSubject === 'koreanEnglish' ? koreanEnglishFilters : {})} 
          />
          
          {headerContent}

          {/* Search Results Section */}
          <div className="modern-search-wrapper">
            <div className="container">
              {/* Add KoreanEnglishFilters component for Korean-English subject */}
              {currentSubject === 'koreanEnglish' && user && (
                <KoreanEnglishFilters 
                  onFiltersChange={handleKoreanEnglishFiltersChange}
                  currentFilters={koreanEnglishFilters}
                />
              )}

              {/* Vocabulary Search Component */}
              {currentSubject === 'vocabulary' ? (
                <VocabularySearch 
                  searchClient={searchClient}
                  subjectConfig={subjectConfig}
                  bannerText={bannerText}
                  user={user}
                />
              ) : (
                <div className="results-container">
                <div className="stats-container">{statsComponent}</div>
                <div className="hits-container">
                  {user && <Hits hitComponent={HitWrapper} />}
                </div>
              </div>
              )}
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

        {/* Personal Statement Grader - HIDDEN */}

        {/* Add CSS for the grading button and Discord enhancement */}
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
          
          .discord-enhanced-button {
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 8px 16px !important;
            border-radius: 12px !important;
            background: linear-gradient(135deg, #5865f2, #4752c4) !important;
            color: white !important;
            text-decoration: none !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 4px 14px rgba(88, 101, 242, 0.3) !important;
            border: none !important;
            width: auto !important;
            height: auto !important;
            position: relative !important;
          }
          
          .discord-enhanced-button:hover {
            background: linear-gradient(135deg, #6b73ff, #5865f2) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(88, 101, 242, 0.4) !important;
          }
          
          .discord-enhanced-button i.fab {
            font-size: 18px !important;
          }
          
          .discord-enhanced-button span {
            font-size: 13px !important;
            white-space: nowrap !important;
          }
          
          @media (max-width: 768px) {
            .grading-button-container {
              gap: 2px;
            }
            
            .grading-locked-message {
              font-size: 10px;
            }
            
            .discord-enhanced-button {
              font-size: 12px !important;
              padding: 6px 12px !important;
            }
            
            .discord-enhanced-button span {
              font-size: 11px !important;
            }
            
            .discord-enhanced-button i.fab {
              font-size: 16px !important;
            }
          }
        `}</style>
      </>
    );
  }

  // For Pinecone search (Community), no InstantSearch wrapper needed
  return (
    <>
      {headerContent}

      {/* Community Search Interface */}
      <div className="modern-search-wrapper">
        <div className="container">
          <CommunitySearch 
            user={user} 
            placeholder={`search ${subjectConfig.displayName.toLowerCase()} questions...`}
          />
        </div>
      </div>

      {/* Popout Components */}
      {/* <LiveLeaderboard subject={currentSubject} /> */}

      {/* Video Popup */}
      <VideoPopup isOpen={showVideoPopup} onClose={handleCloseVideo} />

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
};

function App() {
  // Start with TSA as default subject
  const [currentSubject, setCurrentSubject] = useState('vocabulary');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bannerText, setBannerText] = useState('');

  const subjectConfig = useMemo(() => SUBJECTS[currentSubject] || SUBJECTS['vocabulary'], [currentSubject]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    setBannerText('');
    const fullText = subjectConfig?.bannerText || `Welcome to ${currentSubject.toUpperCase()}`;
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
  }, [currentSubject, subjectConfig?.bannerText]);

  const handleSubjectChange = useCallback((subject) => {
    // Now allow all subjects including maths
    if (subject !== currentSubject) {
      setCurrentSubject(subject);
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

  const SearchComponent = useMemo(() => (
    <SearchPage
      currentSubject={currentSubject}
      subjectConfig={subjectConfig}
      bannerText={bannerText}
      user={user}
      handleSubjectChange={handleSubjectChange}
    />
  ), [currentSubject, subjectConfig, bannerText, user, handleSubjectChange]);

  if (authLoading) return <LoadingScreen />;

  return (
    <StripeProvider>
      <QuizProvider>
        <Router>
          <div className={`app ${subjectConfig.theme}`}>
            <NavbarWrapper onSubjectChange={handleSubjectChange} />
            <ErrorBoundary theme={subjectConfig.theme}>
              <Routes>
                <Route path="/" element={SearchComponent} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/community" element={<CommunityPage />} />
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
                {/* <Route path="/submit-maths-question" element={<MathsSubmitQuestionForm />} /> */}
                {/* <Route path="/study-buddy" element={<FeatureProtectedRoute feature="study-buddy"><StudyBuddyApp /></FeatureProtectedRoute>} /> */}
                {/* <Route path="/study-progress" element={<FeatureProtectedRoute feature="application-builder"><StudyBuddyApp /></FeatureProtectedRoute>} /> */}
                <Route path="/debug" element={<DebugTest />} />
              </Routes>
            </ErrorBoundary>
            {/* Feature Flag Debug Component - Only shows in development or with ?debugFeatures=true */}
            <FeatureFlagDebug user={user} />
            <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js"></script>
          </div>
        </Router>
      </QuizProvider>
    </StripeProvider>
  );
}

// Navbar Wrapper Component that uses Quiz Context
const NavbarWrapper = ({ onSubjectChange }) => {
  const { isQuizActive } = useQuizContext();
  
  // Don't render navbar if quiz is active
  if (isQuizActive) {
    return null;
  }
  
  return <Navbar onSubjectChange={onSubjectChange} />;
};

export default App;