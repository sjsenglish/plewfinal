import React, { useState, useCallback, useEffect } from 'react';
import { getEnhancedWordInfo } from '../services/vocabularyAPIService';
import { generateSynonymQuiz } from '../services/vocabularyService';
import './VocabularyHit.css';

const VocabularyHit = ({ hit }) => {
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [wordInfo, setWordInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Early return if hit is undefined or null - BEFORE hooks
  if (!hit) {
    return null;
  }

  console.log('Vocabulary hit object:', hit);

  // Extract word and basic info
  const word = hit.word || hit.title || hit.name || 'Unknown Word';
  const contexts = hit.contexts || [];
  const frequency = hit.frequency || 1;
  
  // Get word info with fallbacks
  const definition = wordInfo?.definition || `Click "Show Synonyms" or "Show Examples" to load detailed information about "${word}".`;
  const partOfSpeech = wordInfo?.partOfSpeech || '';
  const difficulty = wordInfo?.difficulty || 3;
  const synonyms = wordInfo?.synonyms || [];
  const antonyms = wordInfo?.antonyms || [];
  const examples = wordInfo?.examples || [];
  const koreanTranslation = wordInfo?.koreanTranslation || '';
  const collocations = wordInfo?.collocations || [];
  const etymology = wordInfo?.etymology || '';
  const pronunciation = wordInfo?.pronunciation || '';
  const audioUrl = wordInfo?.audioUrl || '';
  const subjectArea = wordInfo?.subjectArea || '';

  // Load word info function
  const loadWordInfo = useCallback(async () => {
    if (wordInfo || loading) return; // Don't reload if already loaded or loading

    setLoading(true);
    try {
      const context = contexts.length > 0 ? contexts[0] : '';
      console.log('Loading word info for:', word, 'with context:', context);
      
      const enhancedInfo = await getEnhancedWordInfo(word, context);
      console.log('Received word info for:', word, enhancedInfo);
      setWordInfo(enhancedInfo);
    } catch (error) {
      console.error('Error loading word info for', word, ':', error);
      // Set basic fallback info
      setWordInfo({
        word: word,
        definition: `Information about "${word}" - Enhanced details require API access.`,
        partOfSpeech: 'unknown',
        difficulty: 3,
        synonyms: ['similar', 'related'],
        examples: [{ sentence: `Example with the word "${word}".`, translation: "예문입니다." }]
      });
    } finally {
      setLoading(false);
    }
  }, [word, wordInfo, loading, contexts]);

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

  // Play audio function
  const playAudio = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.error('Audio playbook failed:', err));
    }
  };

  // Quiz functions
  const startQuiz = async () => {
    if (!wordInfo && !loading) {
      await loadWordInfo();
    }
    
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

  return (
    <div className="word-card">
      {/* Card Header */}
      <header className="word-header">
        <div className="word-title-group">
          <h3 className="word-title">{word}</h3>
          {partOfSpeech && <span className="word-pos">{partOfSpeech}</span>}
        </div>
        
        <div className="word-meta">
          <span className={`difficulty-badge ${getDifficultyClass(difficulty)}`}>
            Level {difficulty}
          </span>
          <button 
            className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={toggleBookmark}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
        </div>
      </header>

      {/* Pronunciation */}
      {pronunciation && (
        <div className="word-pronunciation">
          <button 
            className="pronunciation-btn"
            onClick={togglePronunciation}
          >
            🔊 {showPronunciation ? pronunciation : 'Show pronunciation'}
          </button>
          {audioUrl && (
            <button 
              className="audio-btn"
              onClick={() => playAudio(audioUrl)}
              title="Play audio"
            >
              ♪
            </button>
          )}
        </div>
      )}

      {/* Definition */}
      <div className="word-definition">
        <p>{definition}</p>
        {koreanTranslation && (
          <p className="korean-translation">{koreanTranslation}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="word-actions">
        <button 
          className={`action-btn ${showSynonyms ? 'active' : ''}`}
          onClick={toggleSynonyms}
          disabled={loading}
        >
          {loading ? '⏳' : '📝'} Synonyms {synonyms.length > 0 ? `(${synonyms.length})` : ''}
        </button>
        
        <button 
          className={`action-btn ${showExamples ? 'active' : ''}`}
          onClick={toggleExamples}
          disabled={loading}
        >
          {loading ? '⏳' : '💡'} Examples {examples.length > 0 ? `(${examples.length})` : ''}
        </button>
        
        <button 
          className="action-btn quiz-btn"
          onClick={startQuiz}
          disabled={loading}
        >
          🧠 Quiz
        </button>
      </div>

      {/* Expandable Content */}
      {showSynonyms && synonyms.length > 0 && (
        <div className="word-synonyms">
          <h4>Synonyms</h4>
          <div className="synonym-tags">
            {synonyms.map((synonym, index) => (
              <span key={index} className="synonym-tag">{synonym}</span>
            ))}
          </div>
        </div>
      )}

      {showExamples && examples.length > 0 && (
        <div className="word-examples">
          <h4>Examples</h4>
          <div className="example-list">
            {examples.map((example, index) => (
              <div key={index} className="example-item">
                <p className="example-text">"{example.sentence || example}"</p>
                {example.translation && (
                  <p className="example-translation">{example.translation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {(antonyms.length > 0 || collocations.length > 0) && (
        <div className="word-additional">
          {antonyms.length > 0 && (
            <div className="word-antonyms">
              <h5>Antonyms</h5>
              <div className="antonym-tags">
                {antonyms.map((antonym, index) => (
                  <span key={index} className="antonym-tag">{antonym}</span>
                ))}
              </div>
            </div>
          )}
          
          {collocations.length > 0 && (
            <div className="word-collocations">
              <h5>Common Usage</h5>
              <div className="collocation-tags">
                {collocations.slice(0, 4).map((collocation, index) => (
                  <span key={index} className="collocation-tag">{collocation}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && quiz && (
        <div className="quiz-modal">
          <div className="quiz-content">
            <div className="quiz-header">
              <h3>Synonym Quiz: {word}</h3>
              <button className="close-quiz" onClick={closeQuiz}>×</button>
            </div>
            
            <div className="quiz-question">
              <p>Which word is a synonym for "<strong>{word}</strong>"?</p>
            </div>
            
            <div className="quiz-options">
              {quiz.options?.map((option, index) => (
                <button
                  key={index}
                  className={`quiz-option ${quizAnswer === option ? 'selected' : ''} ${
                    showQuizResult ? (option === quiz.correct ? 'correct' : quizAnswer === option ? 'incorrect' : '') : ''
                  }`}
                  onClick={() => selectQuizAnswer(option)}
                  disabled={showQuizResult}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {showQuizResult && (
              <div className="quiz-result">
                <p className={quizAnswer === quiz.correct ? 'correct' : 'incorrect'}>
                  {quizAnswer === quiz.correct ? '✅ Correct!' : '❌ Incorrect'}
                </p>
                <p>The correct answer is: <strong>{quiz.correct}</strong></p>
                {quiz.explanation && <p className="quiz-explanation">{quiz.explanation}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyHit;