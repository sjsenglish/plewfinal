// src/components/QuizReview.js - Updated for TSA and Maths support with Image Support
import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { usePaywall } from '../hooks/usePaywall';
import { checkVideoAccess, incrementVideoUsage } from '../services/videoUsageService';
import VideoLimitModal from './VideoLimitModal';

// Helper function to convert Firebase Storage URLs to direct URLs
const getImageUrl = (url) => {
  if (!url) return '';
  
  // If it's a Firebase Storage gs:// URL, convert it
  if (url.startsWith('gs://')) {
    // Extract bucket and path from gs://bucket/path format
    const gsMatch = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (gsMatch) {
      const bucket = gsMatch[1];
      const path = gsMatch[2];
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    }
  }
  
  return url;
};

const QuizReview = ({ results, questions, onClose, packData }) => {
  const [videoStates, setVideoStates] = useState({});
  const [showVideoLimitModal, setShowVideoLimitModal] = useState(false);
  const [videoUsage, setVideoUsage] = useState(null);
  const [checkingVideoAccess, setCheckingVideoAccess] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  const { isPaidUser } = usePaywall();

  // Load video usage on component mount
  useEffect(() => {
    if (user) {
      loadVideoUsage();
    }
  }, [user?.uid, isPaidUser]);

  const loadVideoUsage = useCallback(async () => {
    if (!user) return;
    
    try {
      const accessResult = await checkVideoAccess(user.uid, isPaidUser);
      if (accessResult.success) {
        setVideoUsage(accessResult.usage);
      }
    } catch (error) {
      console.error('Error loading video usage:', error);
    }
  }, [user?.uid, isPaidUser]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreClass = (percentage) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    return 'poor';
  };

  // Get video URL from question data
  const getVideoUrl = (question) => {
    return question?.solution_video || question?.videoSolutionLink || question?.video_solution_link || '';
  };

  // Handle video button click
  const handleVideoClick = async (questionId, videoUrl) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setCheckingVideoAccess(true);

    try {
      const accessResult = await checkVideoAccess(user.uid, isPaidUser);
      
      if (!accessResult.success) {
        console.error('Error checking video access:', accessResult.error);
        alert('Unable to check video access. Please try again.');
        return;
      }

      if (accessResult.canWatch) {
        // User can watch video - increment usage and show video
        if (!isPaidUser) {
          const incrementResult = await incrementVideoUsage(user.uid);
          if (incrementResult.success) {
            setVideoUsage(incrementResult.data);
          }
        }
        setVideoStates(prev => ({ ...prev, [questionId]: { showVideo: true, videoUrl } }));
      } else {
        // User has reached limit - show limit modal
        setVideoUsage(accessResult.usage);
        setShowVideoLimitModal(true);
      }
    } catch (error) {
      console.error('Error handling video access:', error);
      alert('Unable to check video access. Please try again.');
    } finally {
      setCheckingVideoAccess(false);
    }
  };

  const closeVideo = (questionId) => {
    setVideoStates(prev => ({ ...prev, [questionId]: { ...prev[questionId], showVideo: false } }));
  };

  const closeLimitModal = () => {
    setShowVideoLimitModal(false);
  };

  // Get video button text
  const getVideoButtonText = () => {
    if (checkingVideoAccess) return 'Checking...';
    if (!user) return 'Log in to Watch';
    if (isPaidUser) return 'Watch Solution';
    if (videoUsage && videoUsage.remaining === 0) return 'Daily Limit Reached';
    if (videoUsage) return `Watch Solution (${videoUsage.remaining} left)`;
    return 'Watch Solution';
  };

  // Get video button disabled state
  const isVideoButtonDisabled = () => {
    if (checkingVideoAccess) return true;
    if (!user) return false;
    if (isPaidUser) return false;
    return videoUsage && videoUsage.remaining === 0;
  };

  // Helper function to extract YouTube video ID
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <>
      <div className="quiz-review-overlay">
        <div className="quiz-review-modal">
          <div className="quiz-review-header">
            <h2>📊 Quiz Review</h2>
            <button onClick={onClose} className="close-btn">×</button>
          </div>

          <div className="quiz-review-body">
            {/* Score Summary */}
            <div className="score-section">
              <div className={`score-circle ${getScoreClass(results.percentage)}`}>
                <span className="percentage">{results.percentage}%</span>
                <span className="score-text">{results.score}/{results.totalQuestions}</span>
              </div>
              <div className="score-details">
                <div className="score-stat">
                  <span className="stat-label">Correct Answers</span>
                  <span className="stat-value correct">{results.score}</span>
                </div>
                <div className="score-stat">
                  <span className="stat-label">Incorrect Answers</span>
                  <span className="stat-value incorrect">{results.totalQuestions - results.score}</span>
                </div>
                {results.timeElapsed && (
                  <div className="score-stat">
                    <span className="stat-label">Time Taken</span>
                    <span className="stat-value">{formatTime(results.timeElapsed)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Questions Section */}
            <div className="questions-section">
              <h3>Question Breakdown</h3>
              <div className="questions-list">
                {results.answers?.map((result, index) => {
                  const question = questions.find(q => q.objectID === result.questionId);
                  const videoUrl = getVideoUrl(question);
                  const questionVideoState = videoStates[result.questionId] || {};
                  
                  return (
                    <div key={index} className={`question-card ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                      {/* Question Header */}
                      <div className="question-header">
                        <div className="question-info">
                          <span className="question-num">Q{index + 1}</span>
                          <span className={`status-icon ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                            {result.isCorrect ? '✓' : '✗'}
                          </span>
                        </div>
                        {videoUrl && (
                          <button
                            className={`video-solution-btn ${isVideoButtonDisabled() ? 'disabled' : ''}`}
                            onClick={() => handleVideoClick(result.questionId, videoUrl)}
                            disabled={isVideoButtonDisabled()}
                            aria-label="Watch video solution"
                          >
                            <span className="video-icon">▶</span>
                            <span>{getVideoButtonText()}</span>
                          </button>
                        )}
                      </div>

                      {/* Video Player (if active) */}
                      {questionVideoState.showVideo && (
                        <div className="embedded-video-container">
                          <div className="video-header">
                            <h4>Video Solution</h4>
                            <button 
                              className="video-close-btn"
                              onClick={() => closeVideo(result.questionId)}
                              aria-label="Close video"
                            >
                              ×
                            </button>
                          </div>
                          <div className="video-wrapper">
                            <iframe
                              src={`https://www.youtube.com/embed/${getYoutubeId(questionVideoState.videoUrl)}?autoplay=1&rel=0`}
                              title="Video Solution"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}

                      {/* Question Content */}
                      <div className="question-content">
                        {/* TSA Question Content */}
                        {packData?.subject === 'tsa' && (
                          <>
                            {/* Show the PASSAGE first (question_content) */}
                            {question?.question_content && (
                              <div className="question-passage">
                                <strong>Passage:</strong>
                                <div style={{ marginTop: '8px', lineHeight: '1.6' }}>
                                  {question.question_content}
                                </div>
                              </div>
                            )}

                            {/* Image Display */}
                            {(question?.image_url || question?.imageFile || question?.image_file) && (
                              <div className="question-image">
                                <img
                                  src={getImageUrl(question.image_url || question.imageFile || question.image_file)}
                                  alt={`Question ${index + 1}`}
                                  loading="lazy"
                                  style={{ maxWidth: '100%', height: 'auto', margin: '10px 0', borderRadius: '8px' }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    const errorMsg = document.createElement('div');
                                    errorMsg.className = 'image-error';
                                    errorMsg.textContent = 'Image temporarily unavailable';
                                    errorMsg.style.color = '#666';
                                    errorMsg.style.padding = '10px';
                                    errorMsg.style.fontStyle = 'italic';
                                    e.target.parentNode.appendChild(errorMsg);
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Then show the actual QUESTION */}
                            {question?.question && (
                              <div className="question-main">
                                <strong>Question:</strong> {question.question}
                              </div>
                            )}
                            
                            {/* Show answer options */}
                            {question?.options && question.options.length > 0 && (
                              <div className="question-options">
                                <strong>Options:</strong>
                                <div className="options-list">
                                  {question.options.map((option, optIndex) => (
                                    <div 
                                      key={optIndex} 
                                      className={`option-item ${
                                        option.id === result.correctAnswer ? 'correct-option' : ''
                                      } ${
                                        option.id === result.userAnswer && option.id !== result.correctAnswer ? 'user-wrong-answer' : ''
                                      } ${
                                        option.id === result.userAnswer && option.id === result.correctAnswer ? 'user-correct-answer' : ''
                                      }`}
                                    >
                                      <span className="option-id">{option.id}</span>
                                      <span className="option-text">{option.text}</span>
                                      {option.id === result.correctAnswer && (
                                        <span className="option-badge correct">Correct</span>
                                      )}
                                      {option.id === result.userAnswer && option.id !== result.correctAnswer && (
                                        <span className="option-badge your-answer">Your Answer</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Maths Question Content */}
                        {packData?.subject === 'maths' && (
                          <>
                            {/* Maths Info */}
                            <div className="question-maths-info">
                              {question?.id && (
                                <div className="maths-info-item">
                                  <strong>Exam:</strong> {question.id.split('_')[0]} {question.id.split('_')[1]}
                                </div>
                              )}
                              {question?.spec_topic && (
                                <div className="maths-info-item">
                                  <strong>Spec Topic:</strong> {question.spec_topic}
                                  {question.spec_point && ` (${question.spec_point})`}
                                </div>
                              )}
                              {question?.question_topic && (
                                <div className="maths-info-item">
                                  <strong>Topic:</strong> {question.question_topic}
                                </div>
                              )}
                              {question?.marks && (
                                <div className="maths-info-item">
                                  <strong>Marks:</strong> {question.marks}
                                </div>
                              )}
                            </div>

                            {/* Image for Maths */}
                            {(question?.image_url || question?.imageFile || question?.image_file || question?.imageUrl) && (
                              <div className="question-image">
                                <img
                                  src={getImageUrl(question.image_url || question.imageFile || question.image_file || question.imageUrl)}
                                  alt={`Question ${index + 1}`}
                                  loading="lazy"
                                  style={{ maxWidth: '100%', height: 'auto', margin: '10px 0', borderRadius: '8px' }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    const errorMsg = document.createElement('div');
                                    errorMsg.className = 'image-error';
                                    errorMsg.textContent = 'Image temporarily unavailable';
                                    errorMsg.style.color = '#666';
                                    errorMsg.style.padding = '10px';
                                    errorMsg.style.fontStyle = 'italic';
                                    e.target.parentNode.appendChild(errorMsg);
                                  }}
                                />
                              </div>
                            )}

                            {/* User's Working */}
                            <div className="question-working">
                              <strong>Your Working:</strong>
                              <div className="working-content">
                                {result.userAnswer || 'No answer provided'}
                              </div>
                            </div>

                            {/* Model Answer (if available) */}
                            {question?.correct_answer && (
                              <div className="question-model-answer">
                                <strong>Model Answer:</strong>
                                <div className="model-answer-content">
                                  {question.correct_answer}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Korean-English Question Content */}
                        {packData?.subject === 'korean-english' && (
                          <>
                            {/* Korean Text Display */}
                            {(question?.questionText || question?.korean) && (
                              <div className="question-korean">
                                <strong>Korean Text:</strong>
                                <div style={{ 
                                  fontSize: '18px', 
                                  fontWeight: '600',
                                  marginTop: '8px',
                                  marginBottom: '12px',
                                  color: '#111827',
                                  fontFamily: 'system-ui, -apple-system, sans-serif'
                                }}>
                                  {question.questionText || question.korean}
                                </div>
                              </div>
                            )}
                            
                            {/* Question/Instruction */}
                            {(question?.actualQuestion || question?.english || question?.question) && (
                              <div className="question-instruction">
                                <strong>Question:</strong>
                                <div style={{ marginTop: '8px', lineHeight: '1.6' }}>
                                  {question.actualQuestion || question.english || question.question}
                                </div>
                              </div>
                            )}
                            
                            {/* Answer Options */}
                            {(question?.answerOptions || question?.options) && (question.answerOptions || question.options).length > 0 && (
                              <div className="question-options">
                                <strong>Options:</strong>
                                <div className="options-list">
                                  {(question.answerOptions || question.options).map((option, optIndex) => {
                                    const isCorrect = optIndex === question.correctAnswer;
                                    const isUserAnswer = optIndex === result.userAnswer;
                                    
                                    return (
                                      <div 
                                        key={optIndex} 
                                        className={`option-item ${
                                          isCorrect ? 'correct-option' : ''
                                        } ${
                                          isUserAnswer && !isCorrect ? 'user-wrong-answer' : ''
                                        } ${
                                          isUserAnswer && isCorrect ? 'user-correct-answer' : ''
                                        }`}
                                      >
                                        <span className="option-id">{optIndex + 1}</span>
                                        <span className="option-text">
                                          {typeof option === 'string' ? option : option.text || option.option || `Option ${optIndex + 1}`}
                                        </span>
                                        {isCorrect && (
                                          <span className="option-badge correct">Correct</span>
                                        )}
                                        {isUserAnswer && !isCorrect && (
                                          <span className="option-badge your-answer">Your Answer</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Default fallback for unknown subjects */}
                        {(!packData?.subject || !['tsa', 'maths', 'korean-english'].includes(packData.subject)) && (
                          <div className="question-generic">
                            <div className="question-text">
                              {question?.question || question?.question_content || 'Question content'}
                            </div>
                          </div>
                        )}
                        
                        {/* Answer Summary */}
                        <div className="answers-section">
                          <div className="user-answer">
                            <strong>Your answer:</strong> {
                              packData?.subject === 'korean-english' && typeof result.userAnswer === 'number' 
                                ? `${result.userAnswer + 1} - ${
                                    (question?.answerOptions || question?.options)?.[result.userAnswer] || 'Option ' + (result.userAnswer + 1)
                                  }`
                                : result.userAnswer || 'Not answered'
                            }
                          </div>
                          {(packData?.subject === 'tsa' || packData?.subject === 'korean-english') && (
                            <div className="correct-answer">
                              <strong>Correct answer:</strong> {
                                packData?.subject === 'korean-english' && typeof result.correctAnswer === 'number'
                                  ? `${result.correctAnswer + 1} - ${
                                      (question?.answerOptions || question?.options)?.[result.correctAnswer] || 'Option ' + (result.correctAnswer + 1)
                                    }`
                                  : result.correctAnswer
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="quiz-review-footer">
            <button onClick={() => window.location.reload()} className="try-again-btn">
              🔄 Try Again
            </button>
            <button onClick={onClose} className="close-review-btn">
              Close Review
            </button>
          </div>
        </div>
      </div>

      {/* Video Limit Modal */}
      <VideoLimitModal 
        isOpen={showVideoLimitModal}
        onClose={closeLimitModal}
        usageInfo={videoUsage}
      />
    </>
  );
};

export default QuizReview;