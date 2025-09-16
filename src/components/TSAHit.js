// Modern TSAHit.js - Enhanced with video usage limits
import React, { useState, useEffect, useCallback } from 'react';
import './Hit.css';
import VideoPopup from './VideoPopup';
import VideoLimitModal from './VideoLimitModal';
import { checkVideoAccess, incrementVideoUsage } from '../services/videoUsageService';
import { getAuth } from 'firebase/auth';
import { usePaywall } from '../hooks/usePaywall';
import { convertFirebaseStorageUrl } from '../utils/urlUtils';

const TSAHit = ({ hit, isBookmarked, toggleBookmark, isLoggedIn }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showVideoLimitModal, setShowVideoLimitModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [videoUsage, setVideoUsage] = useState(null);
  const [checkingVideoAccess, setCheckingVideoAccess] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  
  // Get paywall info to check if user is paid
  const { isPaidUser } = usePaywall();

  // Extract data from the hit
  const questionNumber = hit.question_number || hit.id || '';
  const questionContent = hit.question_content || '';
  const question = hit.question || '';

  // Handle options - array of objects with id and text properties
  const options = Array.isArray(hit.options) ? hit.options : [];

  // Get correct answer - stored as a string ID (e.g., "C")
  const correctAnswer = hit.correct_answer || '';

  // Handle other properties
  const questionType = hit.question_type || '';
  const subTypes = Array.isArray(hit.sub_types) ? hit.sub_types : [];
  const year = hit.year || '';
  
  // Handle image - try multiple possible field names and convert Firebase Storage URLs
  const rawImageUrl = hit.image_url || hit.imageFile || hit.image_file || '';
  const imageUrl = convertFirebaseStorageUrl(rawImageUrl);
  
  // Handle video - try multiple possible field names
  const videoUrl = hit.solution_video || hit.videoSolutionLink || hit.video_solution_link || '';

  // Load video usage on component mount
  useEffect(() => {
    if (user && videoUrl) {
      loadVideoUsage();
    }
  }, [user?.uid, videoUrl, isPaidUser]); // Use user.uid instead of user object

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

  // Convert Firebase Storage URLs to direct URLs if needed
  const getImageUrl = (url) => {
    return convertFirebaseStorageUrl(url);
  };

  const processedImageUrl = getImageUrl(imageUrl);

  // Toggle answer visibility with animation
  const toggleAnswer = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setShowAnswer(!showAnswer);
      setIsAnimating(false);
    }, 150);
  };

  // Handle video button click
  const handleVideoClick = async (e) => {
    e.preventDefault();
    
    if (!user) {
      // Redirect to login if not logged in
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
        setShowVideo(true);
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

  const closeVideo = () => {
    setShowVideo(false);
  };

  const closeLimitModal = () => {
    setShowVideoLimitModal(false);
  };

  // Check if an option is the correct one by comparing its ID with correctAnswer
  const isCorrectOption = (option) => {
    return option && option.id === correctAnswer;
  };

  // Find the correct option object
  const getCorrectOption = () => {
    return options.find((option) => option.id === correctAnswer);
  };

  // Get video button display text
  const getVideoButtonText = () => {
    if (checkingVideoAccess) return 'Checking...';
    if (!user) return 'Log in to Watch';
    if (isPaidUser) return 'Video Solution';
    if (videoUsage && videoUsage.remaining === 0) return 'Daily Limit Reached';
    if (videoUsage) return `Video Solution (${videoUsage.remaining} left today)`;
    return 'Video Solution';
  };

  // Get video button disabled state
  const isVideoButtonDisabled = () => {
    if (checkingVideoAccess) return true;
    if (!user) return false; // Will redirect to login
    if (isPaidUser) return false; // Unlimited access
    return videoUsage && videoUsage.remaining === 0;
  };

  return (
    <div className="tsa-hit">
      <div className="tsa-hit-header">
        <div className="title-section">
          <h3 className="tsa-hit-title">Question {questionNumber}</h3>
          {year && <span className="question-year">{year}</span>}
        </div>

        <div className="tsa-hit-tags">
          {questionType && <span className="tsa-hit-type">{questionType}</span>}
          {subTypes && subTypes.length > 0 && (
            <span className="tsa-hit-subtype">{subTypes[0]}</span>
          )}
          {subTypes && subTypes.length > 1 && (
            <span className="tsa-hit-subtype">{subTypes[1]}</span>
          )}
        </div>
      </div>

      <div className="tsa-hit-content">

        {/* Passage/Context */}
        {questionContent && (
          <div className="tsa-hit-passage">
            <p>{questionContent}</p>
          </div>
        )}

        {/* Image (if available) */}
        {processedImageUrl && (
          <div className="tsa-hit-image">
            <img
              src={processedImageUrl}
              alt={`Question ${questionNumber}`}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const errorMsg = document.createElement('div');
                errorMsg.className = 'image-error';
                errorMsg.textContent = 'Image temporarily unavailable';
                errorMsg.style.color = 'red';
                errorMsg.style.padding = '10px';
                e.target.parentNode.appendChild(errorMsg);
              }}
            />
          </div>
        )}

        {/* Question text */}
        {question && (
          <div className="tsa-hit-question">
            <p>{question}</p>
          </div>
        )}

        {/* Options list */}
        {options && options.length > 0 && (
          <div className="tsa-hit-options">
            <ul>
              {options.map((option, index) => (
                <li
                  key={option.id || index}
                  className={`option-item ${showAnswer && isCorrectOption(option) ? 'correct-option' : ''}`}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <span className="option-id">{option.id}</span>
                  <span className="option-text">{option.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="tsa-hit-actions">
          {videoUrl && videoUrl !== '' && (
            <button 
              className={`tsa-hit-button video-button ${isVideoButtonDisabled() ? 'disabled' : ''}`}
              onClick={handleVideoClick}
              disabled={isVideoButtonDisabled()}
              aria-label="Watch video solution"
            >
              <span>{getVideoButtonText()}</span>
            </button>
          )}

          <button 
            className={`tsa-hit-button answer-button ${isAnimating ? 'animating' : ''}`}
            onClick={toggleAnswer}
            aria-label={showAnswer ? 'Hide correct answer' : 'Show correct answer'}
          >
            <span>{showAnswer ? 'Hide Answer' : 'Show Answer'}</span>
          </button>
        </div>

        {/* Answer reveal section */}
        {showAnswer && correctAnswer && (
          <div className={`tsa-hit-answer ${showAnswer ? 'answer-visible' : ''}`}>
            <h4>Correct Answer</h4>
            <div className="answer-content">
              <span className="answer-id">{correctAnswer}</span>
              <span className="answer-text">
                {getCorrectOption() ? getCorrectOption().text : 'Answer text not available'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Video popup */}
      {showVideo && <VideoPopup videoUrl={videoUrl} onClose={closeVideo} />}
      
      {/* Video limit modal */}
      <VideoLimitModal 
        isOpen={showVideoLimitModal}
        onClose={closeLimitModal}
        usageInfo={videoUsage}
      />
    </div>
  );
};

export default TSAHit;