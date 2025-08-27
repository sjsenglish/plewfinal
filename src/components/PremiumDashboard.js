// components/PremiumDashboard.js
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { usePaywall } from '../hooks/usePaywall';
import { QuestionPackPage } from './QuestionPackPage';
import { ProfilePage } from './ProfilePage';
import QuizTaking from './QuizTaking';
import QuizResults from './QuizResults';
import SubscriptionPlansModal from './SubscriptionPlansModal';
import { 
  getCurrentQuiz, 
  hasUserAttempted, 
  getUserAttempt, 
  getQuizPrizePool, 
  getTopPlayers,
  getRecentQuizzes,
  getLeaderboard,
  getAllTimeLeaderboard 
} from '../services/quizService';
import { getQuizTimeStatus, formatDuration } from '../utils/quizUtils';
import { Button } from './ui';

const getCurrentTheme = () => {
  const appElement = document.querySelector('.app');
  if (appElement?.classList.contains('alternate-theme')) return 'plew';
  if (appElement?.classList.contains('maths-theme')) return 'maths';
  return 'tsa';
};

const PremiumDashboard = () => {
  // Check URL params to set initial tab
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'overview';
  
  const [activeSection, setActiveSection] = useState(initialTab);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  const {
    subscription,
    usage,
    loading: paywallLoading,
    isPaidUser,
    getPlanInfo
  } = usePaywall();

  const planInfo = getPlanInfo();

  // Redirect if not logged in
  useEffect(() => {
    if (!paywallLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, paywallLoading]);

  if (paywallLoading || !user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto',
          }} />
          <div>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'overview', name: 'Overview', icon: '', premium: false },
    { id: 'profile', name: 'Library', icon: '', premium: true },
    { id: 'question-packs', name: 'Question Packs', icon: '', premium: true },
    { id: 'quiz', name: 'Weekly Quiz', icon: '', premium: true }
  ];

  const handleSectionClick = (sectionId, isPremiumSection) => {
    if (isPremiumSection && !isPaidUser) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveSection(sectionId);
  };

  const renderSectionContent = () => {
    if (!isPaidUser && ['profile', 'question-packs', 'quiz'].includes(activeSection)) {
      return renderUpgradePrompt();
    }

    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'profile':
        return <ProfilePage />;
      case 'question-packs':
        return <QuestionPackPage />;
      case 'quiz':
        return <QuizDashboardSection />;
      default:
        return renderOverview();
    }
  };

// Updated QuizDashboardSection - simplified and consistent design
const QuizDashboardSection = () => {
  const [quiz, setQuiz] = useState(null);
  const [timeStatus, setTimeStatus] = useState(null);
  const [userHasAttempted, setUserHasAttempted] = useState(false);
  const [userAttempt, setUserAttempt] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuizTaking, setShowQuizTaking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    loadQuizData();
  }, []);

  // Update timer every minute
  useEffect(() => {
    if (!quiz) return;

    const updateTimer = () => {
      const status = getQuizTimeStatus(quiz.scheduledStart, quiz.scheduledEnd);
      setTimeStatus(status);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [quiz]);

  const loadQuizData = async () => {
    setLoading(true);
    
    try {
      const subject = 'tsa';
      
      // Try to get current quiz
      const quizResult = await getCurrentQuiz(subject);
      
      if (quizResult.success && quizResult.data) {
        const currentQuiz = quizResult.data;
        setQuiz(currentQuiz);

// Instead of getTopPlayers, use getLeaderboard like LiveLeaderboard does
const leaderboardResult = await getLeaderboard(currentQuiz.quizId);
if (leaderboardResult.success && leaderboardResult.data) {
  setTopPlayers(leaderboardResult.data.topTen || []);
}

        if (user) {
          const attemptCheck = await hasUserAttempted(user.uid, currentQuiz.quizId);
          setUserHasAttempted(attemptCheck.hasAttempted);

          if (attemptCheck.hasAttempted) {
            const attemptResult = await getUserAttempt(user.uid, currentQuiz.quizId);
            if (attemptResult.success && attemptResult.data) {
              setUserAttempt(attemptResult.data);
            }
          }
        }
      } else {
        // No current quiz, but try to load recent quiz data for leaderboard
        setQuiz(null);
        await loadRecentQuizData(subject);
      }
    } catch (error) {
      console.error('Error loading quiz data:', error);
      // Even if there's an error, try to load some historical data
      await loadRecentQuizData('tsa');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentQuizData = async (subject) => {
    try {
      // Get all-time leaderboard or recent quiz leaderboard
      const allTimeData = await getAllTimeLeaderboard?.(subject, 10);
      if (allTimeData?.success && allTimeData.data) {
        setTopPlayers(allTimeData.data);
      }
    } catch (error) {
      console.error('Error loading recent quiz data:', error);
    }
  };

  const getQuizStatus = () => {
    if (!quiz) {
      return {
        title: 'Next Quiz: To Be Announced',
        subtitle: 'Check back soon for the next quiz schedule',
        canTakeQuiz: false,
        buttonText: 'Quiz Not Available',
        buttonVariant: 'disabled'
      };
    }

    const now = Date.now();
    const startTime = quiz.scheduledStart;
    const endTime = quiz.scheduledEnd;
    
    // Determine status based on current time
    let status;
    if (now < startTime) {
      status = 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      status = 'active';
    } else {
      status = 'completed';
    }

    switch (status) {
      case 'upcoming': {
        const timeUntilStart = startTime - now;
        const daysUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60 * 24));
        const hoursUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60));
        
        // Show days if more than 24 hours, otherwise show hours
        const timeDisplay = daysUntilStart > 1 
          ? `${daysUntilStart} days` 
          : `${hoursUntilStart} hours`;
          
        return {
          title: `Next Quiz: ${quiz.title}`,
          subtitle: `Starts in ${timeDisplay}`,
          canTakeQuiz: false,
          buttonText: 'Quiz Not Started',
          buttonVariant: 'disabled'
        };
      }
      
      case 'active': {
        const timeRemaining = endTime - now;
        const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));
        const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
        
        // Show hours if more than 60 minutes, otherwise show minutes
        const timeDisplay = hoursRemaining > 1 
          ? `${hoursRemaining} hours` 
          : `${minutesRemaining} minutes`;
        
        return {
          title: `Quiz Live!`,
          subtitle: `${timeDisplay} remaining`,
          canTakeQuiz: !userHasAttempted,
          buttonText: userHasAttempted ? 'Already Completed' : 'Take Quiz Now',
          buttonVariant: userHasAttempted ? 'disabled' : 'primary'
        };
      }
      
      case 'completed': {
        return {
          title: `Quiz Completed: ${quiz.title}`,
          subtitle: userHasAttempted ? 'View your results below' : 'Quiz has ended',
          canTakeQuiz: false,
          buttonText: userHasAttempted ? 'View Results' : 'Quiz Ended',
          buttonVariant: userHasAttempted ? 'secondary' : 'disabled'
        };
      }
      
      default: {
        return {
          title: 'Quiz Status Unknown',
          subtitle: 'Please refresh the page',
          canTakeQuiz: false,
          buttonText: 'Unavailable',
          buttonVariant: 'disabled'
        };
      }
    }
  };

  const clearLeaderboard = () => {
    setTopPlayers([]);
  };

  const handleQuizAction = () => {
    const status = getQuizStatus();
    
    if (!status.canTakeQuiz) {
      if (userHasAttempted && timeStatus?.status === 'completed') {
        // Navigate to results
        window.location.href = `/premium/quiz/tsa/results`;
      }
      return;
    }

    // Start quiz
    window.location.href = `/quiz/tsa`;
  };

  const status = getQuizStatus();

  // If showing other components, return them
  if (showQuizTaking) {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => setShowQuizTaking(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to Quiz Dashboard
          </button>
        </div>
        <QuizTaking />
      </div>
    );
  }

  if (showResults) {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => setShowResults(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to Quiz Dashboard
          </button>
        </div>
        <QuizResults />
      </div>
    );
  }

  return (
<div className="dashboard-section">
  <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <div>
      <h2>Weekly Quiz</h2>
      <p>Compete with other students in weekly challenges</p>
    </div>
    <img 
      src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/ghost_couch.svg?alt=media&token=6def55fb-aa28-48b7-8262-d40e1acc9561"
      alt="Quiz illustration"
      style={{
        width: '120px',
        height: 'auto',
        flexShrink: 0,
        marginLeft: '2rem'
      }}
    />
  </div>
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#64748b' 
        }}>
          <div style={{
            width: '30px', 
            height: '30px', 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #6366f1', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite', 
            margin: '0 auto 1rem auto',
          }} />
          Loading quiz information...
        </div>
      ) : (
        <div>
          {/* Quiz Status Banner */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid #a8dcc6',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              margin: '0 0 0.5rem 0', 
              color: '#1e293b', 
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              {status.title}
            </h3>
            
            <p style={{ 
              margin: '0 0 2rem 0', 
              color: '#64748b', 
              fontSize: '1rem' 
            }}>
              {status.subtitle}
            </p>

            <button
              onClick={handleQuizAction}
              disabled={!status.canTakeQuiz && status.buttonVariant === 'disabled'}
              style={{
                padding: '12px 24px',
                background: status.buttonVariant === 'primary' ? '#059669' : 
                           status.buttonVariant === 'secondary' ? '#475569' : '#e2e8f0',
                color: status.buttonVariant === 'disabled' ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: status.buttonVariant === 'disabled' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '160px'
              }}
              onMouseOver={(e) => {
                if (status.buttonVariant === 'primary') {
                  e.target.style.background = '#047857';
                } else if (status.buttonVariant === 'secondary') {
                  e.target.style.background = '#374151';
                }
              }}
              onMouseOut={(e) => {
                if (status.buttonVariant === 'primary') {
                  e.target.style.background = '#059669';
                } else if (status.buttonVariant === 'secondary') {
                  e.target.style.background = '#475569';
                }
              }}
            >
              {status.buttonText}
            </button>
          </div>

          {/* User Results (if completed) */}
          {userHasAttempted && userAttempt && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid #a8dcc6',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{ 
                margin: '0 0 1.5rem 0', 
                color: '#1e293b', 
                fontSize: '1.25rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Your Latest Results
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 'bold', 
                    color: '#059669',
                    marginBottom: '0.25rem'
                  }}>
                    {userAttempt.percentageScore}%
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Your Score</div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 'bold', 
                    color: '#059669',
                    marginBottom: '0.25rem'
                  }}>
                    {formatDuration(userAttempt.completionTimeSeconds * 1000)}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Time Taken</div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 'bold', 
                    color: '#059669',
                    marginBottom: '0.25rem'
                  }}>
                    {userAttempt.correctAnswers}/{userAttempt.totalQuestions}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Correct</div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid #a8dcc6',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <h4 style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#1e293b', 
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              Leaderboard
            </h4>
            
            {topPlayers.length > 0 ? (
              <div style={{
                border: '1px solid #a8dcc6',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 100px 100px',
                  background: '#f8fafc',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#64748b',
                  borderBottom: '1px solid #a8dcc6'
                }}>
                  <div>Rank</div>
                  <div>Player</div>
                  <div>Score</div>
                  <div>Time</div>
                </div>

                {/* Leaderboard Rows */}
                {topPlayers.map((player, index) => {
                  const isCurrentUser = player.userId === user.uid;
                  const rank = index + 1;
                  
                  return (
                    <div 
                      key={player.userId} 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '60px 1fr 100px 100px',
                        padding: '1rem',
                        fontSize: '0.875rem',
                        borderBottom: index < topPlayers.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: isCurrentUser ? '#eff6ff' : index % 2 === 0 ? '#fafbfc' : 'white',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ 
                        fontWeight: '600',
                        color: '#475569'
                      }}>
                        #{rank}
                      </div>
                      <div style={{ 
                        fontWeight: isCurrentUser ? '600' : '400',
                        color: isCurrentUser ? '#047857' : '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {player.displayName}
                        {isCurrentUser && (
                          <span style={{ 
                            fontSize: '0.75rem',
                            background: '#059669',
                            color: 'white',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontWeight: '600',
                        color: '#059669',
                        textAlign: 'center'
                      }}>
                        {player.percentageScore}%
                      </div>
                      <div style={{ 
                        color: '#64748b',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem'
                      }}>
                        {formatDuration(player.completionTimeSeconds * 1000)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                color: '#64748b' 
              }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '1rem',
                  opacity: 0.5
                }}>
                </div>
                <h3 style={{ 
                  margin: '0 0 0.5rem 0',
                  color: '#374151',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}>
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.9rem' 
                }}>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const renderOverview = () => (
  <div style={{ height: '100%' }}>
    {/* Simplified Header similar to ProfilePage */}
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.5)', 
      backdropFilter: 'blur(10px)',
      padding: '32px 24px', 
      border: '1px solid #a8dcc6',
      marginBottom: '24px',
      borderRadius: '12px',
      margin: '0 0 24px 0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              color: '#1e293b', 
              fontSize: '2rem', 
              fontWeight: '700' 
            }}>
              Welcome!
            </h1>
            <p style={{ 
              margin: '0', 
              color: '#64748b', 
              fontSize: '1rem' 
            }}>
              Access your library, create question packs, and more
            </p>
          </div>
          
          {!isPaidUser && (
            <button 
              onClick={() => setShowUpgradeModal(true)}
              style={{
                padding: '12px 24px',
                background: '#d8f0ed',
                color: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#c4e9e0'}
              onMouseOut={(e) => e.target.style.background = '#d8f0ed'}
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Content matching ProfilePage style */}
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Feature Grid */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.5)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '12px', 
        padding: '32px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        border: '1px solid #a8dcc6',
        marginBottom: '24px' 
      }}>
        <h2 style={{ 
          margin: '0 0 24px 0', 
          color: '#1e293b', 
          fontSize: '1.25rem', 
          fontWeight: '600' 
        }}>
          Dashboard Features
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {sections.filter(s => s.id !== 'overview').map(section => {
            const getIconUrl = (sectionId) => {
              switch (sectionId) {
                case 'profile':
                  return 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbagback.svg?alt=media&token=65739e08-36db-4810-951c-91641f5d0084';
                case 'question-packs':
                  return 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbulb.svg?alt=media&token=1f21ae0e-764d-4b03-ba1d-f1423329c325';
                case 'quiz':
                  return 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftoaster.svg?alt=media&token=744ba4bf-336d-4dd2-b2dc-25bd4df85af6';
                default:
                  return '';
              }
            };

            return (
              <div 
                key={section.id}
                onClick={() => handleSectionClick(section.id, section.premium)}
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid #a8dcc6',
                  borderRadius: '12px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  if (!(section.premium && !isPaidUser)) {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#a8dcc6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img 
                    src={getIconUrl(section.id)} 
                    alt={section.name}
                    style={{ 
                      width: '50px', 
                      height: '50px',
                      objectFit: 'contain'
                    }}
                  />
                  <h3 style={{ 
                    margin: '0', 
                    color: '#1e293b', 
                    fontSize: '1.1rem', 
                    fontWeight: '600' 
                  }}>
                    {section.name}
                  </h3>
                </div>
                
                <p style={{ 
                  margin: '0', 
                  color: '#64748b', 
                  fontSize: '14px', 
                  lineHeight: '1.5' 
                }}>
                  {getFeatureDescription(section.id)}
                </p>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

  const renderUpgradePrompt = () => (
    <div className="upgrade-prompt">
      <div className="upgrade-content">
        <div className="upgrade-icon">🔒</div>
        <h2>Premium Feature</h2>
        <p>Upgrade to access this feature and unlock all premium content.</p>
        <button 
          className="upgrade-button"
          onClick={() => setShowUpgradeModal(true)}
        >
          Upgrade to Premium
        </button>
      </div>
    </div>
  );

  const getFeatureDescription = (sectionId) => {
    switch (sectionId) {
      case 'profile':
        return 'Practise timed question packs, review, and watch video solutions';
      case 'question-packs':
        return 'Create custom question packs and download PDFs';
      case 'quiz':
        return 'Participate in weekly competitive quizzes';
      default:
        return '';
    }
  };

  return (
    <div className="premium-dashboard">
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <SubscriptionPlansModal onClose={() => setShowUpgradeModal(false)} />
          </div>
        </div>
      )}

      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <nav className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Dashboard</h2>
            <div className="user-info">
              <span className="user-name">{user.displayName || 'User'}</span>
              <span className="user-plan">{planInfo.name}</span>
            </div>
          </div>

          <ul className="sidebar-nav">
            {sections.map(section => (
              <li key={section.id}>
                <button
                  className={`nav-item ${activeSection === section.id ? 'active' : ''} 
                             ${section.premium && !isPaidUser ? 'locked' : ''}`}
                  onClick={() => handleSectionClick(section.id, section.premium)}
                >
                  <span className="nav-icon">{section.icon}</span>
                  <span className="nav-text">{section.name}</span>
                  {section.premium && !isPaidUser && (
                    <span className="lock-icon">🔒</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="dashboard-main">
          {renderSectionContent()}
        </main>
      </div>

      {/* Updated styles with gradient background */}
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }
        
        #root, #__next {
          height: 100vh;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>
      <style jsx>{`
        .premium-dashboard {
          height: 100vh;
          background: linear-gradient(135deg, #b8e6d3 0%, #a8dcc6 20%, #d4edda 40%, #f0c5a0 60%, #f5b885 80%, #fad0c4 100%);
          position: relative;
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          overflow: hidden;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .premium-dashboard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 15% 60%, rgba(168, 230, 207, 0.4) 0%, transparent 45%),
            radial-gradient(circle at 85% 25%, rgba(240, 197, 160, 0.4) 0%, transparent 45%),
            radial-gradient(circle at 45% 85%, rgba(212, 237, 218, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(250, 208, 196, 0.3) 0%, transparent 40%);
          pointer-events: none;
          animation: floatBackground 8s ease-in-out infinite;
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

        .dashboard-container {
          display: flex;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          height: 100vh;
        }

        .dashboard-sidebar {
          width: 280px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          border-right: 1px solid #a8dcc6;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .sidebar-header {
          padding: 2rem 1.5rem;
          border-bottom: 1px solid #a8dcc6;
        }

        .sidebar-header h2 {
          margin: 0 0 1.5rem 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .user-name {
          font-weight: 500;
          color: #475569;
        }

        .user-plan {
          font-size: 0.875rem;
          color: #64748b;
          padding: 0.25rem 0.5rem;
          background: rgba(241, 245, 249, 0.8);
          border-radius: 4px;
          display: inline-block;
        }

        .sidebar-nav {
          list-style: none;
          padding: 1rem 0;
          margin: 0;
        }

        .nav-item {
          width: 100%;
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .nav-item:hover {
          background-color: rgba(248, 250, 252, 0.8);
        }

        .nav-item.active {
          background-color: #d8f0ed;
          color: #1e293b;
          font-weight: 600;
        }

        .nav-item.locked {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .nav-icon {
          font-size: 1.25rem;
        }

        .nav-text {
          flex: 1;
          font-weight: 500;
        }

        .lock-icon {
          font-size: 0.875rem;
        }

        .dashboard-main {
          flex: 1;
          padding: 2rem;
          height: 100vh;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .dashboard-section {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          borderRadius: 12px;
          padding: 2rem;
          boxShadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #a8dcc6;
        }

        .section-header {
          margin-bottom: 2rem;
        }

        .section-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.875rem;
          font-weight: 700;
        }

        .section-header p {
          margin: 0;
          color: #64748b;
          font-size: 1.125rem;
        }

        .plan-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          borderRadius: 12px;
          margin-bottom: 2rem;
        }

        .plan-banner.free {
          background: linear-gradient(135deg, rgba(254, 243, 199, 0.9) 0%, rgba(253, 230, 138, 0.9) 100%);
          border: 1px solid rgba(245, 158, 11, 0.5);
          backdrop-filter: blur(10px);
        }

        .plan-banner.premium {
          background: linear-gradient(135deg, rgba(221, 214, 254, 0.9) 0%, rgba(196, 181, 253, 0.9) 100%);
          border: 1px solid rgba(139, 92, 246, 0.5);
          backdrop-filter: blur(10px);
        }

        .plan-badge {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.875rem;
          padding: 0.25rem 0.75rem;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 20px;
          margin-right: 1rem;
        }

        .upgrade-hint {
          color: #92400e;
          font-size: 0.875rem;
        }

        .usage-stats {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .usage-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .upgrade-btn {
          padding: 0.75rem 1.5rem;
          background: #d8f0ed;
          color: #1e293b;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upgrade-btn:hover {
          background: #c4e9e0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(5px);
          border: 1px solid #a8dcc6;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .feature-card.locked:hover {
          transform: none;
          border-color: #a8dcc6;
        }

        .feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .feature-title {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .feature-description {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }

        .quick-stats {
          margin-top: 2rem;
        }

        .quick-stats h3 {
          margin: 0 0 1rem 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .stat-item {
          background: rgba(248, 250, 252, 0.8);
          backdrop-filter: blur(5px);
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #a8dcc6;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #6366f1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.875rem;
        }

        .upgrade-prompt {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .upgrade-content {
          text-align: center;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #a8dcc6;
        }

        .upgrade-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .upgrade-content h2 {
          margin: 0 0 1rem 0;
          color: #1e293b;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .upgrade-content p {
          margin: 0 0 2rem 0;
          color: #64748b;
          font-size: 1rem;
          line-height: 1.5;
        }

        .upgrade-button {
          padding: 0.75rem 2rem;
          background: #d8f0ed;
          color: #1e293b;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upgrade-button:hover {
          background: #c4e9e0;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 95vw;
          max-height: 95vh;
          overflow-y: auto;
          margin: 1rem;
        }

        .quiz-dashboard-content {
          max-width: 100%;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PremiumDashboard;