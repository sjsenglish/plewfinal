import React, { useState, useCallback, useEffect } from 'react';
import { safeString } from '../utils/safeRender';
// import { getEnhancedWordInfo } from '../services/vocabularyAPIService';
import './VocabularyHit.css';

const VocabularyHit = ({ hit = {} }) => {
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [wordInfo, setWordInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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
      
      // const enhancedInfo = await getEnhancedWordInfo(word, context);
      const enhancedInfo = { word, definition: 'Enhanced word info temporarily disabled' };
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


  // Get difficulty badge class
  const getDifficultyClass = (diff) => {
    if (diff <= 2) return 'difficulty-beginner';
    if (diff === 3) return 'difficulty-intermediate';
    return 'difficulty-advanced';
  };

  // Don't render anything if no valid hit data
  if (!hit || Object.keys(hit).length === 0) {
    return null;
  }

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
                <p className="example-text">"{safeString(example.sentence || example)}"</p>
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

    </div>
  );
};

export default VocabularyHit;