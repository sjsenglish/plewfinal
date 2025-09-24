import React, { useState } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import './CSATQuestionCard.css';

const CSATQuestionCard = ({ hit }) => {
  const { checkUsage, isPaidUser, isGuest } = usePaywall();
  const [showAnswer, setShowAnswer] = useState(false);

  // Early return if hit is undefined or null
  if (!hit) {
    return null;
  }

  // Extract data from CSAT hit structure
  const questionNumber = hit.questionNumber || '';
  const year = hit.year || '';
  const englishPassage = hit.questionText || '';
  const koreanQuestion = hit.actualQuestion || '';
  const answerOptions = hit.answerOptions || [];
  const correctAnswer = hit.correctAnswer || '';
  const source = hit.source || '';
  const passageType = hit.passageType || '';

  // Format question header
  const questionHeader = questionNumber && year ? `Question ${questionNumber} (${year})` : 'CSAT Question';

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

  // Toggle answer visibility with paywall check
  const toggleAnswer = async () => {
    const usageCheck = await checkUsage('question_interaction');
    if (!usageCheck.allowed) {
      return;
    }
    setShowAnswer(!showAnswer);
  };

  return (
    <div className="csat-question-card">
      {/* Header Section */}
      <div className="csat-header">
        <div className="csat-header-left">
          <h2 className="csat-question-title">{questionHeader}</h2>
        </div>
        <div className="csat-tags">
          {source && (
            <span className="csat-source-tag">
              {getSourceKorean(source)}
            </span>
          )}
          {passageType && (
            <span className="csat-passage-tag">
              {getPassageTypeKorean(passageType)}
            </span>
          )}
        </div>
      </div>

      {/* English Passage Section */}
      {englishPassage && (
        <div className="csat-english-section">
          <h3 className="csat-section-title">English Passage</h3>
          <div className="csat-passage-content">
            <p className="csat-english-text">{englishPassage}</p>
          </div>
        </div>
      )}

      {/* Korean Question Section */}
      {koreanQuestion && (
        <div className="csat-korean-section">
          <h3 className="csat-section-title">Question</h3>
          <div className="csat-question-content">
            <p className="csat-korean-text">{koreanQuestion}</p>
          </div>
        </div>
      )}

      {/* Answer Options Section */}
      {answerOptions && answerOptions.length > 0 && (
        <div className="csat-options-section">
          <h3 className="csat-section-title">Answer Options</h3>
          <div className="csat-options-list">
            {answerOptions.map((option, index) => (
              <div key={index} className="csat-option-item">
                <span className="csat-option-text">{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Section */}
      {correctAnswer && (
        <div className="csat-answer-section">
          <button 
            className={`csat-answer-button ${!isPaidUser ? 'csat-locked' : ''}`}
            onClick={toggleAnswer}
          >
            <span className="csat-button-icon">
              {!isPaidUser ? '🔒' : (showAnswer ? '👁️' : '👁️‍🗨️')}
            </span>
            <span className="csat-button-text">
              {!isPaidUser ? 
                (isGuest ? 'Login to View Answer' : 'Subscribe to View Answer') : 
                (showAnswer ? 'Hide Answer' : 'Show Answer')
              }
            </span>
          </button>
          
          {showAnswer && (
            <div className="csat-answer-content">
              <div className="csat-correct-answer">
                <strong>Correct Answer:</strong> {correctAnswer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CSATQuestionCard;