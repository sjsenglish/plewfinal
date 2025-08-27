import React, { useState, useCallback } from 'react';
import { getEnhancedWordInfo } from '../services/vocabularyAPIService';
import { generateSynonymQuiz } from '../services/vocabularyService';
import './VocabularyHit.css';

const VocabularyHit = ({ hit }) => {
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [wordInfo, setWordInfo] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // Extract word data - hit is now a word extracted from questions
  const word = hit?.word || '';
  const frequency = hit?.frequency || 0;
  const contexts = hit?.contexts || [];

  // Enhanced word info from OpenAI with better defaults
  const definition = wordInfo?.definition || `Basic vocabulary word extracted from Korean-English questions. Click "Show Synonyms" or "Show Examples" to load detailed information.`;
  const partOfSpeech = wordInfo?.partOfSpeech || '';
  const difficulty = wordInfo?.difficulty || 3;
  const subjectArea = wordInfo?.subjectArea || '';
  const synonyms = wordInfo?.synonyms || [];
  const antonyms = wordInfo?.antonyms || [];
  const examples = wordInfo?.examples || [];
  const pronunciation = wordInfo?.pronunciation || '';
  const audioUrl = wordInfo?.audioUrl || '';
  const koreanTranslation = wordInfo?.koreanTranslation || '';
  const etymology = wordInfo?.etymology || '';
  const collocations = wordInfo?.collocations || [];
  const sourceExams = wordInfo?.sourceExams || [];

  // User progress data - mock for now
  const isLearned = false;
  const confidence = 0;
  const reviewCount = 0;

  // Load enhanced word information only when user interacts (lazy loading)
  const loadWordInfo = useCallback(async () => {
    if (word && !wordInfo && !loading) {
      setLoading(true);
      try {
        console.log('Loading word info for:', word);
        const context = contexts[0] || '';
        const enhancedInfo = await getEnhancedWordInfo(word, context);
        console.log('Received word info for:', word, enhancedInfo);
        setWordInfo(enhancedInfo);
      } catch (error) {
        console.error('Error loading word info for', word, ':', error);
        // Set basic fallback info
        setWordInfo({
          word: word,
          partOfSpeech: 'unknown',
          definition: 'Click to load definition...',
          difficulty: 3,
          synonyms: ['Click to load...'],
          antonyms: [],
          examples: [{ sentence: 'Click to load examples...', translation: '예시를 로드하려면 클릭하세요...' }],
          koreanTranslation: '번역을 로드하려면 클릭하세요',
          frequency: 'common',
          subjectArea: 'general',
          collocations: [],
          etymology: ''
        });
      } finally {
        setLoading(false);
      }
    }
  }, [word, wordInfo, loading, contexts]);

  // Early return if hit is undefined or null - AFTER hooks
  if (!hit) {
    return null;
  }

  console.log('Vocabulary hit object:', hit);

  // Play audio function
  const playAudio = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.error('Audio playback failed:', err));
    }
  };

  // Toggle functions with lazy loading
  const toggleSynonyms = () => {
    if (!wordInfo && !loading) {
      loadWordInfo();
    }
    setShowSynonyms(!showSynonyms);
  };
  
  const toggleExamples = () => {
    if (!wordInfo && !loading) {
      loadWordInfo();
    }
    setShowExamples(!showExamples);
  };
  
  const togglePronunciation = () => setShowPronunciation(!showPronunciation);
  const toggleBookmark = () => setIsBookmarked(!isBookmarked);

  // Quiz functions
  const startQuiz = async () => {
    // Load word info first if not available
    if (!wordInfo && !loading) {
      await loadWordInfo();
    }
    
    // Wait a moment if still loading
    if (!wordInfo) {
      setTimeout(() => startQuiz(), 1000);
      return;
    }
    
    setLoading(true);
    try {
      const quizData = await generateSynonymQuiz(word, wordInfo);
      setQuiz(quizData);
      setShowQuiz(true);
      setQuizAnswer(null);
      setShowQuizResult(false);
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectQuizAnswer = (selectedOption) => {
    setQuizAnswer(selectedOption);
    setShowQuizResult(true);
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setQuiz(null);
    setQuizAnswer(null);
    setShowQuizResult(false);
  };

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

      {/* Action buttons - always show */}
      <div className="action-buttons-section">
        <button 
          className="toggle-button synonyms-toggle"
          onClick={toggleSynonyms}
          disabled={loading}
        >
          {loading ? '⏳ Loading...' : showSynonyms ? '🔽 Hide Synonyms' : '📝 Show Synonyms'} {synonyms.length > 0 ? `(${synonyms.length})` : ''}
        </button>
        
        <button 
          className="toggle-button examples-toggle"
          onClick={toggleExamples}
          disabled={loading}
        >
          {loading ? '⏳ Loading...' : showExamples ? '🔽 Hide Examples' : '💡 Show Examples'} {examples.length > 0 ? `(${examples.length})` : ''}
        </button>
        
        <button 
          className="toggle-button quiz-toggle"
          onClick={startQuiz}
          disabled={loading}
        >
          🧠 Start Quiz
        </button>
      </div>

      {/* Synonyms section */}
      {synonyms.length > 0 && showSynonyms && (
        <div className="synonyms-section">
          <div className="synonyms-content">
            <div className="synonyms-list">
              {synonyms.map((synonym, index) => (
                <span key={index} className="synonym-item">
                  {synonym}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Examples section - now only shows content when data is loaded */}
      {examples.length > 0 && showExamples && (
        <div className="examples-section">
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

      {/* Quiz Interface */}
      {showQuiz && quiz && (
        <div className="quiz-overlay">
          <div className="quiz-modal">
            <div className="quiz-header">
              <h3>Synonym Quiz</h3>
              <button className="close-quiz" onClick={closeQuiz}>✕</button>
            </div>
            
            <div className="quiz-question">
              <p>{quiz.question}</p>
            </div>
            
            <div className="quiz-options">
              {quiz.options.map((option, index) => (
                <button
                  key={index}
                  className={`quiz-option ${quizAnswer === option ? 
                    (option === quiz.correctAnswer ? 'correct' : 'incorrect') : ''}`}
                  onClick={() => selectQuizAnswer(option)}
                  disabled={showQuizResult}
                >
                  {option}
                  {showQuizResult && quizAnswer === option && (
                    <span className="option-result">
                      {option === quiz.correctAnswer ? '✓' : '✗'}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {showQuizResult && (
              <div className="quiz-result">
                <div className={`result-message ${quizAnswer === quiz.correctAnswer ? 'correct' : 'incorrect'}`}>
                  {quizAnswer === quiz.correctAnswer ? '🎉 Correct!' : '❌ Incorrect'}
                </div>
                <p className="quiz-explanation">{quiz.explanation}</p>
                <button className="try-again-btn" onClick={closeQuiz}>
                  Try Another Word
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context and Frequency Info */}
      <div className="word-stats">
        <div className="frequency-info">
          <span className="stat-label">Appears in:</span>
          <span className="stat-value">{frequency} question{frequency !== 1 ? 's' : ''}</span>
        </div>
        {contexts.length > 0 && (
          <div className="context-preview">
            <span className="stat-label">Context:</span>
            <span className="context-text">"{contexts[0].substring(0, 100)}..."</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="word-actions">
        <button 
          className="action-button study-button"
          onClick={startQuiz}
          disabled={loading || !wordInfo}
        >
          <span className="button-icon">🎯</span>
          <span className="button-text">{loading ? 'Loading...' : 'Quiz Me'}</span>
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