import React, { useState } from 'react';
import './KoreanEnglishHit.css';

const KoreanEnglishHit = ({ hit }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Early return if hit is undefined or null
  if (!hit) {
    return null;
  }

  console.log('Korean-English hit object:', hit);

  // Extract data from your Korean-English hit structure
  // PLACEHOLDER FIELDS - Update these based on your actual data structure
  const questionId = hit.objectID || hit.id || '';
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
  
  // Handle pronunciation/romanization if available
  const romanization = hit.romanization || hit.pronunciation || '';
  
  // Handle audio URLs if available
  const koreanAudioUrl = hit.korean_audio_url || '';
  const englishAudioUrl = hit.english_audio_url || '';

  // Toggle functions
  const toggleAnswer = () => setShowAnswer(!showAnswer);
  const toggleExplanation = () => setShowExplanation(!showExplanation);

  // Play audio function
  const playAudio = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.error('Audio playback failed:', err));
    }
  };

  return (
    <div className="korean-english-hit-container">
      {/* Header with metadata */}
      <div className="korean-english-hit-header">
        <div className="question-header-left">
          <h3 className="question-id">Question #{questionId}</h3>
          {level && <span className="level-badge">{level}</span>}
          {difficulty && <span className="difficulty-badge difficulty-{difficulty}">{difficulty}</span>}
        </div>
        
        <div className="question-metadata">
          {category && (
            <span className="category-badge">
              {category}
            </span>
          )}
          {type && (
            <span className="type-badge">
              {type}
            </span>
          )}
          {topic && (
            <span className="topic-badge">
              {topic}
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
              <h4 className="section-title">Korean</h4>
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
              <h4 className="section-title">English</h4>
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
            className="toggle-button answer-toggle"
            onClick={toggleAnswer}
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
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
            className="toggle-button explanation-toggle"
            onClick={toggleExplanation}
          >
            {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
          </button>
          
          {showExplanation && (
            <div className="explanation-content">
              <p className="explanation-text">{explanation}</p>
            </div>
          )}
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
    </div>
  );
};

export default KoreanEnglishHit;