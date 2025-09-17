// Modern PlewHit.js - Enhanced with better UI and interactions
import React, { useState } from 'react';
import './PlewHit.css';
import VideoPopup from './VideoPopup';
import { convertFirebaseStorageUrl } from '../utils/urlUtils';

const PlewHit = ({ hit, isBookmarked, toggleBookmark, isLoggedIn }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Extract data from the hit safely
  const questionNumber =
    typeof hit.questionNumber === 'object'
      ? JSON.stringify(hit.questionNumber)
      : hit.questionNumber || '';

  const questionText =
    typeof hit.questionText === 'object'
      ? JSON.stringify(hit.questionText)
      : hit.questionText || '';

  const actualQuestion =
    typeof hit.actualQuestion === 'object'
      ? JSON.stringify(hit.actualQuestion)
      : hit.actualQuestion || '';

  // Handle arrays safely
  const answerOptions = Array.isArray(hit.answerOptions)
    ? hit.answerOptions.map((option) =>
        typeof option === 'object' ? JSON.stringify(option) : option
      )
    : [];

  const correctAnswer =
    typeof hit.correctAnswer === 'object'
      ? JSON.stringify(hit.correctAnswer)
      : hit.correctAnswer || '';

  const imageFile =
    typeof hit.imageFile === 'object' ? JSON.stringify(hit.imageFile) : hit.imageFile || '';

  const videoSolutionLink =
    typeof hit.videoSolutionLink === 'object'
      ? JSON.stringify(hit.videoSolutionLink)
      : hit.videoSolutionLink || '';

  const questionType =
    typeof hit.questionType === 'object'
      ? JSON.stringify(hit.questionType)
      : hit.questionType || '';

  const theoryArea =
    typeof hit.theoryArea === 'object' ? JSON.stringify(hit.theoryArea) : hit.theoryArea || '';

  // Toggle answer visibility with animation
  const toggleAnswer = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setShowAnswer(!showAnswer);
      setIsAnimating(false);
    }, 150);
  };

  // Toggle video popup
  const openVideo = (e) => {
    e.preventDefault();
    setShowVideo(true);
  };

  const closeVideo = () => {
    setShowVideo(false);
  };

  // Generate image URL or use placeholder - convert Firebase Storage URLs
  const imageUrl = imageFile && imageFile !== 'default_image.jpg' ? convertFirebaseStorageUrl(imageFile) : null;
  
  // Hide question text if there's an actual image (not default or empty)
  const hasActualImage = imageFile && imageFile !== '' && imageFile !== 'default_image.jpg';
  const shouldShowQuestionText = !hasActualImage && questionText;

  return (
    <div className="plew-hit">
      <div className="plew-hit-header">
        <div className="title-section">
          <h3 className="plew-hit-title">Question {questionNumber}</h3>
          <span className="subject-badge">수능영어</span>
        </div>

        <div className="plew-hit-tags">
          {theoryArea && <span className="plew-hit-theory">{theoryArea}</span>}
          {questionType && <span className="plew-hit-type">{questionType}</span>}
        </div>
      </div>

      <div className="plew-hit-content">
        {/* Question text - only show if no actual image */}
        {shouldShowQuestionText && (
          <div className="plew-hit-passage">
            <p>{questionText}</p>
          </div>
        )}

        {/* Actual question */}
        {actualQuestion && (
          <div className="plew-hit-actual-question">
            <p>{actualQuestion}</p>
          </div>
        )}

        {/* Image (if available) */}
        {imageUrl && (
          <div className="plew-hit-image">
            <img
              src={imageUrl}
              alt={`Question ${questionNumber}`}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const errorMsg = document.createElement('div');
                errorMsg.className = 'image-error';
                errorMsg.textContent = 'Image temporarily unavailable';
                e.target.parentNode.appendChild(errorMsg);
              }}
            />
          </div>
        )}

        {/* Options list */}
        {answerOptions && answerOptions.length > 0 && (
          <div className="plew-hit-options">
            <ul>
              {answerOptions.map((option, index) => (
                <li
                  key={index}
                  className={`option-item ${showAnswer && option === correctAnswer ? 'correct-option' : ''}`}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <span className="option-number">{index + 1}</span>
                  <span className="option-text">{option}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="plew-hit-actions">
          {videoSolutionLink && videoSolutionLink !== '' && (
            <button 
              className="plew-hit-button video-button" 
              onClick={openVideo}
              aria-label="Watch video solution"
            >
              <span>Video Solution</span>
            </button>
          )}

          <button 
            className={`plew-hit-button answer-button ${isAnimating ? 'animating' : ''}`}
            onClick={toggleAnswer}
            aria-label={showAnswer ? 'Hide correct answer' : 'Show correct answer'}
          >
            <span>{showAnswer ? 'Hide Answer' : 'Show Answer'}</span>
          </button>
        </div>

        {/* Answer reveal section */}
        {showAnswer && correctAnswer && (
          <div className={`plew-hit-answer ${showAnswer ? 'answer-visible' : ''}`}>
            <h4>Correct Answer</h4>
            <div className="answer-content">
              <span className="answer-highlight">{correctAnswer}</span>
            </div>
          </div>
        )}
      </div>

      {/* Video popup */}
      {showVideo && <VideoPopup videoUrl={videoSolutionLink} onClose={closeVideo} />}
    </div>
  );
};

export default PlewHit;