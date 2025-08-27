// QuizBannerPopout.js - All quiz banner functions in sliding popout - LEFT SIDE
import React, { useState, useEffect } from 'react';
import { getCurrentQuiz, hasUserAttempted, getUserAttempt, getQuizPrizePool, getTopPlayers } from '../services/quizService';
import { getQuizTimeStatus, formatDuration } from '../utils/quizUtils';
import { getAuth } from 'firebase/auth';
import { Button } from './ui';

const getCurrentTheme = () => {
  const appElement = document.querySelector('.app');
  if (appElement?.classList.contains('alternate-theme')) return 'plew';
  if (appElement?.classList.contains('maths-theme')) return 'maths';
  return 'tsa';
};

const QuizBannerPopout = ({ subject }) => {
  const [quiz, setQuiz] = useState(null);
  const [timeStatus, setTimeStatus] = useState(null);
  const [userHasAttempted, setUserHasAttempted] = useState(false);
  const [userAttempt, setUserAttempt] = useState(null);
  const [prizePool, setPrizePool] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  // Load quiz data
  useEffect(() => {
    loadQuizData();
  }, [subject]);

  // Update timer every minute
  useEffect(() => {
    if (!quiz) return;

    const updateTimer = () => {
      const status = getQuizTimeStatus(quiz.scheduledStart, quiz.scheduledEnd);
      setTimeStatus(status);
      setTimeRemaining(status.timeRemaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [quiz]);

  // Auto-refresh data every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadQuizData();
    }, 120000);

    return () => clearInterval(interval);
  }, [subject]);

  const loadQuizData = async () => {
    setLoading(true);

    try {
      const quizResult = await getCurrentQuiz(subject);

      if (quizResult.success && quizResult.data) {
        const currentQuiz = quizResult.data;
        setQuiz(currentQuiz);

        // Load prize pool data
        const prizeData = await getQuizPrizePool(currentQuiz.quizId);
        if (prizeData.success) {
          setPrizePool(prizeData.data);
        }

        // Load top players
        const topPlayersData = await getTopPlayers(currentQuiz.quizId, 3);
        if (topPlayersData.success) {
          setTopPlayers(topPlayersData.data);
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
        setQuiz(null);
      }
    } catch (error) {
      console.error('Error loading quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectDisplayName = (subject) => {
    switch (subject) {
      case 'tsa':
        return 'TSA Critical Thinking';
      case 'plew':
        return '수능영어';
      case 'maths':
        return 'Maths A Level';
      default:
        return subject;
    }
  };

  const handleStartQuiz = () => {
    window.location.href = `/quiz/${subject}`;
  };

  const handleViewResults = () => {
    window.location.href = `/quiz/${subject}/results`;
  };

  const getQuizStatusDisplay = () => {
    if (!quiz) return { 
      text: 'No Quiz Scheduled', 
      color: '#666', 
      bgColor: '#f8f9fa',
      icon: '📅' 
    };

    switch (timeStatus?.status) {
      case 'upcoming':
        return {
          text: 'Upcoming Quiz',
          color: '#856404',
          bgColor: 'linear-gradient(135deg, #fff3cd 0%, #fef3c7 100%)',
          icon: '📅',
        };
      case 'active':
        return {
          text: 'QUIZ IS LIVE!',
          color: '#155724',
          bgColor: 'linear-gradient(135deg, #d4edda 0%, #dcfce7 100%)',
          icon: '🔥',
        };
      case 'completed':
        return {
          text: userHasAttempted ? 'Quiz Completed' : 'Quiz Ended',
          color: userHasAttempted ? '#155724' : '#666',
          bgColor: userHasAttempted 
            ? 'linear-gradient(135deg, #e8f5e9 0%, #dcfce7 100%)'
            : 'linear-gradient(135df, #f8f9fa 0%, #e9ecef 100%)',
          icon: userHasAttempted ? '✅' : '⏰',
        };
      default:
        return { 
          text: 'Quiz Status Unknown', 
          color: '#666', 
          bgColor: '#f8f9fa',
          icon: '❓' 
        };
    }
  };

  const statusDisplay = getQuizStatusDisplay();

  // Get theme colors
  const getThemeColors = () => {
    const theme = getCurrentTheme();
    switch (theme) {
      case 'plew':
        return {
          primary: '#2b55a1',
          secondary: '#1a4490',
          bg: 'linear-gradient(135deg, #e8f4fd 0%, #d1e7f5 100%)',
        };
      case 'maths':
        return {
          primary: '#3f72af',
          secondary: '#2d4059',
          bg: 'linear-gradient(135deg, #e1eeff 0%, #d1ddf5 100%)',
        };
      default: // tsa
        return {
          primary: '#6b5ca5',
          secondary: '#221368',
          bg: 'linear-gradient(135deg, #f0e7f8 0%, #e8d5f2 100%)',
        };
    }
  };

  const themeColors = getThemeColors();

  return (
    <>
      {/* Quiz Banner Widget - NOW ON LEFT SIDE */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: isOpen ? '0' : '-380px',
          transform: 'translateY(-50%)',
          width: '400px',
          maxHeight: '85vh',
          background: statusDisplay.bgColor,
          boxShadow: isOpen ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
          borderRadius: '0 12px 12px 0',
          zIndex: 1000,
          transition: 'left 0.3s ease',
          border: `2px solid ${themeColors.primary}`,
          borderLeft: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem',
            borderBottom: `1px solid ${themeColors.primary}30`,
            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
            color: 'white',
            borderRadius: '0 12px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              {statusDisplay.icon} Quiz Center
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
              {getSubjectDisplayName(subject)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '0.25rem',
                color: 'white',
                borderRadius: '4px',
              }}
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '📋' : '📉'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '0.25rem',
                color: 'white',
                borderRadius: '4px',
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: statusDisplay.color }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                Loading quiz information...
              </div>
            ) : !quiz ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
                <h5 style={{ margin: '0 0 0.5rem 0' }}>No Quiz Scheduled</h5>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
                  Check back on Fridays at 4PM GMT for weekly quizzes!
                </p>
              </div>
            ) : (
              <div>
                {/* Quiz Status */}
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: `1px solid ${themeColors.primary}30`,
                    textAlign: 'center',
                  }}
                >
                  <h5 style={{ margin: '0 0 0.5rem 0', color: statusDisplay.color, fontWeight: 'bold' }}>
                    {statusDisplay.icon} {statusDisplay.text}
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                    {quiz.title}
                  </p>
                  
                  {timeStatus?.status === 'active' && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '1.1rem', 
                      fontWeight: 'bold', 
                      color: '#dc2626' 
                    }}>
                      ⏱️ {Math.ceil(timeRemaining / (1000 * 60))} minutes remaining
                    </div>
                  )}
                </div>

                {/* User Results (if completed) */}
                {userHasAttempted && userAttempt && (
                  <div
                    style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #e8f5e9 0%, #dcfce7 100%)',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      border: '2px solid #22c55e',
                      textAlign: 'center',
                    }}
                  >
                    <h5 style={{ margin: '0 0 1rem 0', color: '#166534' }}>
                      ✅ Your Results
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
                          {userAttempt.percentageScore}%
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#166534' }}>Your Score</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#166534' }}>
                          {formatDuration(userAttempt.completionTimeSeconds * 1000)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#166534' }}>Time Taken</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prize Pool Display */}
                {prizePool && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '1.5rem' }}>🏆</div>
                      <div>
                        <h5 style={{ margin: 0, color: '#92400e', fontSize: '0.9rem' }}>Prize Pool</h5>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#d97706' }}>
                          ${prizePool.totalAmount || 500}
                        </div>
                      </div>
                    </div>
                    
                    {topPlayers.length > 0 && (
                      <div>
                        <h6 style={{ margin: '0 0 0.5rem 0', color: '#92400e', fontSize: '0.8rem' }}>
                          🔥 Current Leaders
                        </h6>
                        {topPlayers.slice(0, 3).map((player, index) => (
                          <div
                            key={player.userId}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.25rem 0',
                              fontSize: '0.8rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                              <span style={{ color: '#92400e' }}>{player.displayName}</span>
                            </div>
                            <span style={{ fontWeight: 'bold', color: '#d97706' }}>
                              {player.percentageScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {timeStatus?.status === 'active' && !userHasAttempted && user && (
                    <Button
                      onClick={handleStartQuiz}
                      variant="success"
                      size="medium"
                      theme={getCurrentTheme()}
                      style={{
                        width: '100%',
                        padding: '1rem !important',
                        fontSize: '1rem !important',
                        fontWeight: '700 !important',
                      }}
                    >
                      🚀 START QUIZ NOW
                    </Button>
                  )}

                  {timeStatus?.status === 'active' && !user && (
                    <Button
                      as="a"
                      href="/login"
                      variant="primary"
                      theme={getCurrentTheme()}
                      style={{
                        width: '100%',
                        padding: '1rem !important',
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      Log In to Join Quiz
                    </Button>
                  )}

                  {(userHasAttempted || timeStatus?.status === 'completed') && (
                    <Button
                      onClick={handleViewResults}
                      variant={userHasAttempted ? 'success' : 'secondary'}
                      theme={getCurrentTheme()}
                      style={{ width: '100%', padding: '0.75rem !important' }}
                    >
                      View Results & Leaderboard
                    </Button>
                  )}

                  {timeStatus?.status === 'upcoming' && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#666',
                      }}
                    >
                      ⏰ Quiz opens for 1 hour only<br />
                      🚫 No retakes allowed<br />
                      ⚡ Scored on accuracy + speed
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toggle Button (when widget is closed) - NOW ON LEFT SIDE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: '50%',
            left: '10px',
            transform: 'translateY(-50%)',
            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            padding: '1rem 0.75rem',
            cursor: 'pointer',
            zIndex: 1000,
            fontSize: '1rem',
            boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            minHeight: '80px',
            textAlign: 'center',
          }}
          title="Show Quiz Info"
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-50%) translateX(5px) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(-50%) translateX(0) scale(1)';
          }}
        >
          {statusDisplay.icon}
          <br />
          Quiz
        </button>
      )}
    </>
  );
};

export default QuizBannerPopout;