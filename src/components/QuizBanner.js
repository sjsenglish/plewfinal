// Updated QuizBanner.js - Modern aesthetic with prize pool
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

const QuizBanner = ({ subject }) => {
  const [quiz, setQuiz] = useState(null);
  const [timeStatus, setTimeStatus] = useState(null);
  const [userHasAttempted, setUserHasAttempted] = useState(false);
  const [userAttempt, setUserAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [prizePool, setPrizePool] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);

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

  if (loading) {
    return (
      <div className="quiz-banner-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span>Loading quiz information...</span>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-banner no-quiz">
        <div className="quiz-banner-content">
          <div className="quiz-icon">📅</div>
          <h3>No Quiz Scheduled</h3>
          <p>Check back on Fridays at 4PM GMT for weekly quizzes!</p>
        </div>
      </div>
    );
  }

  // Prize Pool & Leaderboard Component
  const PrizePoolSection = () => (
    <div className="prize-pool-section">
      <div className="prize-pool-header">
        <div className="prize-icon">🏆</div>
        <div className="prize-content">
          <h4>Current Prize Pool</h4>
          <div className="prize-amount">
            ${prizePool?.totalAmount || '500'}
          </div>
        </div>
      </div>
      
      {topPlayers.length > 0 && (
        <div className="current-leaders">
          <h5>🔥 Current Leaders</h5>
          <div className="leaders-list">
            {topPlayers.map((player, index) => (
              <div key={player.userId} className="leader-item">
                <div className="leader-rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div className="leader-info">
                  <span className="leader-name">{player.displayName}</span>
                  <span className="leader-score">{player.percentageScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // User has already attempted this quiz
  if (userHasAttempted && userAttempt) {
    return (
      <div className="quiz-banner completed">
        <div className="quiz-banner-background">
          <div className="floating-particles"></div>
        </div>
        <div className="quiz-banner-content">
          <div className="completion-header">
            <div className="completion-icon">✅</div>
            <h3>Quiz Completed!</h3>
          </div>
          
          <div className="quiz-title">{getSubjectDisplayName(subject)} Weekly Quiz</div>
          
          <div className="results-grid">
            <div className="result-stat">
              <div className="stat-value">{userAttempt.percentageScore}%</div>
              <div className="stat-label">Your Score</div>
            </div>
            <div className="result-stat">
              <div className="stat-value">{formatDuration(userAttempt.completionTimeSeconds * 1000)}</div>
              <div className="stat-label">Time Taken</div>
            </div>
          </div>

          <PrizePoolSection />

          <Button
            onClick={handleViewResults}
            variant="success"
            size="medium"
            theme={getCurrentTheme()}
            className="action-button"
          >
            View Full Results & Leaderboard
          </Button>
        </div>
      </div>
    );
  }

  // Quiz is upcoming
  if (timeStatus?.status === 'upcoming') {
    return (
      <div className="quiz-banner upcoming">
        <div className="quiz-banner-background">
          <div className="floating-particles"></div>
        </div>
        <div className="quiz-banner-content">
          <div className="upcoming-header">
            <div className="quiz-icon">📅</div>
            <h3>Upcoming Quiz</h3>
          </div>
          
          <div className="quiz-title">{getSubjectDisplayName(subject)} Weekly Quiz</div>
          <p className="quiz-timing">{timeStatus.message}</p>

          <PrizePoolSection />

          <div className="quiz-info">
            <div className="info-item">
              <span className="info-icon">⏰</span>
              <span>Quiz opens for 1 hour only</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🚫</span>
              <span>No retakes allowed</span>
            </div>
            <div className="info-item">
              <span className="info-icon">⚡</span>
              <span>Scored on accuracy + speed</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz is active
  if (timeStatus?.status === 'active') {
    return (
      <div className="quiz-banner active">
        <div className="quiz-banner-background">
          <div className="floating-particles active"></div>
          <div className="pulse-rings"></div>
        </div>
        <div className="quiz-banner-content">
          <div className="active-header">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span>LIVE</span>
            </div>
            <h3>🔥 QUIZ IS LIVE!</h3>
          </div>
          
          <div className="quiz-title">{getSubjectDisplayName(subject)} Weekly Quiz</div>
          
          <div className="timer-display">
            <div className="timer-circle">
              <span className="timer-value">{Math.ceil(timeRemaining / (1000 * 60))}</span>
              <span className="timer-unit">min</span>
            </div>
            <p className="timer-label">Time Remaining</p>
          </div>

          <PrizePoolSection />

          {user ? (
            <Button
              onClick={handleStartQuiz}
              variant="success"
              size="large"
              theme={getCurrentTheme()}
              className="start-quiz-button"
            >
              🚀 START QUIZ NOW
            </Button>
          ) : (
            <div className="login-prompt">
              <p>Log in to participate in the quiz!</p>
              <Button as="a" href="/login" variant="primary" theme={getCurrentTheme()}>
                Log In to Join
              </Button>
            </div>
          )}

          <div className="quiz-warning">
            ⚡ One attempt only • Scored on accuracy + completion time
          </div>
        </div>
      </div>
    );
  }

  // Quiz is completed
  if (timeStatus?.status === 'completed') {
    return (
      <div className="quiz-banner completed-closed">
        <div className="quiz-banner-background">
          <div className="floating-particles"></div>
        </div>
        <div className="quiz-banner-content">
          <div className="completion-header">
            <div className="quiz-icon">⏰</div>
            <h3>Quiz Ended</h3>
          </div>
          
          <div className="quiz-title">{getSubjectDisplayName(subject)} Weekly Quiz</div>
          <p>This week's quiz has closed. Results available below.</p>

          <PrizePoolSection />

          <Button 
            onClick={handleViewResults} 
            variant="secondary" 
            theme={getCurrentTheme()}
            className="action-button"
          >
            View Results & Leaderboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizBanner;