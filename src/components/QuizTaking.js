// Updated QuizTaking.js with clean minimalist design
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getCurrentQuiz, hasUserAttempted, submitQuizAttempt, getQuizPrizePool } from '../services/quizService';
import { getQuizTimeStatus, formatDuration } from '../utils/quizUtils';

const QuizTaking = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const user = auth.currentUser;

  // Check if we're in dashboard context
  const isDashboardContext = location.pathname.includes('/premium');

  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quiz progress state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load quiz and check access
  useEffect(() => {
    loadQuizData();
  }, [subject]);

  // Timer for elapsed time
  useEffect(() => {
    if (!quizStarted || quizCompleted) return;

    const timer = setInterval(() => {
      setTimeElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, startTime]);

  const loadQuizData = async () => {
    if (!user) {
      setError('Please log in to take the quiz');
      setLoading(false);
      return;
    }

    try {
      // Get current quiz
      const quizResult = await getCurrentQuiz(subject);

      if (!quizResult.success || !quizResult.data) {
        setError('No active quiz found for this subject');
        setLoading(false);
        return;
      }

      const currentQuiz = quizResult.data;

      // Check if quiz is actually live
      const timeStatus = getQuizTimeStatus(currentQuiz.scheduledStart, currentQuiz.scheduledEnd);
      if (timeStatus.status !== 'active') {
        setError('Quiz is not currently active');
        setLoading(false);
        return;
      }

      // Check if user already attempted
      const attemptCheck = await hasUserAttempted(user.uid, currentQuiz.quizId);
      if (attemptCheck.hasAttempted) {
        setError('You have already taken this quiz');
        setLoading(false);
        return;
      }

      setQuiz(currentQuiz);

      // Initialize answers array
      setAnswers(new Array(currentQuiz.questions.length).fill(''));
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setStartTime(Date.now());
  };

  const handleAnswerSelect = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);

    try {
      const completionTimeSeconds = Math.floor(timeElapsed / 1000);

      const attemptData = {
        userId: user.uid,
        quizId: quiz.quizId,
        subject: quiz.subject,
        answers: answers,
        correctAnswers: quiz.questions.map((q) => q.correctAnswer),
        totalQuestions: quiz.questions.length,
        completionTimeSeconds,
        startedAt: new Date(startTime),
        displayName: user.displayName || user.email.split('@')[0],
      };

      const result = await submitQuizAttempt(attemptData);

      if (result.success) {
        setQuizCompleted(true);
        setTimeout(() => {
          if (isDashboardContext) {
            navigate('/premium', { state: { activeSection: 'quiz', showResults: true } });
          } else {
            navigate(`/quiz/${subject}/results`);
          }
        }, 2000);
      } else {
        setError('Failed to submit quiz: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz');
    } finally {
      setSubmitting(false);
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

  // Small loading component
  const SmallLoading = ({ text = "Loading..." }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      color: '#64748b'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        border: '2px solid #f3f4f6',
        borderTop: '2px solid #0ea5e9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: '0.75rem'
      }} />
      {text}
    </div>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <SmallLoading text="Loading quiz..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          {isDashboardContext && (
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <button 
                onClick={() => navigate('/premium', { state: { activeSection: 'quiz' } })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0ea5e9',
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
          
          <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>⚠</div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '1.25rem' }}>Quiz Unavailable</h2>
          <p style={{ margin: '0 0 2rem 0', color: '#64748b' }}>{error}</p>
          <button
            onClick={() => isDashboardContext ? navigate('/premium') : navigate('/')}
            style={{
              background: '#0ea5e9',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            {isDashboardContext ? 'Back to Dashboard' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '1.5rem'
          }}>
            ✓
          </div>
          <h1 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.5rem' }}>Quiz Completed!</h1>
          <p style={{ margin: '0 0 1.5rem 0', color: '#64748b' }}>
            Your answers have been submitted successfully.
          </p>
          <SmallLoading text={isDashboardContext ? 'Returning to dashboard...' : 'Calculating results...'} />
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          maxWidth: '600px',
          width: '100%'
        }}>
          {isDashboardContext && (
            <div style={{ marginBottom: '1.5rem' }}>
              <button 
                onClick={() => navigate('/premium', { state: { activeSection: 'quiz' } })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#059669',
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
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#64748b',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {getSubjectDisplayName(subject)}
            </div>
            <h1 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '1.5rem' }}>
              Ready to Begin?
            </h1>
            <div style={{ color: '#64748b', fontSize: '1rem' }}>{quiz.title}</div>
          </div>

          {/* Instructions */}
          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1rem' }}>
              Quiz Instructions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  {quiz.questions.length} Questions
                </div>
                <div>Multiple choice format</div>
              </div>
              <div>
                <div style={{ fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  Timed Scoring
                </div>
                <div>Accuracy + speed matters</div>
              </div>
              <div>
                <div style={{ fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  One Attempt Only
                </div>
                <div>No retakes allowed</div>
              </div>
              <div>
                <div style={{ fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  Stay Focused
                </div>
                <div>Don't refresh or leave</div>
              </div>
            </div>
          </div>

          {/* Warning and Start Button */}
          <div style={{
            padding: '1rem',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            marginBottom: '2rem',
            fontSize: '0.875rem',
            color: '#92400e'
          }}>
            <strong>Ready to begin?</strong> Once you start, you cannot pause or restart the quiz.
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={startQuiz}
              style={{
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#0284c7'}
              onMouseOut={(e) => e.target.style.background = '#0ea5e9'}
            >
              Start Quiz Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const answeredCount = answers.filter((a) => a !== '').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {isDashboardContext && (
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to leave the quiz? Your progress will be lost.')) {
                  navigate('/premium', { state: { activeSection: 'quiz' } });
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#059669',
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

        {/* Quiz Header */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0', color: '#374151', fontSize: '1.25rem' }}>
                {getSubjectDisplayName(subject)} Quiz
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#374151', fontWeight: '600', fontSize: '1.1rem' }}>
                {formatDuration(timeElapsed)}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Time Elapsed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '6px',
            background: '#f1f5f9',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: '#059669',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Question Content */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              color: '#64748b',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Question {currentQuestionIndex + 1}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '0.875rem'
            }}>
              {answeredCount}/{quiz.questions.length} answered
            </div>
          </div>

          <h3 style={{
            margin: '0 0 2rem 0',
            color: '#374151',
            fontSize: '1.25rem',
            lineHeight: '1.6'
          }}>
            {currentQuestion.question}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestionIndex] === option;
              const optionLetter = String.fromCharCode(65 + index);

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: isSelected ? '#f0fdf4' : 'white',
                    border: `2px solid ${isSelected ? '#0ea5e9' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.target.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.target.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isSelected ? '#0ea5e9' : '#f8fafc',
                    color: isSelected ? 'white' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {optionLetter}
                  </div>
                  <div style={{
                    color: '#374151',
                    fontSize: '1rem',
                    lineHeight: '1.5'
                  }}>
                    {option}
                  </div>
                  {isSelected && (
                    <div style={{
                      marginLeft: 'auto',
                      color: '#0ea5e9',
                      fontSize: '1.25rem'
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Controls */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              style={{
                background: currentQuestionIndex === 0 ? '#f8fafc' : 'white',
                color: currentQuestionIndex === 0 ? '#94a3b8' : '#374151',
                border: '1px solid #e2e8f0',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              ← Previous
            </button>

            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={submitting || answers.includes('')}
                style={{
                  background: (submitting || answers.includes('')) ? '#f8fafc' : '#0ea5e9',
                  color: (submitting || answers.includes('')) ? '#94a3b8' : 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  cursor: (submitting || answers.includes('')) ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {submitting && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button 
                onClick={goToNextQuestion}
                style={{
                  background: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.background = '#0284c7'}
                onMouseOut={(e) => e.target.style.background = '#0ea5e9'}
              >
                Next →
              </button>
            )}
          </div>

          {/* Warning for incomplete answers */}
          {answers.includes('') && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#92400e',
              textAlign: 'center'
            }}>
              Please answer all questions before submitting
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QuizTaking;