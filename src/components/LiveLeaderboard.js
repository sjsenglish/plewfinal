// src/components/LiveLeaderboard.js
import React, { useState, useEffect } from 'react';
import { getCurrentQuiz, getLeaderboard } from '../services/quizService';
import { getQuizTimeStatus, formatCompletionTime } from '../utils/quizUtils';
import { getAuth } from 'firebase/auth';

const LiveLeaderboard = ({ subject }) => {
  const [quiz, setQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  // Load initial data
  useEffect(() => {
    loadLeaderboardData();
  }, [subject]);

  // Auto-refresh leaderboard every 60 seconds (always, not just during active quiz)
  useEffect(() => {
    const interval = setInterval(() => {
      loadLeaderboardData();
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [subject]);

  const loadLeaderboardData = async () => {
    try {
      // Get current/most recent quiz for this subject
      const quizResult = await getCurrentQuiz(subject);
      if (!quizResult.success || !quizResult.data) {
        // If no current quiz, we could get the most recent completed quiz
        // For now, just show no data
        setQuiz(null);
        setLeaderboard(null);
        setLoading(false);
        return;
      }

      const currentQuiz = quizResult.data;
      setQuiz(currentQuiz);

      // Get leaderboard (show results even if quiz hasn't started yet - from previous attempts)
      const leaderboardResult = await getLeaderboard(currentQuiz.quizId);
      if (leaderboardResult.success && leaderboardResult.data) {
        setLeaderboard(leaderboardResult.data);
        setLastUpdate(new Date());
      } else {
        // No leaderboard data yet
        setLeaderboard(null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectDisplayName = (subject) => {
    switch (subject) {
      case 'tsa':
        return 'TSA';
      case 'plew':
        return '수능영어';
      case 'maths':
        return 'Maths';
      default:
        return subject;
    }
  };

  const getUserRankInLeaderboard = () => {
    if (!leaderboard || !user) return null;

    const allScores = leaderboard.allScores || leaderboard.topTen;
    const userEntry = allScores.find((entry) => entry.userId === user.uid);
    return userEntry;
  };

  const getQuizStatusDisplay = () => {
    if (!quiz) return { text: 'No Quiz Available', color: '#666', icon: '📅' };

    const timeStatus = getQuizTimeStatus(quiz.scheduledStart, quiz.scheduledEnd);

    switch (timeStatus.status) {
      case 'upcoming': {
        const timeUntil = Math.ceil((timeStatus.timeUntilStart || 0) / (1000 * 60 * 60 * 24));
        return {
          text: `Next quiz in ${timeUntil} day${timeUntil !== 1 ? 's' : ''}`,
          color: '#856404',
          icon: '⏰',
        };
      }

      case 'active': {
        const timeLeft = Math.ceil((timeStatus.timeRemaining || 0) / (1000 * 60));
        return {
          text: `LIVE NOW • ${timeLeft}min left`,
          color: '#155724',
          icon: '🔥',
        };
      }
      case 'completed':
        return {
          text: 'Latest Results',
          color: '#666',
          icon: '🏁',
        };
      default:
        return { text: 'Quiz Status Unknown', color: '#666', icon: '❓' };
    }
  };

  const userEntry = getUserRankInLeaderboard();
  const statusDisplay = getQuizStatusDisplay();

  // Always show the widget, even with no data
  return (
    <>
      {/* Widget */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          right: isOpen ? '0' : '-320px',
          transform: 'translateY(-50%)',
          width: '350px',
          maxHeight: '80vh',
          backgroundColor: 'white',
          boxShadow: isOpen ? '-4px 0 20px rgba(0,0,0,0.15)' : 'none',
          borderRadius: '12px 0 0 12px',
          zIndex: 1000,
          transition: 'right 0.3s ease',
          border: '1px solid #ddd',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px 0 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>🏆 Weekly Leaderboard</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
              {getSubjectDisplayName(subject)} • {leaderboard?.totalParticipants || 0} players
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '0.25rem',
                color: '#666',
              }}
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '📈' : '📉'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '0.25rem',
                color: '#666',
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
            {/* Quiz Status */}
            <div
              style={{
                padding: '0.75rem',
                backgroundColor:
                  statusDisplay.color === '#155724'
                    ? '#d4edda'
                    : statusDisplay.color === '#856404'
                      ? '#fff3cd'
                      : '#f8f9fa',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                textAlign: 'center',
              }}
            >
              <span style={{ color: statusDisplay.color, fontWeight: 'bold' }}>
                {statusDisplay.icon} {statusDisplay.text}
              </span>
            </div>

            {/* Your Rank (if user participated) */}
            {userEntry && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f0e7f8',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '2px solid #6b5ca5',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                  Your Best This Week
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#6b5ca5' }}>
                      #{userEntry.rank}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                      {userEntry.percentageScore}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {formatCompletionTime(userEntry.completionTimeSeconds)}
                  </div>
                </div>
              </div>
            )}

            {/* Content based on data availability */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                Loading leaderboard...
              </div>
            ) : !leaderboard || leaderboard.totalParticipants === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏆</div>
                <h5 style={{ margin: '0 0 0.5rem 0' }}>No Rankings Yet</h5>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
                  Be the first to complete this week's {getSubjectDisplayName(subject)} quiz and
                  claim the top spot!
                </p>
              </div>
            ) : (
              <div>
                <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#333' }}>
                  Top 10 This Week
                </h5>

                <div>
                  {leaderboard.topTen.slice(0, 10).map((entry, index) => {
                    const isCurrentUser = user && entry.userId === user.uid;

                    return (
                      <div
                        key={entry.userId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 0.5rem',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: isCurrentUser ? '#f0e7f8' : 'transparent',
                          borderRadius: isCurrentUser ? '4px' : '0',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <div
                            style={{
                              width: '24px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && `${index + 1}`}
                          </div>
                          <div
                            style={{
                              marginLeft: '0.5rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {entry.displayName}
                            {isCurrentUser && (
                              <span style={{ color: '#6b5ca5', fontWeight: 'bold' }}> (You)</span>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                            {entry.percentageScore}%
                          </div>
                          <div style={{ color: '#666', minWidth: '45px', textAlign: 'right' }}>
                            {formatCompletionTime(entry.completionTimeSeconds)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats (only show if there's data) */}
            {leaderboard && leaderboard.totalParticipants > 0 && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#666',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span>Total Players:</span>
                  <span>{leaderboard.totalParticipants}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span>Average Score:</span>
                  <span>{leaderboard.averageScore}%</span>
                </div>
                {lastUpdate && (
                  <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                    Updated: {(() => {
                      try {
                        const date = lastUpdate instanceof Date ? lastUpdate : new Date(lastUpdate);
                        return date.toLocaleTimeString();
                      } catch (error) {
                        console.warn('Invalid timestamp format:', lastUpdate);
                        return new Date().toLocaleTimeString();
                      }
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toggle Button (when widget is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: '50%',
            right: '10px',
            transform: 'translateY(-50%)',
            backgroundColor: '#6b5ca5',
            color: 'white',
            border: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '1rem 0.5rem',
            cursor: 'pointer',
            zIndex: 1000,
            fontSize: '1.2rem',
            boxShadow: '-2px 0 10px rgba(0,0,0,0.2)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }}
          title="Show Leaderboard"
        >
          🏆 Leaderboard
        </button>
      )}
    </>
  );
};

export default LiveLeaderboard;