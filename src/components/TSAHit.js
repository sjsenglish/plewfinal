// Modern TSAHit.js - Unrestricted video access
import React, { useState } from 'react';
import './Hit.css';
import VideoPopup from './VideoPopup';
import { convertFirebaseStorageUrl } from '../utils/urlUtils';

const TSAHit = ({ hit, isBookmarked, toggleBookmark, isLoggedIn }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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
  const imageUrl = rawImageUrl && rawImageUrl !== 'default_image.jpg' ? convertFirebaseStorageUrl(rawImageUrl) : null;
  
  // Handle video - try multiple possible field names
  const videoUrl = hit.solution_video || hit.videoSolutionLink || hit.video_solution_link || '';


  // Convert Firebase Storage URLs to direct URLs if needed
  const getImageUrl = (url) => {
    return url ? convertFirebaseStorageUrl(url) : '';
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

  // Handle video button click - unrestricted access
  const handleVideoClick = (e) => {
    e.preventDefault();
    setShowVideo(true);
  };

  const closeVideo = () => {
    setShowVideo(false);
  };

  // Check if an option is the correct one by comparing its ID with correctAnswer
  const isCorrectOption = (option) => {
    return option && option.id === correctAnswer;
  };

  // Find the correct option object
  const getCorrectOption = () => {
    return options.find((option) => option.id === correctAnswer);
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
              className="tsa-hit-button video-button"
              onClick={handleVideoClick}
              aria-label="Watch video solution"
              data-action="video-solution"
            >
              <span>Watch Video Solution</span>
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
    </div>
  );
};

export default TSAHit;