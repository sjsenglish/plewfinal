import React, { useState } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { checkVideoAccess, incrementVideoUsage, incrementGuestVideoUsage } from '../services/videoUsageService';
import VideoLimitModal from './VideoLimitModal';
import { getAuth } from 'firebase/auth';
import './KoreanEnglishHit.css';

const KoreanEnglishHit = ({ hit }) => {
  const { checkUsage, isPaidUser, isGuest } = usePaywall();
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUsageInfo, setVideoUsageInfo] = useState(null);
  
  const auth = getAuth();
  const user = auth.currentUser;

  // Early return if hit is undefined or null
  if (!hit) {
    return null;
  }

  console.log('Korean-English hit object:', hit);

  // Extract data from your Korean-English hit structure
  const questionNumber = hit.questionNumber || '';
  const year = hit.year || '';
  const questionId = questionNumber && year ? `${questionNumber} (${year})` : (hit.objectID || hit.id || '');
  const koreanText = hit.questionText || hit.korean_text || hit.korean || '';
  const englishText = hit.actualQuestion || hit.english_text || hit.english || '';
  const questionText = hit.question || '';
  const answer = hit.correctAnswer || hit.answer || '';
  const answerOptions = hit.answerOptions || hit.options || [];
  const explanation = hit.explanation || '';
  const level = hit.level || '';
  const category = hit.category || '';
  const topic = hit.topic || '';
  const difficulty = hit.difficulty || '';
  const type = hit.type || hit.question_type || '';
  const tags = hit.tags || [];
  const hints = hit.hints || [];
  const examples = hit.examples || [];
  
  // Extract source and passage type for Korean tags
  const source = hit.source || '';
  const passageType = hit.passageType || '';
  
  // Map source to Korean labels
  const getSourceKorean = (source) => {
    switch(source) {
      case 'past-paper': return '기출';
      case 'original': return '유사';
      case 'baby': return '베이비';
      default: return source;
    }
  };
  
  // Map passage type to Korean labels
  const getPassageTypeKorean = (passageType) => {
    switch(passageType) {
      case 'argumentative': return '논쟁';
      case 'discursive': return '담화';
      case 'analytical': return '분석';
      case 'comprehension': return '문해';
      default: return passageType;
    }
  };
  
  // Handle pronunciation/romanization if available
  const romanization = hit.romanization || hit.pronunciation || '';
  
  // Handle audio URLs if available
  const koreanAudioUrl = hit.korean_audio_url || '';
  const englishAudioUrl = hit.english_audio_url || '';
  
  // Handle video solution URL
  const videoSolutionLink = hit.videoSolutionLink || hit.video_solution_link || '';

  // Toggle functions with paywall check
  const toggleAnswer = async () => {
    const usageCheck = await checkUsage('question_interaction');
    if (!usageCheck.allowed) {
      // Do nothing - make buttons unclickable
      return;
    }
    setShowAnswer(!showAnswer);
  };
  
  const toggleExplanation = async () => {
    const usageCheck = await checkUsage('question_interaction');
    if (!usageCheck.allowed) {
      // Do nothing - make buttons unclickable
      return;
    }
    setShowExplanation(!showExplanation);
  };

  // Play audio function
  const playAudio = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.error('Audio playback failed:', err));
    }
  };

  // Handle video solution watching
  const watchVideoSolution = async () => {
    if (!videoSolutionLink) return;
    
    try {
      // Check if user can watch videos
      const accessResult = await checkVideoAccess(user?.uid, isPaidUser);
      
      if (!accessResult.success) {
        console.error('Error checking video access:', accessResult.error);
        return;
      }
      
      if (!accessResult.canWatch) {
        // Show limit modal
        setVideoUsageInfo(accessResult.usage);
        setShowVideoModal(true);
        return;
      }
      
      // User can watch - increment usage counter
      if (isPaidUser) {
        // Paid users - increment Firebase counter if logged in
        if (user?.uid) {
          await incrementVideoUsage(user.uid);
        }
      } else {
        // Free/guest users - increment localStorage counter
        if (user?.uid) {
          await incrementVideoUsage(user.uid);
        } else {
          incrementGuestVideoUsage();
        }
      }
      
      // Open video in new tab/window
      window.open(videoSolutionLink, '_blank');
    } catch (error) {
      console.error('Error handling video solution:', error);
    }
  };

  return (
    <div className="korean-english-hit-container">
      {/* Header with metadata */}
      <div className="korean-english-hit-header">
        <div className="question-header-left">
          <h3 className="question-id">Question {questionId}</h3>
          {level && <span className="level-badge">{level}</span>}
          {difficulty && <span className="difficulty-badge difficulty-{difficulty}">{difficulty}</span>}
        </div>
        
        <div className="question-metadata">
          {source && (
            <span className="source-badge">
              {getSourceKorean(source)}
            </span>
          )}
          {passageType && (
            <span className="passage-type-badge">
              {getPassageTypeKorean(passageType)}
            </span>
          )}
        </div>
      </div>

      {/* Main Question Content */}
      <div className="question-content-area">
        {/* Korean Text Section */}
        {koreanText && (
          <div className="korean-section">
            <div className="section-header">
              <h4 className="section-title">English Passage</h4>
              {koreanAudioUrl && (
                <button 
                  className="audio-button"
                  onClick={() => playAudio(koreanAudioUrl)}
                  title="Play Korean audio"
                >
                  🔊
                </button>
              )}
            </div>
            <div className="korean-text-display">
              <p className="main-text">{koreanText}</p>
              {romanization && (
                <p className="romanization-text">[{romanization}]</p>
              )}
            </div>
          </div>
        )}

        {/* English Text Section */}
        {englishText && (
          <div className="english-section">
            <div className="section-header">
              <h4 className="section-title">Korean Question</h4>
              {englishAudioUrl && (
                <button 
                  className="audio-button"
                  onClick={() => playAudio(englishAudioUrl)}
                  title="Play English audio"
                >
                  🔊
                </button>
              )}
            </div>
            <div className="english-text-display">
              <p className="main-text">{englishText}</p>
            </div>
          </div>
        )}

        {/* Question Section if separate from Korean/English */}
        {questionText && (
          <div className="question-section">
            <h4 className="section-title">Question</h4>
            <p className="question-text">{questionText}</p>
          </div>
        )}

        {/* Answer Options Section */}
        {answerOptions && answerOptions.length > 0 && (
          <div className="answer-options-section">
            <h4 className="section-title">Answer Options</h4>
            <div className="options-list">
              {answerOptions.map((option, index) => (
                <div key={index} className="option-item">
                  <p className="option-text">{option}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hints Section */}
        {hints.length > 0 && (
          <div className="hints-section">
            <h4 className="section-title">💡 Hints</h4>
            <ul className="hints-list">
              {hints.map((hint, index) => (
                <li key={index} className="hint-item">{hint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Examples Section */}
        {examples.length > 0 && (
          <div className="examples-section">
            <h4 className="section-title">📝 Examples</h4>
            <div className="examples-list">
              {examples.map((example, index) => (
                <div key={index} className="example-item">
                  {example.korean && <p className="example-korean">{String(example.korean)}</p>}
                  {example.english && <p className="example-english">{String(example.english)}</p>}
                  {typeof example === 'string' && <p>{String(example)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Answer Section */}
      {answer && (
        <div className="answer-section">
          <button 
            className={`toggle-button answer-toggle ${!isPaidUser ? 'locked' : ''}`}
            onClick={toggleAnswer}
          >
            {!isPaidUser ? '🔒 ' : ''}{showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
          
          {showAnswer && (
            <div className="answer-content">
              <p className="answer-text">{answer}</p>
            </div>
          )}
        </div>
      )}

      {/* Explanation Section */}
      {explanation && (
        <div className="explanation-section">
          <button 
            className={`toggle-button explanation-toggle ${!isPaidUser ? 'locked' : ''}`}
            onClick={toggleExplanation}
          >
            {!isPaidUser ? '🔒 ' : ''}{showExplanation ? 'Hide Explanation' : 'Show Explanation'}
          </button>
          
          {showExplanation && (
            <div className="explanation-content">
              <p className="explanation-text">{explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Video Solution Section */}
      {videoSolutionLink && (
        <div className="video-solution-section">
          <button 
            className={`toggle-button video-solution-toggle ${!isPaidUser && isGuest ? 'limited' : (!isPaidUser ? 'locked' : '')}`}
            onClick={watchVideoSolution}
          >
            {!isPaidUser && isGuest ? '📺 Watch Video Solution (Limited)' : 
             !isPaidUser ? '🔒 Video Solution (Subscription Required)' : 
             '📺 Watch Video Solution'}
          </button>
        </div>
      )}

      {/* Tags Section */}
      {tags.length > 0 && (
        <div className="tags-section">
          <div className="tags-list">
            {tags.map((tag, index) => (
              <span key={index} className="tag-item">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="question-actions">
        <button className="action-button practice-button">
          <span className="button-icon">✏️</span>
          <span className="button-text">Practice</span>
        </button>
        
        <button className="action-button bookmark-button">
          <span className="button-icon">🔖</span>
          <span className="button-text">Bookmark</span>
        </button>
        
        <button className="action-button report-button">
          <span className="button-icon">🚩</span>
          <span className="button-text">Report</span>
        </button>
      </div>

      {/* Video Limit Modal */}
      <VideoLimitModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        usageInfo={videoUsageInfo}
      />
    </div>
  );
};

export default KoreanEnglishHit;