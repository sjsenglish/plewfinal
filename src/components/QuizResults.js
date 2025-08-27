// Updated QuizResults.js with compact dashboard layout AND sleek full-page design
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import {
  getCurrentQuiz,
  getUserAttempt,
  getLeaderboard,
  getUserRank,
  getQuizPrizePool,
} from '../services/quizService';
import { formatCompletionTime } from '../utils/quizUtils';

const QuizResults = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const user = auth.currentUser;

  // Check if we're in dashboard context
  const isDashboardContext = location.pathname.includes('/premium');

  const [quiz, setQuiz] = useState(null);
  const [userAttempt, setUserAttempt] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [prizePool, setPrizePool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResultsData();
  }, [subject]);

  const loadResultsData = async () => {
    if (!user) {
      setError('Please log in to view results');
      setLoading(false);
      return;
    }

    try {
      // Get current quiz
      const quizResult = await getCurrentQuiz(subject);
      if (!quizResult.success || !quizResult.data) {
        setError('Quiz not found');
        setLoading(false);
        return;
      }

      const currentQuiz = quizResult.data;
      setQuiz(currentQuiz);

      // Get user's attempt
      const attemptResult = await getUserAttempt(user.uid, currentQuiz.quizId);
      if (!attemptResult.success || !attemptResult.data) {
        setError('No quiz attempt found');
        setLoading(false);
        return;
      }

      setUserAttempt(attemptResult.data);

      // Get leaderboard
      const leaderboardResult = await getLeaderboard(currentQuiz.quizId);
      if (leaderboardResult.success && leaderboardResult.data) {
        setLeaderboard(leaderboardResult.data);
      }

      // Get user's rank
      const rankResult = await getUserRank(currentQuiz.quizId, user.uid);
      if (rankResult.success && rankResult.data) {
        setUserRank(rankResult.data);
      }

      // Get prize pool
      const prizeResult = await getQuizPrizePool(currentQuiz.quizId);
      if (prizeResult.success && prizeResult.data) {
        setPrizePool(prizeResult.data);
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setError('Failed to load results');
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

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return { text: 'Outstanding! 🌟', color: '#22c55e', emoji: '🌟' };
    if (percentage >= 80) return { text: 'Excellent! 🎉', color: '#22c55e', emoji: '🎉' };
    if (percentage >= 70) return { text: 'Great job! 👏', color: '#8b5cf6', emoji: '👏' };
    if (percentage >= 60) return { text: 'Good work! 👍', color: '#0ea5e9', emoji: '👍' };
    if (percentage >= 50) return { text: 'Keep practicing! 💪', color: '#f59e0b', emoji: '💪' };
    return { text: "Don't give up! 🚀", color: '#ef4444', emoji: '🚀' };
  };

  const getRankDisplay = (rank, total) => {
    if (rank <= 3) {
      const medals = ['🥇', '🥈', '🥉'];
      return { text: `${medals[rank - 1]} #${rank}`, medal: true };
    }
    
    const percentage = Math.round((rank / total) * 100);
    if (percentage <= 10) return { text: `🔥 Top 10% (#${rank})`, special: true };
    if (percentage <= 25) return { text: `⭐ Top 25% (#${rank})`, special: true };
    if (percentage <= 50) return { text: `📈 Top 50% (#${rank})`, special: false };
    return { text: `#${rank}`, special: false };
  };

  const getPrizeEligibility = (rank) => {
    if (!prizePool) return null;
    
    if (rank === 1) return { amount: prizePool.firstPlace || 250, place: '1st Place' };
    if (rank === 2) return { amount: prizePool.secondPlace || 150, place: '2nd Place' };
    if (rank === 3) return { amount: prizePool.thirdPlace || 100, place: '3rd Place' };
    return null;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: isDashboardContext ? '400px' : '100vh',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: isDashboardContext ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: isDashboardContext ? '#6b5ca5' : 'white' }}>
          <div style={{
            width: '30px', height: '30px', border: '3px solid #f3f3f3',
            borderTop: '3px solid #6b5ca5', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto',
          }} />
          <div>Loading results...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: isDashboardContext ? '2rem' : '4rem',
        textAlign: 'center',
        background: isDashboardContext ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: isDashboardContext ? '300px' : '100vh',
        color: isDashboardContext ? '#374151' : 'white'
      }}>
        {/* Back button for dashboard context */}
        {isDashboardContext && (
          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <button 
              onClick={() => navigate('/premium', { state: { activeSection: 'quiz' } })}
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
        )}
        
        <div style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: isDashboardContext ? '#374151' : 'white', marginBottom: '0.5rem' }}>Oops! Something went wrong</h2>
        <p style={{ color: isDashboardContext ? '#6b7280' : 'rgba(255,255,255,0.8)', marginBottom: '2rem' }}>{error}</p>
        <button
          onClick={() => {
            if (isDashboardContext) {
              navigate('/premium', { state: { activeSection: 'quiz' } });
            } else {
              navigate('/');
            }
          }}
          style={{
            background: '#6366f1',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {isDashboardContext ? '🏠 Back to Dashboard' : '🏠 Back to Home'}
        </button>
      </div>
    );
  }

  const performance = getPerformanceMessage(userAttempt.percentageScore);
  const rankInfo = userRank ? getRankDisplay(userRank.rank, userRank.totalParticipants) : null;
  const prizeEligibility = userRank ? getPrizeEligibility(userRank.rank) : null;

  // Compact layout for dashboard context
  if (isDashboardContext) {
    return (
      <div style={{ 
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Back button */}
        <div style={{ padding: '1rem 1.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
          <button 
            onClick={() => navigate('/premium', { state: { activeSection: 'quiz' } })}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            ← Back to Quiz Dashboard
          </button>
        </div>

        {/* Compact Header */}
        <div style={{
          background: '#f8fafc',
          padding: '1.5rem',
          color: '#374151',
          textAlign: 'center',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            {getSubjectDisplayName(subject)}
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#374151' }}>Quiz Complete!</h1>
          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{quiz?.title}</div>
        </div>

        {/* Compact Stats */}
        <div style={{ padding: '1.5rem' }}>
          {/* Score Circle */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: `4px solid ${performance.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.5rem',
              background: `${performance.color}10`
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: performance.color }}>
                {userAttempt.percentageScore}%
              </span>
            </div>
            <div style={{ color: performance.color, fontSize: '0.9rem', fontWeight: '500' }}>
              {performance.emoji} {performance.text}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#374151' }}>
                {formatCompletionTime(userAttempt.completionTimeSeconds)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Time</div>
            </div>
            
            {userRank && (
              <div style={{ 
                textAlign: 'center', 
                padding: '0.75rem', 
                background: rankInfo.medal ? '#fef3c7' : '#f8fafc', 
                borderRadius: '6px' 
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#374151' }}>
                  {rankInfo.text}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Rank</div>
              </div>
            )}

            <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#374151' }}>
                {userAttempt.correctAnswers}/{userAttempt.totalQuestions}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Correct</div>
            </div>
          </div>

          {/* Prize Winner Banner */}
          {prizeEligibility && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>🎉</div>
              <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '0.25rem' }}>
                Congratulations!
              </div>
              <div style={{ color: '#d97706', fontSize: '1.1rem', fontWeight: 'bold' }}>
                You won ${prizeEligibility.amount}!
              </div>
              <div style={{ color: '#92400e', fontSize: '0.8rem' }}>
                {prizeEligibility.place}
              </div>
            </div>
          )}

          {/* Compact Leaderboard */}
          {leaderboard && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#374151' }}>
                🏆 Top Performers
              </h3>
              
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '50px 1fr 80px 80px',
                  background: '#f9fafb',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div>Rank</div>
                  <div>Player</div>
                  <div>Score</div>
                  <div>Time</div>
                </div>

                {/* Leaderboard Rows */}
                {leaderboard.topTen.slice(0, 10).map((entry, index) => {
                  const isCurrentUser = entry.userId === user.uid;
                  const rank = index + 1;
                  
                  return (
                    <div 
                      key={entry.userId} 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 80px 80px',
                        padding: '0.75rem',
                        fontSize: '0.8rem',
                        borderBottom: index < leaderboard.topTen.length - 1 ? '1px solid #f3f4f6' : 'none',
                        background: isCurrentUser ? '#eff6ff' : 'white'
                      }}
                    >
                      <div style={{ fontWeight: '500' }}>
                        {rank === 1 && '🥇'}
                        {rank === 2 && '🥈'}
                        {rank === 3 && '🥉'}
                        {rank > 3 && `#${rank}`}
                      </div>
                      <div style={{ 
                        fontWeight: isCurrentUser ? '600' : '400',
                        color: isCurrentUser ? '#1e40af' : '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {entry.displayName}
                        {isCurrentUser && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem' }}>← You</span>}
                      </div>
                      <div style={{ fontWeight: '600', color: '#059669' }}>
                        {entry.percentageScore}%
                      </div>
                      <div style={{ color: '#6b7280' }}>
                        {formatCompletionTime(entry.completionTimeSeconds)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leaderboard Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                <span>Total: {leaderboard.totalParticipants} players</span>
                <span>Average: {leaderboard.averageScore}%</span>
              </div>
            </div>
          )}

          {/* Compact Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginTop: '1.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => navigate('/premium', { state: { activeSection: 'quiz' } })}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '140px'
              }}
            >
              🏠 Back to Dashboard
            </button>

            <button
              onClick={() => {
                const shareText = `I scored ${userAttempt.percentageScore}% on the ${getSubjectDisplayName(subject)} quiz!${prizeEligibility ? ` And won $${prizeEligibility.amount}!` : ''} 🎉`;
                
                if (navigator.share) {
                  navigator.share({
                    title: `${getSubjectDisplayName(subject)} Quiz Results`,
                    text: shareText,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(`${shareText} Check it out at ${window.location.origin}`);
                  alert('Results copied to clipboard!');
                }
              }}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '100px'
              }}
            >
              📱 Share
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full page layout for non-dashboard context - Modern redesign
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{ 
        position: 'relative', 
        zIndex: 1,
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: '2rem 1rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          color: 'white',
          marginBottom: '3rem',
          padding: '2rem 0'
        }}>
          <div style={{ 
            fontSize: '0.9rem', 
            opacity: 0.9, 
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '500'
          }}>
            {getSubjectDisplayName(subject)}
          </div>
          
          <h1 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '3rem', 
            fontWeight: 'bold',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)'
          }}>
            Quiz Complete! 🎉
          </h1>
          
          <div style={{ 
            fontSize: '1.1rem', 
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {quiz?.title}
          </div>
        </div>

        {/* Main Content Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          flex: 1
        }}>
          
          {/* Score Section */}
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            position: 'relative'
          }}>
            {/* Performance message */}
            <div style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: performance.color,
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>{performance.emoji}</span>
              {performance.text}
            </div>

            {/* Score Circle */}
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: `conic-gradient(${performance.color} ${userAttempt.percentageScore * 3.6}deg, #e5e7eb 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
              }}>
                <span style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  color: performance.color,
                  lineHeight: 1
                }}>
                  {userAttempt.percentageScore}%
                </span>
                <span style={{ 
                  fontSize: '0.9rem', 
                  color: '#6b7280',
                  marginTop: '0.5rem' 
                }}>
                  Score
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1.5rem',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <div style={{ 
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏱️</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                  {formatCompletionTime(userAttempt.completionTimeSeconds)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Completion Time</div>
              </div>
              
              {userRank && (
                <div style={{ 
                  background: rankInfo.medal ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'white',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  textAlign: 'center',
                  border: rankInfo.medal ? '2px solid #f59e0b' : 'none'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏆</div>
                  <div style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 'bold', 
                    color: rankInfo.medal ? '#92400e' : '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    {rankInfo.text}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: rankInfo.medal ? '#92400e' : '#6b7280' 
                  }}>
                    Your Rank
                  </div>
                </div>
              )}

              <div style={{ 
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                  {userAttempt.correctAnswers}/{userAttempt.totalQuestions}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Correct Answers</div>
              </div>
            </div>
          </div>

          {/* Prize Winner Banner */}
          {prizeEligibility && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '3px solid #f59e0b',
              margin: '2rem',
              borderRadius: '20px',
              padding: '2rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '-10px',
                right: '-10px',
                bottom: '-10px',
                background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆✨</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
                  Congratulations! You're a Winner!
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#d97706', marginBottom: '0.5rem' }}>
                  ${prizeEligibility.amount}
                </div>
                <div style={{ fontSize: '1.1rem', color: '#92400e', fontWeight: '600' }}>
                  {prizeEligibility.place} Prize
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Section */}
          {leaderboard && (
            <div style={{ padding: '2rem' }}>
              <h2 style={{ 
                margin: '0 0 2rem 0', 
                fontSize: '1.8rem', 
                color: '#374151',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                🏆 Leaderboard
              </h2>
              
              <div style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb'
              }}>
                {/* Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 100px 100px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '1rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div>Rank</div>
                  <div style={{ textAlign: 'left' }}>Player</div>
                  <div>Score</div>
                  <div>Time</div>
                </div>

                {/* Leaderboard Rows */}
                {leaderboard.topTen.slice(0, 10).map((entry, index) => {
                  const isCurrentUser = entry.userId === user.uid;
                  const rank = index + 1;
                  
                  return (
                    <div 
                      key={entry.userId} 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr 100px 100px',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        borderBottom: index < leaderboard.topTen.length - 1 ? '1px solid #f3f4f6' : 'none',
                        background: isCurrentUser 
                          ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' 
                          : index % 2 === 0 ? '#fafafa' : 'white',
                        transition: 'all 0.2s ease',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ 
                        fontWeight: '600',
                        textAlign: 'center',
                        fontSize: rank <= 3 ? '1.2rem' : '0.9rem'
                      }}>
                        {rank === 1 && '🥇'}
                        {rank === 2 && '🥈'}
                        {rank === 3 && '🥉'}
                        {rank > 3 && `#${rank}`}
                      </div>
                      <div style={{ 
                        fontWeight: isCurrentUser ? '600' : '400',
                        color: isCurrentUser ? '#1e40af' : '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {entry.displayName}
                        {isCurrentUser && (
                          <span style={{ 
                            fontSize: '0.75rem',
                            background: '#3b82f6',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontWeight: '700',
                        color: '#059669',
                        textAlign: 'center',
                        fontSize: '1rem'
                      }}>
                        {entry.percentageScore}%
                      </div>
                      <div style={{ 
                        color: '#6b7280',
                        textAlign: 'center',
                        fontFamily: 'monospace'
                      }}>
                        {formatCompletionTime(entry.completionTimeSeconds)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leaderboard Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '12px',
                fontSize: '0.9rem',
                color: '#6b7280'
              }}>
                <span>
                  <strong style={{ color: '#374151' }}>{leaderboard.totalParticipants}</strong> total participants
                </span>
                <span>
                  Average score: <strong style={{ color: '#374151' }}>{leaderboard.averageScore}%</strong>
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            padding: '2rem',
            display: 'flex', 
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s ease',
                minWidth: '180px',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)';
              }}
            >
              🏠 Back Home
            </button>

            <button
              onClick={() => {
                const shareText = `I scored ${userAttempt.percentageScore}% on the ${getSubjectDisplayName(subject)} quiz!${prizeEligibility ? ` And won ${prizeEligibility.amount}!` : ''} 🎉`;
                
                if (navigator.share) {
                  navigator.share({
                    title: `${getSubjectDisplayName(subject)} Quiz Results`,
                    text: shareText,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(`${shareText} Check it out at ${window.location.origin}`);
                  alert('Results copied to clipboard!');
                }
              }}
              style={{
                background: 'white',
                color: '#374151',
                border: '2px solid #e5e7eb',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                minWidth: '180px',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = '#9ca3af';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              📱 Share Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;