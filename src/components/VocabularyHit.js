import React, { useState } from 'react';
import './VocabularyHit.css';

const VocabularyHit = ({ hit }) => {
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);

  // Early return if hit is undefined or null
  if (!hit) {
    return null;
  }

  console.log('Vocabulary hit object:', hit);

  // Extract data from vocabulary hit structure
  const word = hit.word || '';
  const definition = hit.definition || '';
  const partOfSpeech = hit.partOfSpeech || '';
  const difficulty = hit.difficulty || 1;
  const frequency = hit.frequency || '';
  const subjectArea = hit.subjectArea || '';
  const sourceExams = hit.sourceExams || [];
  const synonyms = hit.synonyms || [];
  const antonyms = hit.antonyms || [];
  const examples = hit.examples || [];
  const pronunciation = hit.pronunciation || '';
  const audioUrl = hit.audioUrl || '';
  const koreanTranslation = hit.koreanTranslation || '';
  const etymology = hit.etymology || '';
  const collocations = hit.collocations || [];
  const userProgress = hit.userProgress || {};
  const isLearned = userProgress.isLearned || false;
  const confidence = userProgress.confidence || 0;
  const reviewCount = userProgress.reviewCount || 0;

  // Play audio function
  const playAudio = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.error('Audio playback failed:', err));
    }
  };

  // Toggle functions
  const toggleSynonyms = () => setShowSynonyms(!showSynonyms);
  const toggleExamples = () => setShowExamples(!showExamples);
  const togglePronunciation = () => setShowPronunciation(!showPronunciation);
  const toggleBookmark = () => setIsBookmarked(!isBookmarked);

  // Get difficulty badge class
  const getDifficultyClass = (diff) => {
    if (diff <= 2) return 'difficulty-beginner';
    if (diff === 3) return 'difficulty-intermediate';
    return 'difficulty-advanced';
  };

  // Get confidence bar width
  const getConfidenceWidth = (conf) => `${Math.min(conf * 100, 100)}%`;

  return (
    <div className="vocabulary-hit-container">
      {/* Header with word and metadata */}
      <div className="vocabulary-hit-header">
        <div className="word-header-left">
          <div className="word-main">
            <h3 className="word-title">{word}</h3>
            {pronunciation && (
              <div className="pronunciation-section">
                <button 
                  className="pronunciation-toggle"
                  onClick={togglePronunciation}
                  title="Show pronunciation"
                >
                  🔊
                </button>
                {showPronunciation && (
                  <span className="pronunciation-text">/{pronunciation}/</span>
                )}
                {audioUrl && (
                  <button 
                    className="audio-button"
                    onClick={() => playAudio(audioUrl)}
                    title="Play audio"
                  >
                    ♪
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="word-badges">
            <span className={`difficulty-badge ${getDifficultyClass(difficulty)}`}>
              Level {difficulty}
            </span>
            {partOfSpeech && (
              <span className="pos-badge">{partOfSpeech}</span>
            )}
            {frequency && (
              <span className="frequency-badge">{frequency}</span>
            )}
          </div>
        </div>
        
        <div className="word-actions-mini">
          <button 
            className={`bookmark-mini ${isBookmarked ? 'active' : ''}`}
            onClick={toggleBookmark}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
          
          {isLearned && (
            <span className="learned-indicator" title="Word learned">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      {confidence > 0 && (
        <div className="progress-indicator">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: getConfidenceWidth(confidence) }}
            ></div>
          </div>
          <span className="progress-text">
            {Math.round(confidence * 100)}% confidence • {reviewCount} reviews
          </span>
        </div>
      )}

      {/* Definition section */}
      <div className="definition-section">
        <div className="definition-content">
          <p className="definition-text">{definition}</p>
          {koreanTranslation && (
            <p className="korean-translation">Korean: {koreanTranslation}</p>
          )}
        </div>
      </div>

      {/* Synonyms section */}
      {synonyms.length > 0 && (
        <div className="synonyms-section">
          <button 
            className="toggle-button synonyms-toggle"
            onClick={toggleSynonyms}
          >
            {showSynonyms ? '🔽 Hide Synonyms' : '📝 Show Synonyms'} ({synonyms.length})
          </button>
          
          {showSynonyms && (
            <div className="synonyms-content">
              <div className="synonyms-list">
                {synonyms.map((synonym, index) => (
                  <span key={index} className="synonym-item">
                    {synonym}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Examples section */}
      {examples.length > 0 && (
        <div className="examples-section">
          <button 
            className="toggle-button examples-toggle"
            onClick={toggleExamples}
          >
            {showExamples ? '🔽 Hide Examples' : '💡 Show Examples'} ({examples.length})
          </button>
          
          {showExamples && (
            <div className="examples-content">
              <div className="examples-list">
                {examples.map((example, index) => (
                  <div key={index} className="example-item">
                    <p className="example-text">{example.sentence || example}</p>
                    {example.translation && (
                      <p className="example-translation">{example.translation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collocations section */}
      {collocations.length > 0 && (
        <div className="collocations-section">
          <h5 className="section-title">Common Collocations</h5>
          <div className="collocations-list">
            {collocations.slice(0, 5).map((collocation, index) => (
              <span key={index} className="collocation-item">
                {collocation}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Antonyms section */}
      {antonyms.length > 0 && (
        <div className="antonyms-section">
          <h5 className="section-title">Antonyms</h5>
          <div className="antonyms-list">
            {antonyms.map((antonym, index) => (
              <span key={index} className="antonym-item">
                {antonym}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Etymology section */}
      {etymology && (
        <div className="etymology-section">
          <h5 className="section-title">Etymology</h5>
          <p className="etymology-text">{etymology}</p>
        </div>
      )}

      {/* Metadata tags */}
      <div className="metadata-section">
        <div className="metadata-tags">
          {subjectArea && (
            <span className="metadata-tag subject-tag">
              {subjectArea}
            </span>
          )}
          
          {sourceExams.map((exam, index) => (
            <span key={index} className="metadata-tag exam-tag">
              {exam}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="word-actions">
        <button className="action-button study-button">
          <span className="button-icon">📖</span>
          <span className="button-text">Study</span>
        </button>
        
        <button className="action-button test-button">
          <span className="button-icon">✏️</span>
          <span className="button-text">Test Me</span>
        </button>
        
        <button className={`action-button bookmark-button ${isBookmarked ? 'active' : ''}`}>
          <span className="button-icon">{isBookmarked ? '★' : '☆'}</span>
          <span className="button-text">{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>
        
        <button className="action-button report-button">
          <span className="button-icon">🚩</span>
          <span className="button-text">Report</span>
        </button>
      </div>
    </div>
  );
};

export default VocabularyHit;