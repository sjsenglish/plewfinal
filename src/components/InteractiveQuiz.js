// src/components/InteractiveQuiz.js - Updated with ProfilePage design consistency and navbar hiding
import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { usePaywall } from '../hooks/usePaywall';
import { checkVideoAccess, incrementVideoUsage } from '../services/videoUsageService';
import VideoLimitModal from './VideoLimitModal';
import { useQuizContext } from '../App';
import { convertFirebaseStorageUrl, getQuestionImageUrl as getQuestionImageUrlFromUtils } from '../utils/urlUtils';
import './QuizReview.css';

// Color palette matching ProfilePage
const COLORS = {
  lightPurple: '#ccccff',
  teal: '#00ced1', 
  lightTeal: '#d8f0ed',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

// Helper function to convert Firebase Storage URLs to direct URLs
const getImageUrl = (url) => {
  return convertFirebaseStorageUrl(url);
};

// EXACT MATCH to PackViewer image detection - now uses centralized utility
const getQuestionImageUrl = (question) => {
  return getQuestionImageUrlFromUtils(question);
};

const getMathsImageUrl = (question) => {
  return getQuestionImageUrl(question);
};

// Enhanced Review Component with Video Solutions - Updated Styling
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
    return 'needs-improvement';
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return COLORS.success;
    if (percentage >= 60) return COLORS.warning;
    return COLORS.error;
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

  // Helper function to convert Korean numbering symbols to indices (for QuizReview)
  const getKoreanAnswerIndexForReview = (correctAnswer) => {
    if (typeof correctAnswer === 'number') {
      return correctAnswer;
    }
    if (typeof correctAnswer === 'string') {
      const koreanNumberMap = { '①': 0, '②': 1, '③': 2, '④': 3, '⑤': 4 };
      for (const [symbol, index] of Object.entries(koreanNumberMap)) {
        if (correctAnswer.startsWith(symbol)) {
          return index;
        }
      }
    }
    return null;
  };

  return (
    <>
      {/* Updated overlay with ProfilePage styling */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>

          {/* Header */}
          <div style={{
            padding: '16px 32px 12px 32px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 4px 0'
              }}>
                Quiz Review
              </h2>
              <p style={{
                fontSize: '13px',
                color: COLORS.gray,
                margin: '0'
              }}>
                {packData.packName} • {packData.subject.toUpperCase()}
              </p>
            </div>
            
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                color: COLORS.gray,
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              ×
            </button>
          </div>

          {/* Compact Score Summary */}
          <div style={{
            padding: '16px 32px',
            backgroundColor: COLORS.white,
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px'
            }}>
              {/* Smaller Score Circle */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: getScoreColor(results.percentage),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '20px', fontWeight: '700' }}>
                  {results.percentage}%
                </span>
                <span style={{ fontSize: '11px', opacity: 0.9 }}>
                  {results.score}/{results.totalQuestions}
                </span>
              </div>

              {/* Horizontal Stats */}
              <div style={{
                display: 'flex',
                gap: '24px',
                flex: 1
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: COLORS.success }}>
                    {results.score}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.gray }}>Correct</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: COLORS.error }}>
                    {results.totalQuestions - results.score}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.gray }}>Incorrect</div>
                </div>

                {results.timeElapsed && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: COLORS.teal }}>
                      {formatTime(results.timeElapsed)}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.gray }}>Time</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Questions List - Scrollable */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px 32px 20px 32px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 16px 0'
            }}>
              Question Breakdown
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.answers?.map((result, index) => {
                const question = questions.find(q => q.objectID === result.questionId);
                const videoUrl = getVideoUrl(question);
                const questionVideoState = videoStates[result.questionId] || {};
                
                return (
                  <div key={index} style={{
                    backgroundColor: COLORS.white,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `2px solid ${result.isCorrect ? COLORS.success + '40' : COLORS.error + '40'}`,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}>
                    {/* Compact Question Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: COLORS.gray
                        }}>
                          Question {index + 1}
                        </span>
                        <div style={{
                          padding: '3px 10px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: result.isCorrect ? COLORS.success + '20' : COLORS.error + '20',
                          color: result.isCorrect ? COLORS.success : COLORS.error
                        }}>
                          {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </div>
                      </div>
                      
                      {videoUrl && (
                        <button
                          onClick={() => handleVideoClick(result.questionId, videoUrl)}
                          disabled={isVideoButtonDisabled()}
                          style={{
                            backgroundColor: COLORS.teal,
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: isVideoButtonDisabled() ? 'not-allowed' : 'pointer',
                            opacity: isVideoButtonDisabled() ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>▶</span>
                          <span>{getVideoButtonText()}</span>
                        </button>
                      )}
                    </div>

                    {/* Video Player (if active) */}
                    {questionVideoState.showVideo && (
                      <div style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0'
                          }}>
                            Video Solution
                          </h4>
                          <button 
                            onClick={() => closeVideo(result.questionId)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              fontSize: '20px',
                              color: COLORS.gray,
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <div style={{
                          position: 'relative',
                          paddingBottom: '56.25%',
                          height: 0,
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${getYoutubeId(questionVideoState.videoUrl)}?autoplay=1&rel=0`}
                            title="Video Solution"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Question Content */}
                    <div>
                      {/* TSA Question Content */}
                      {packData.subject === 'tsa' && (
                        <>
                          {/* Passage */}
                          {question?.question_content && (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: COLORS.darkGray,
                                margin: '0 0 8px 0'
                              }}>
                                Passage
                              </h4>
                              <p style={{
                                fontSize: '14px',
                                color: '#374151',
                                lineHeight: '1.6',
                                margin: '0'
                              }}>
                                {question.question_content}
                              </p>
                            </div>
                          )}

                          {/* Image */}
                          {getQuestionImageUrl(question) && (
                            <div style={{ marginBottom: '16px' }}>
                              <img
                                src={getImageUrl(getQuestionImageUrl(question))}
                                alt={`Question ${index + 1}`}
                                loading="lazy"
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0'
                                }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  const errorMsg = document.createElement('div');
                                  errorMsg.className = 'image-error';
                                  errorMsg.textContent = 'Image temporarily unavailable';
                                  errorMsg.style.color = COLORS.gray;
                                  errorMsg.style.padding = '10px';
                                  errorMsg.style.fontStyle = 'italic';
                                  errorMsg.style.fontSize = '14px';
                                  e.target.parentNode.appendChild(errorMsg);
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Question */}
                          {question?.question && (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: COLORS.darkGray,
                                margin: '0 0 8px 0'
                              }}>
                                Question
                              </h4>
                              <p style={{
                                fontSize: '14px',
                                color: '#374151',
                                lineHeight: '1.6',
                                margin: '0'
                              }}>
                                {question.question}
                              </p>
                            </div>
                          )}
                          
                          {/* Options */}
                          {question?.options && question.options.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: COLORS.darkGray,
                                margin: '0 0 12px 0'
                              }}>
                                Options
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {question.options.map((option, optIndex) => {
                                  const isCorrect = option.id === result.correctAnswer;
                                  const isUserAnswer = option.id === result.userAnswer;
                                  const isWrongUserAnswer = isUserAnswer && !isCorrect;
                                  
                                  let backgroundColor = '#f8fafc';
                                  let borderColor = '#e2e8f0';
                                  let textColor = '#374151';
                                  
                                  if (isCorrect) {
                                    backgroundColor = COLORS.success + '20';
                                    borderColor = COLORS.success;
                                  } else if (isWrongUserAnswer) {
                                    backgroundColor = COLORS.error + '20';
                                    borderColor = COLORS.error;
                                  }

                                  return (
                                    <div 
                                      key={optIndex} 
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        backgroundColor,
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: textColor
                                      }}
                                    >
                                      <span style={{
                                        fontWeight: '600',
                                        minWidth: '20px'
                                      }}>
                                        {option.id}
                                      </span>
                                      <span style={{ flex: 1 }}>
                                        {option.text}
                                      </span>
                                      {isCorrect && (
                                        <span style={{
                                          fontSize: '12px',
                                          fontWeight: '600',
                                          color: COLORS.success,
                                          backgroundColor: COLORS.success + '20',
                                          padding: '2px 8px',
                                          borderRadius: '12px'
                                        }}>
                                          Correct
                                        </span>
                                      )}
                                      {isWrongUserAnswer && (
                                        <span style={{
                                          fontSize: '12px',
                                          fontWeight: '600',
                                          color: COLORS.error,
                                          backgroundColor: COLORS.error + '20',
                                          padding: '2px 8px',
                                          borderRadius: '12px'
                                        }}>
                                          Your Answer
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Maths Question Content */}
                      {packData.subject === 'maths' && (
                        <>
                          {/* Maths Info */}
                          <div style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '16px'
                          }}>
                            {question?.id && (
                              <div style={{
                                fontSize: '14px',
                                color: COLORS.darkGray,
                                marginBottom: '4px'
                              }}>
                                <strong>Exam:</strong> {question.id.split('_')[0]} {question.id.split('_')[1]}
                              </div>
                            )}
                            {question?.spec_topic && (
                              <div style={{
                                fontSize: '14px',
                                color: COLORS.darkGray,
                                marginBottom: '4px'
                              }}>
                                <strong>Spec Topic:</strong> {question.spec_topic}
                                {question.spec_point && ` (${question.spec_point})`}
                              </div>
                            )}
                            {question?.question_topic && (
                              <div style={{
                                fontSize: '14px',
                                color: COLORS.darkGray,
                                marginBottom: '4px'
                              }}>
                                <strong>Topic:</strong> {question.question_topic}
                              </div>
                            )}
                            {question?.marks && (
                              <div style={{
                                fontSize: '14px',
                                color: COLORS.darkGray
                              }}>
                                <strong>Marks:</strong> {question.marks}
                              </div>
                            )}
                          </div>

                          {/* Image for Maths */}
                          {(question?.image_url || question?.imageFile || question?.image_file || question?.imageUrl) && (
                            <div style={{ marginBottom: '16px' }}>
                              <img
                                src={getImageUrl(question.image_url || question.imageFile || question.image_file || question.imageUrl)}
                                alt={`Question ${index + 1}`}
                                loading="lazy"
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0'
                                }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  const errorMsg = document.createElement('div');
                                  errorMsg.className = 'image-error';
                                  errorMsg.textContent = 'Image temporarily unavailable';
                                  errorMsg.style.color = COLORS.gray;
                                  errorMsg.style.padding = '10px';
                                  errorMsg.style.fontStyle = 'italic';
                                  errorMsg.style.fontSize = '14px';
                                  e.target.parentNode.appendChild(errorMsg);
                                }}
                              />
                            </div>
                          )}

                          {/* User's Answer */}
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: COLORS.darkGray,
                              margin: '0 0 8px 0'
                            }}>
                              Your Answer:
                            </h4>
                            <div style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151',
                              minHeight: '60px',
                              whiteSpace: 'pre-wrap',
                              lineHeight: '1.5'
                            }}>
                              {result.userAnswer || 'No answer provided'}
                            </div>
                          </div>

                          {/* Model Answer (if available) */}
                          {question?.correct_answer && (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: COLORS.darkGray,
                                margin: '0 0 8px 0'
                              }}>
                                Model Answer:
                              </h4>
                              <div style={{
                                backgroundColor: COLORS.success + '10',
                                border: `1px solid ${COLORS.success}40`,
                                borderRadius: '8px',
                                padding: '12px',
                                fontSize: '14px',
                                color: '#374151',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {question.correct_answer}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Korean-English Question Content */}
                      {packData.subject === 'korean-english' && (
                        <>
                          {/* Korean Text Display */}
                          {(() => {
                            let koreanText = question?.questionText || question?.korean || '';
                            // Handle object format
                            if (typeof koreanText === 'object' && koreanText !== null) {
                              koreanText = koreanText.sentence || koreanText.text || koreanText.value || '';
                            }
                            return koreanText ? (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: COLORS.darkGray,
                                margin: '0 0 8px 0'
                              }}>
                                Korean Text
                              </h4>
                              <div style={{
                                fontSize: '15px',
                                fontWeight: '500',
                                color: '#374151',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                lineHeight: '1.4',
                                backgroundColor: '#f8fafc',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'left'
                              }}>
                                {koreanText}
                              </div>
                            </div>
                          ) : null;
                          })()}
                          
                          {/* Question/Instruction */}
                          {(() => {
                            let englishText = question?.actualQuestion || question?.english || question?.question || '';
                            // Handle object format
                            if (typeof englishText === 'object' && englishText !== null) {
                              englishText = englishText.sentence || englishText.text || englishText.value || '';
                            }
                            return englishText ? (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: COLORS.darkGray,
                                margin: '0 0 8px 0'
                              }}>
                                Question
                              </h4>
                              <p style={{
                                fontSize: '14px',
                                color: '#374151',
                                lineHeight: '1.6',
                                margin: '0'
                              }}>
                                {englishText}
                              </p>
                            </div>
                          ) : null;
                          })()}
                          
                          {/* Answer Options */}
                          {(question?.answerOptions || question?.options) && (question.answerOptions || question.options).length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: COLORS.darkGray,
                                margin: '0 0 12px 0'
                              }}>
                                Options
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(question.answerOptions || question.options).map((option, optIndex) => {
                                  const correctAnswerIndex = getKoreanAnswerIndexForReview(question.correctAnswer);
                                  const isCorrect = optIndex === correctAnswerIndex;
                                  const isUserAnswer = optIndex === result.userAnswer;
                                  const isWrongUserAnswer = isUserAnswer && !isCorrect;
                                  
                                  let backgroundColor = '#f8fafc';
                                  let borderColor = '#e2e8f0';
                                  let textColor = '#374151';
                                  
                                  if (isCorrect) {
                                    backgroundColor = COLORS.success + '20';
                                    borderColor = COLORS.success;
                                  } else if (isWrongUserAnswer) {
                                    backgroundColor = COLORS.error + '20';
                                    borderColor = COLORS.error;
                                  }

                                  return (
                                    <div 
                                      key={optIndex} 
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        backgroundColor,
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: textColor
                                      }}
                                    >
                                      <span style={{
                                        fontWeight: '600',
                                        minWidth: '20px'
                                      }}>
                                        {optIndex + 1}
                                      </span>
                                      <span style={{ flex: 1 }}>
                                        {typeof option === 'string' ? option : 
                                         typeof option === 'object' ? (option?.text || option?.option || `Option ${optIndex + 1}`) : 
                                         String(option) || `Option ${optIndex + 1}`}
                                      </span>
                                      {isCorrect && (
                                        <span style={{
                                          color: COLORS.success,
                                          fontSize: '16px'
                                        }}>
                                          ✓
                                        </span>
                                      )}
                                      {isWrongUserAnswer && (
                                        <span style={{
                                          color: COLORS.error,
                                          fontSize: '16px'
                                        }}>
                                          ✗
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Answer Summary */}
                      <div style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'grid',
                        gridTemplateColumns: (packData.subject === 'tsa' || packData.subject === 'korean-english') ? '1fr 1fr' : '1fr',
                        gap: '16px'
                      }}>
                        <div>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: COLORS.gray
                          }}>
                            Your Answer:
                          </span>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: result.isCorrect ? COLORS.success : COLORS.error,
                            marginTop: '4px'
                          }}>
                            {packData.subject === 'korean-english' && typeof result.userAnswer === 'number' 
                              ? `${result.userAnswer + 1} - ${
                                  (() => {
                                    const option = (question?.answerOptions || question?.options)?.[result.userAnswer];
                                    return typeof option === 'string' ? option : 
                                           typeof option === 'object' ? (option?.text || option?.option || 'Option ' + (result.userAnswer + 1)) : 
                                           String(option) || 'Option ' + (result.userAnswer + 1);
                                  })()
                                }`
                              : String(result.userAnswer) || 'Not answered'
                            }
                          </div>
                        </div>
                        {(packData.subject === 'tsa' || packData.subject === 'korean-english') && (
                          <div>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: COLORS.gray
                            }}>
                              Correct Answer:
                            </span>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: COLORS.success,
                              marginTop: '4px'
                            }}>
                              {packData.subject === 'korean-english' ? (() => {
                                const correctAnswerIndex = getKoreanAnswerIndexForReview(result.correctAnswer);
                                return typeof correctAnswerIndex === 'number'
                                  ? `${correctAnswerIndex + 1} - ${
                                      (() => {
                                        const option = (question?.answerOptions || question?.options)?.[correctAnswerIndex];
                                        return typeof option === 'string' ? option : 
                                               typeof option === 'object' ? (option?.text || option?.option || 'Option ' + (correctAnswerIndex + 1)) : 
                                               String(option) || 'Option ' + (correctAnswerIndex + 1);
                                      })()
                                    }`
                                  : String(result.correctAnswer);
                              })() : String(result.correctAnswer)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 32px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button 
              onClick={onClose} 
              style={{
                backgroundColor: COLORS.teal,
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
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

const InteractiveQuiz = ({ packData, questions, onClose, onComplete, reviewMode = false, existingAttempt = null, isDemoMode = false }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(existingAttempt?.answers?.reduce((acc, answer) => {
    acc[answer.questionId] = answer.userAnswer;
    return acc;
  }, {}) || {});
  const [showResults, setShowResults] = useState(reviewMode);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [quizStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(existingAttempt || null);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;
  const currentQuestion = questions[currentQuestionIndex];
  
  // Debug logging for Maths questions
  console.log('InteractiveQuiz Debug:', {
    packData: packData,
    questionsCount: questions?.length,
    currentQuestionIndex,
    currentQuestion,
    subject: packData?.subject,
    imageUrl: currentQuestion?.image_url,
    imageFile: currentQuestion?.imageFile,
    image_file: currentQuestion?.image_file,
    imageUrlField: currentQuestion?.imageUrl,
    allFields: currentQuestion ? Object.keys(currentQuestion) : []
  });
  
  // Use quiz context to hide navbar
  const { showQuiz, hideQuiz } = useQuizContext();

  // Show quiz (hide navbar) when component mounts
  useEffect(() => {
    showQuiz();
    
    // Hide quiz (show navbar) when component unmounts
    return () => {
      hideQuiz();
    };
  }, [showQuiz, hideQuiz]);

  // Timer effect (only if not in review mode)
  useEffect(() => {
    if (reviewMode) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - quizStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStartTime, reviewMode]);

  // Debug logging for maths questions
  useEffect(() => {
    console.log('Current question debug info:', {
      packData: packData,
      subject: packData?.subject,
      currentQuestionIndex,
      currentQuestion,
      questionKeys: currentQuestion ? Object.keys(currentQuestion) : [],
      imageFields: {
        image_url: currentQuestion?.image_url,
        imageFile: currentQuestion?.imageFile,
        image_file: currentQuestion?.image_file,
        imageUrl: currentQuestion?.imageUrl,
        image: currentQuestion?.image
      },
      objectID: currentQuestion?.objectID,
      currentAnswer: userAnswers[currentQuestion?.objectID]
    });
  }, [currentQuestionIndex, currentQuestion, userAnswers, packData]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection (disabled in review mode) - Enhanced with validation
  const handleAnswerSelect = (answer) => {
    if (reviewMode) return;
    
    if (!currentQuestion || !currentQuestion.objectID) {
      console.error('Cannot save answer: currentQuestion or objectID is missing', currentQuestion);
      return;
    }
    
    console.log('Saving answer for question:', {
      questionId: currentQuestion.objectID,
      answer: answer,
      subject: packData?.subject,
      answerLength: answer?.length || 0
    });
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.objectID]: answer
    }));
  };

  // Helper function to convert Korean numbering symbols to indices
  const getKoreanAnswerIndex = (correctAnswer) => {
    if (typeof correctAnswer === 'number') {
      return correctAnswer;
    }
    if (typeof correctAnswer === 'string') {
      const koreanNumberMap = { '①': 0, '②': 1, '③': 2, '④': 3, '⑤': 4 };
      for (const [symbol, index] of Object.entries(koreanNumberMap)) {
        if (correctAnswer.startsWith(symbol)) {
          return index;
        }
      }
    }
    return null;
  };

  // Navigate questions
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Calculate results - Updated for different subjects
  const calculateResults = () => {
    let correct = 0;
    const total = questions.length;
    const detailedAnswers = [];

    questions.forEach((question) => {
      const userAnswer = userAnswers[question.objectID];
      let correctAnswer = '';
      let isCorrect = false;

      // Get correct answer based on subject
      if (packData.subject === 'tsa') {
        correctAnswer = question.correct_answer;
        isCorrect = userAnswer === correctAnswer;
      } else if (packData.subject === 'maths') {
        correctAnswer = question.correct_answer || 'Open-ended question';
        // For maths, consider any non-empty answer as "attempted" (not necessarily correct)
        // Since maths answers are subjective, we'll mark as "attempted" rather than correct/incorrect
        isCorrect = userAnswer && userAnswer.trim().length > 0;
      } else if (packData.subject === 'korean-english') {
        correctAnswer = question.correctAnswer;
        const correctAnswerIndex = getKoreanAnswerIndex(correctAnswer);
        isCorrect = typeof userAnswer === 'number' && userAnswer === correctAnswerIndex;
      }

      if (isCorrect) correct++;

      detailedAnswers.push({
        questionId: question.objectID,
        questionText: getQuestionPreview(question),
        userAnswer: userAnswer || '',
        correctAnswer: correctAnswer,
        isCorrect: isCorrect
      });
    });

    return {
      score: correct,
      totalQuestions: total,
      percentage: Math.round((correct / total) * 100),
      answers: detailedAnswers,
      timeElapsed: timeElapsed,
      completedAt: new Date()
    };
  };

// Get question preview text - Updated for all subjects
const getQuestionPreview = (question) => {
  if (packData.subject === 'tsa') {
    return question.question || question.question_content || 'TSA Question';
  } else if (packData.subject === 'maths') {
    const year = question.id ? question.id.split('_')[0] : 'Unknown Year';
    const examCode = question.id ? question.id.split('_')[1] : 'Unknown Exam';
    const questionTopic = question.question_topic || 'Unknown Topic';
    return `${year} ${examCode} - ${questionTopic}`;
  } else if (packData.subject === 'korean-english') {
    // Handle both string and object formats for questionText and actualQuestion
    let korean = question.questionText || question.korean || '';
    let english = question.actualQuestion || question.english || '';
    
    // If these fields are objects, extract the string value
    if (typeof korean === 'object' && korean !== null) {
      korean = korean.sentence || korean.text || korean.value || '';
      console.warn('questionText is an object, extracted:', korean);
    }
    if (typeof english === 'object' && english !== null) {
      english = english.sentence || english.text || english.value || '';
      console.warn('actualQuestion is an object, extracted:', english);
    }
    
    // Ensure we have strings before calling substring - FIXED
    korean = String(korean || '');
    english = String(english || '');
    
    // Only call substring if we have actual content
    if (korean && english) {
      return `${korean.substring(0, 30)}... → ${english.substring(0, 30)}...`;
    } else if (korean) {
      return `Korean: ${korean.substring(0, 40)}...`;
    } else if (english) {
      return `English: ${english.substring(0, 40)}...`;
    }
    return 'Korean-English Question';
  }
  return 'Question';
};

const submitQuiz = async () => {
  if (!isDemoMode && !user) {
    alert('Please log in to save quiz results');
    return;
  }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const calculatedResults = calculateResults();
      
      // Create attempt document with better error handling
      const attemptId = `${packData.packId || 'pack'}_${Date.now()}`;
      
      const attemptData = {
        attemptId,
        packId: packData.packId || packData.id,
        packName: packData.packName,
        subject: packData.subject,
        score: calculatedResults.score,
        totalQuestions: calculatedResults.totalQuestions,
        percentage: calculatedResults.percentage,
        answers: calculatedResults.answers,
        timeElapsed: calculatedResults.timeElapsed,
        completedAt: calculatedResults.completedAt,
        submittedBy: user.uid,
        submittedAt: new Date().toISOString()
      };

// Skip Firebase save in demo mode
if (!isDemoMode && user) {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const attemptRef = doc(collection(userDocRef, 'quizAttempts'), attemptId);
    await setDoc(attemptRef, attemptData);
    console.log('Quiz results saved successfully');
  } catch (firestoreError) {
    console.warn('Failed to save to Firestore:', firestoreError);
    // Continue anyway - we can still show results
  }
}
      
      setResults(calculatedResults);
      setShowResults(true);
      
      if (onComplete) {
        onComplete(calculatedResults);
      }
    } catch (error) {
      console.error('Error in quiz submission:', error);
      setError('Failed to submit quiz. Your answers will still be shown.');
      
      // Still show results even if saving failed
      const calculatedResults = calculateResults();
      setResults(calculatedResults);
      setShowResults(true);
      if (onComplete) {
        onComplete(calculatedResults);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if quiz is complete
  const isQuizComplete = Object.keys(userAnswers).length === questions.length;

  // Get current question's user answer and correctness
  const getCurrentQuestionResult = () => {
    if (!results || !currentQuestion) return null;
    
    return results.answers?.find(answer => answer.questionId === currentQuestion.objectID);
  };

  const currentResult = getCurrentQuestionResult();

  // Get score class for styling
  const getScoreClass = (percentage) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    return 'poor';
  };

  // Validate questions and show error if needed
  if (!questions || questions.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h3>No Questions Available</h3>
          <p>Unable to load questions for this quiz.</p>
          <button onClick={onClose} style={{
            backgroundColor: COLORS.teal,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Close
          </button>
        </div>
      </div>
    );
  }
  
  // Validate current question
  if (!currentQuestion) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h3>Question Loading Error</h3>
          <p>Current question could not be loaded. (Index: {currentQuestionIndex})</p>
          <p><strong>Debug Info:</strong></p>
          <p>Questions: {questions?.length || 0}</p>
          <p>Subject: {packData?.subject || 'Unknown'}</p>
          <button onClick={onClose} style={{
            backgroundColor: COLORS.teal,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  if (showResults && results) {
    return <QuizReview results={results} questions={questions} onClose={onClose} packData={packData} />;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Quiz Header */}
        <div style={{
          padding: '20px 40px 16px 40px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              {reviewMode ? '📖 Review Mode' : packData.packName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                backgroundColor: COLORS.teal + '20',
                color: COLORS.teal,
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {packData.subject.toUpperCase()}
              </span>
              {!reviewMode && (
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: COLORS.teal
                }}>
                  {formatTime(timeElapsed)}
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '28px',
              color: COLORS.gray,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          padding: '16px 40px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: COLORS.gray
            }}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span style={{
              fontSize: '14px',
              color: COLORS.gray
            }}>
              {!reviewMode && `${Object.keys(userAnswers).length} answered`}
              {reviewMode && 'Review Mode'}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              height: '100%',
              backgroundColor: COLORS.teal,
              transition: 'width 0.3s ease',
              borderRadius: '4px'
            }} />
          </div>
        </div>

        {/* Question Navigator */}
        <div style={{
          padding: '16px 40px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {questions.map((_, index) => {
              const hasAnswer = userAnswers[questions[index].objectID];
              const isCorrect = reviewMode && results?.answers?.find(a => a.questionId === questions[index].objectID)?.isCorrect;
              
              let backgroundColor = '#f8fafc';
              let color = COLORS.gray;
              let borderColor = '#e2e8f0';
              
              if (index === currentQuestionIndex) {
                backgroundColor = COLORS.teal;
                color = 'white';
                borderColor = COLORS.teal;
              } else if (reviewMode && isCorrect === true) {
                backgroundColor = COLORS.success + '20';
                color = COLORS.success;
                borderColor = COLORS.success;
              } else if (reviewMode && isCorrect === false) {
                backgroundColor = COLORS.error + '20';
                color = COLORS.error;
                borderColor = COLORS.error;
              } else if (hasAnswer) {
                backgroundColor = COLORS.teal + '20';
                color = COLORS.teal;
                borderColor = COLORS.teal;
              }

              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: `2px solid ${borderColor}`,
                    backgroundColor,
                    color,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '16px 40px',
            backgroundColor: COLORS.error + '10',
            borderBottom: '1px solid #e2e8f0',
            color: COLORS.error,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Current Question - Scrollable Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '32px 40px'
        }}>
          {/* Review Mode Status */}
          {reviewMode && currentResult && (
            <div style={{
              backgroundColor: currentResult.isCorrect ? COLORS.success + '10' : COLORS.error + '10',
              border: `2px solid ${currentResult.isCorrect ? COLORS.success + '40' : COLORS.error + '40'}`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: currentResult.isCorrect ? COLORS.success : COLORS.error
                }}>
                  {currentResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: packData.subject === 'tsa' ? '1fr 1fr' : '1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.gray }}>
                    Your answer:
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '4px' }}>
                    {currentResult.userAnswer || 'Not answered'}
                  </div>
                </div>
                {packData.subject === 'tsa' && (
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.gray }}>
                      Correct answer:
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.success, marginTop: '4px' }}>
                      {currentResult.correctAnswer}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TSA Question Content */}
          {packData.subject === 'tsa' && (
            <div>
              {currentQuestion.question_content && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: COLORS.darkGray,
                    margin: '0 0 12px 0'
                  }}>
                    Passage
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#374151',
                    margin: '0'
                  }}>
                    {currentQuestion.question_content}
                  </p>
                </div>
              )}

              {/* Image Display for TSA Quiz */}
              {getQuestionImageUrl(currentQuestion) && (
                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                  <img
                    src={getImageUrl(getQuestionImageUrl(currentQuestion))}
                    alt={`Question ${currentQuestionIndex + 1}`}
                    loading="lazy"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const errorMsg = document.createElement('div');
                      errorMsg.className = 'image-error';
                      errorMsg.textContent = 'Image temporarily unavailable';
                      errorMsg.style.color = COLORS.gray;
                      errorMsg.style.padding = '20px';
                      errorMsg.style.fontStyle = 'italic';
                      errorMsg.style.fontSize = '14px';
                      errorMsg.style.textAlign = 'center';
                      e.target.parentNode.appendChild(errorMsg);
                    }}
                  />
                </div>
              )}
              
              {currentQuestion.question && (
                <div style={{
                  marginBottom: '32px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 16px 0'
                  }}>
                    Question
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#374151',
                    margin: '0'
                  }}>
                    {currentQuestion.question}
                  </p>
                </div>
              )}

              {currentQuestion.options && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 16px 0'
                  }}>
                    Options
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = userAnswers[currentQuestion.objectID] === option.id;
                      const isCorrect = option.id === currentQuestion.correct_answer;
                      const showCorrect = reviewMode && isCorrect;
                      const showIncorrect = reviewMode && isSelected && !isCorrect;

                      let backgroundColor = COLORS.white;
                      let borderColor = '#e2e8f0';
                      let textColor = '#374151';

                      if (showCorrect) {
                        backgroundColor = COLORS.success + '20';
                        borderColor = COLORS.success;
                      } else if (showIncorrect) {
                        backgroundColor = COLORS.error + '20';
                        borderColor = COLORS.error;
                      } else if (isSelected) {
                        backgroundColor = COLORS.teal + '20';
                        borderColor = COLORS.teal;
                        textColor = COLORS.teal;
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(option.id)}
                          disabled={reviewMode}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px 20px',
                            backgroundColor,
                            border: `2px solid ${borderColor}`,
                            borderRadius: '12px',
                            fontSize: '15px',
                            color: textColor,
                            cursor: reviewMode ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => {
                            if (!reviewMode && !isSelected) {
                              e.target.style.backgroundColor = '#f8fafc';
                              e.target.style.borderColor = COLORS.teal;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!reviewMode && !isSelected) {
                              e.target.style.backgroundColor = COLORS.white;
                              e.target.style.borderColor = '#e2e8f0';
                            }
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: showCorrect ? COLORS.success : showIncorrect ? COLORS.error : isSelected ? COLORS.teal : '#e2e8f0',
                            color: (showCorrect || showIncorrect || isSelected) ? 'white' : COLORS.gray,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            flexShrink: 0
                          }}>
                            {option.id}
                          </div>
                          <div style={{ flex: 1 }}>
                            {option.text}
                          </div>
                          {showCorrect && (
                            <span style={{
                              fontSize: '18px',
                              color: COLORS.success
                            }}>
                              ✓
                            </span>
                          )}
                          {showIncorrect && (
                            <span style={{
                              fontSize: '18px',
                              color: COLORS.error
                            }}>
                              ✗
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Maths Question Content - Enhanced */}
          {packData.subject === 'maths' && (
            <div>
              {/* Question Title */}
              <div style={{
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0'
                }}>
                  Question {currentQuestionIndex + 1}
                </h3>
                {currentQuestion.marks && (
                  <p style={{
                    fontSize: '14px',
                    color: COLORS.gray,
                    margin: '4px 0 0 0'
                  }}>
                    {currentQuestion.marks} marks
                  </p>
                )}
              </div>

              {/* Question Info Panel */}
              {(currentQuestion.question_topic || currentQuestion.spec_topic || currentQuestion.id) && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '1px solid #e2e8f0'
                }}>
                  {currentQuestion.id && (
                    <div style={{
                      fontSize: '13px',
                      color: COLORS.gray,
                      marginBottom: '4px'
                    }}>
                      <strong>Exam:</strong> {currentQuestion.id.replace(/_/g, ' ')}
                    </div>
                  )}
                  {currentQuestion.question_topic && (
                    <div style={{
                      fontSize: '13px',
                      color: COLORS.gray,
                      marginBottom: '4px'
                    }}>
                      <strong>Topic:</strong> {currentQuestion.question_topic}
                    </div>
                  )}
                  {currentQuestion.spec_topic && (
                    <div style={{
                      fontSize: '13px',
                      color: COLORS.gray
                    }}>
                      <strong>Specification:</strong> {currentQuestion.spec_topic}
                      {currentQuestion.spec_point && ` (${currentQuestion.spec_point})`}
                    </div>
                  )}
                </div>
              )}

              {/* Image Display for Maths Quiz - Enhanced */}
              {(() => {
                const mathsImageUrl = getMathsImageUrl(currentQuestion);
                
                if (mathsImageUrl) {
                  return (
                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                      <img
                        src={getImageUrl(mathsImageUrl)}
                        alt={`Question ${currentQuestionIndex + 1}`}
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        onLoad={() => console.log('Image loaded successfully:', getImageUrl(mathsImageUrl))}
                        onError={(e) => {
                          console.error('Image failed to load:', getImageUrl(mathsImageUrl));
                          console.error('All question fields:', currentQuestion);
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          const errorMsg = document.createElement('div');
                          errorMsg.className = 'image-error';
                          errorMsg.innerHTML = `
                            <p style="color: ${COLORS.error}; margin: 0 0 8px 0;">Question image could not be loaded.</p>
                            <p style="color: ${COLORS.gray}; margin: 0; font-size: 12px;">URL: ${getImageUrl(mathsImageUrl)}</p>
                          `;
                          errorMsg.style.padding = '40px 20px';
                          errorMsg.style.backgroundColor = '#fef2f2';
                          errorMsg.style.borderRadius = '12px';
                          errorMsg.style.border = '1px solid #fecaca';
                          errorMsg.style.fontSize = '14px';
                          errorMsg.style.textAlign = 'center';
                          e.target.parentNode.appendChild(errorMsg);
                        }}
                      />
                    </div>
                  );
                } else {
                  return (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      borderRadius: '12px',
                      border: '1px solid #fecaca',
                      padding: '40px 20px',
                      marginBottom: '24px',
                      textAlign: 'center'
                    }}>
                      <p style={{
                        color: COLORS.error,
                        fontSize: '14px',
                        margin: '0 0 8px 0'
                      }}>
                        No question image available
                      </p>
                      <p style={{
                        color: COLORS.gray,
                        fontSize: '12px',
                        margin: '0'
                      }}>
                        Available fields: {Object.keys(currentQuestion).join(', ')}
                      </p>
                    </div>
                  );
                }
              })()}

              {/* Answer Input for Maths - Enhanced */}
              <div>
                <label style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  Your Answer:
                </label>
                <textarea
                  value={userAnswers[currentQuestion.objectID] || ''}
                  onChange={(e) => {
                    console.log('Answer changed for question:', currentQuestion.objectID, 'Value:', e.target.value);
                    handleAnswerSelect(e.target.value);
                  }}
                  disabled={reviewMode}
                  placeholder="Enter your answer here... Show your working and final answer clearly."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: `2px solid ${userAnswers[currentQuestion.objectID] ? COLORS.teal : '#e2e8f0'}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '150px',
                    backgroundColor: reviewMode ? '#f8fafc' : COLORS.white,
                    color: '#374151',
                    lineHeight: '1.5',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    if (!reviewMode) {
                      e.target.style.borderColor = COLORS.teal;
                      e.target.style.outline = 'none';
                    }
                  }}
                  onBlur={(e) => {
                    if (!reviewMode) {
                      e.target.style.borderColor = userAnswers[currentQuestion.objectID] ? COLORS.teal : '#e2e8f0';
                    }
                  }}
                />
                
                {/* Character count for user feedback */}
                {!reviewMode && (
                  <div style={{
                    fontSize: '12px',
                    color: COLORS.gray,
                    marginTop: '8px',
                    textAlign: 'right'
                  }}>
                    {(userAnswers[currentQuestion.objectID] || '').length} characters
                  </div>
                )}
              </div>

              {/* Show model answer in review mode */}
              {reviewMode && currentQuestion.correct_answer && (
                <div style={{
                  backgroundColor: COLORS.success + '10',
                  border: `2px solid ${COLORS.success}40`,
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '24px'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: COLORS.success,
                    margin: '0 0 12px 0'
                  }}>
                    Model Answer:
                  </h4>
                  <div style={{
                    fontSize: '15px',
                    color: '#374151',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {currentQuestion.correct_answer}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Korean-English Question Content */}
          {packData.subject === 'korean-english' && (
            <div>
              {/* Korean Text Display */}
              {(() => {
                let koreanText = currentQuestion?.questionText || currentQuestion?.korean || '';
                // Handle object format
                if (typeof koreanText === 'object' && koreanText !== null) {
                  koreanText = koreanText.sentence || koreanText.text || koreanText.value || '';
                }
                return koreanText ? (
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'left'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: COLORS.gray,
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Korean Text:
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#374151',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    lineHeight: '1.4'
                  }}>
                    {koreanText}
                  </div>
                </div>
              ) : null;
              })()}

              {/* Question/Instruction Display */}
              {(() => {
                let englishText = currentQuestion?.actualQuestion || currentQuestion?.english || currentQuestion?.question || '';
                // Handle object format
                if (typeof englishText === 'object' && englishText !== null) {
                  englishText = englishText.sentence || englishText.text || englishText.value || '';
                }
                return englishText ? (
                <div style={{
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 12px 0'
                  }}>
                    Question
                  </h3>
                  <div style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#374151',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {englishText}
                  </div>
                </div>
              ) : null;
              })()}

              {/* Multiple Choice Options */}
              {(currentQuestion.answerOptions || currentQuestion.options) && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 16px 0'
                  }}>
                    Choose the best answer:
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(currentQuestion.answerOptions || currentQuestion.options).map((option, index) => {
                      const optionId = index; // For Korean-English, we use index as the answer
                      const isSelected = userAnswers[currentQuestion.objectID] === optionId;
                      const isCorrect = optionId === currentQuestion.correctAnswer;
                      const showCorrect = reviewMode && isCorrect;
                      const showIncorrect = reviewMode && isSelected && !isCorrect;

                      let backgroundColor = COLORS.white;
                      let borderColor = '#e2e8f0';
                      let textColor = '#374151';

                      if (showCorrect) {
                        backgroundColor = COLORS.success + '20';
                        borderColor = COLORS.success;
                      } else if (showIncorrect) {
                        backgroundColor = COLORS.error + '20';
                        borderColor = COLORS.error;
                      } else if (isSelected) {
                        backgroundColor = COLORS.teal + '20';
                        borderColor = COLORS.teal;
                        textColor = COLORS.teal;
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(optionId)}
                          disabled={reviewMode}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px 20px',
                            backgroundColor,
                            border: `2px solid ${borderColor}`,
                            borderRadius: '12px',
                            fontSize: '15px',
                            color: textColor,
                            cursor: reviewMode ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => {
                            if (!reviewMode && !isSelected) {
                              e.target.style.borderColor = COLORS.teal;
                              e.target.style.backgroundColor = COLORS.teal + '10';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!reviewMode && !isSelected) {
                              e.target.style.borderColor = '#e2e8f0';
                              e.target.style.backgroundColor = COLORS.white;
                            }
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? (showCorrect ? COLORS.success : showIncorrect ? COLORS.error : COLORS.teal) : '#f3f4f6',
                            color: isSelected ? 'white' : COLORS.gray,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '600',
                            flexShrink: 0
                          }}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span style={{ flex: 1 }}>
                            {typeof option === 'string' ? option : 
                             typeof option === 'object' ? (option?.text || option?.option || `Option ${index + 1}`) : 
                             String(option) || `Option ${index + 1}`}
                          </span>
                          {showCorrect && (
                            <div style={{ color: COLORS.success, fontSize: '18px' }}>✓</div>
                          )}
                          {showIncorrect && (
                            <div style={{ color: COLORS.error, fontSize: '18px' }}>✗</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div style={{
          padding: '16px 40px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            style={{
              backgroundColor: currentQuestionIndex === 0 ? '#f8fafc' : COLORS.white,
              color: currentQuestionIndex === 0 ? COLORS.gray : COLORS.darkGray,
              border: '2px solid #e2e8f0',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {!reviewMode && (
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '20px',
                fontSize: '14px',
                color: COLORS.gray
              }}>
                {Object.keys(userAnswers).length} of {questions.length} answered
              </div>
            )}
            {reviewMode && (
              <div style={{
                padding: '8px 16px',
                backgroundColor: COLORS.teal + '20',
                borderRadius: '20px',
                fontSize: '14px',
                color: COLORS.teal,
                fontWeight: '500'
              }}>
                📖 Review Mode
              </div>
            )}
          </div>

          {currentQuestionIndex === questions.length - 1 && !reviewMode ? (
            <button 
              onClick={submitQuiz}
              disabled={!isQuizComplete || isSubmitting}
              style={{
                backgroundColor: (!isQuizComplete || isSubmitting) ? '#f8fafc' : COLORS.success,
                color: (!isQuizComplete || isSubmitting) ? COLORS.gray : 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (!isQuizComplete || isSubmitting) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e2e8f0',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </button>
          ) : (
            <button 
              onClick={nextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              style={{
                backgroundColor: currentQuestionIndex === questions.length - 1 ? '#f8fafc' : COLORS.teal,
                color: currentQuestionIndex === questions.length - 1 ? COLORS.gray : 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: currentQuestionIndex === questions.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InteractiveQuiz;