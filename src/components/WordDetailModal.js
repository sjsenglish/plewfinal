import React, { useState, useEffect } from 'react';
import './WordDetailModal.css';

const WordDetailModal = ({ word, isOpen, onClose, onStartTest }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllSynonyms, setShowAllSynonyms] = useState(false);
  const [showAllExamples, setShowAllExamples] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userNotes, setUserNotes] = useState('');

  // Reset state when modal opens/closes or word changes
  useEffect(() => {
    if (isOpen && word) {
      setActiveTab('overview');
      setShowAllSynonyms(false);
      setShowAllExamples(false);
      setIsBookmarked(word.userProgress?.isBookmarked || false);
      setUserNotes(word.userProgress?.notes || '');
    }
  }, [isOpen, word]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !word) return null;

  const {
    word: wordText = '',
    definition = '',
    partOfSpeech = '',
    difficulty = 1,
    frequency = '',
    synonyms = [],
    antonyms = [],
    examples = [],
    pronunciation = '',
    audioUrl = '',
    koreanTranslation = '',
    etymology = '',
    collocations = [],
    subjectArea = '',
    sourceExams = [],
    userProgress = {}
  } = word;

  // Play audio function
  const playAudio = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.error('Audio playback failed:', err));
    }
  };

  // Get difficulty class
  const getDifficultyClass = (diff) => {
    if (diff <= 2) return 'difficulty-beginner';
    if (diff === 3) return 'difficulty-intermediate';
    return 'difficulty-advanced';
  };

  // Tab content components
  const OverviewTab = () => (
    <div className="tab-content">
      {/* Word header */}
      <div className="modal-word-header">
        <div className="word-main-info">
          <h2 className="modal-word-title">{wordText}</h2>
          {pronunciation && (
            <div className="modal-pronunciation">
              <span className="pronunciation-text">/{pronunciation}/</span>
              {audioUrl && (
                <button 
                  className="modal-audio-button"
                  onClick={() => playAudio(audioUrl)}
                  title="Play pronunciation"
                >
                  🔊
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-badges">
          <span className={`modal-difficulty-badge ${getDifficultyClass(difficulty)}`}>
            Level {difficulty}
          </span>
          <span className="modal-pos-badge">{partOfSpeech}</span>
          {frequency && <span className="modal-frequency-badge">{frequency}</span>}
        </div>
      </div>

      {/* Definition */}
      <div className="modal-definition-section">
        <h4>Definition</h4>
        <p className="modal-definition-text">{definition}</p>
        {koreanTranslation && (
          <p className="modal-korean-translation">Korean: {koreanTranslation}</p>
        )}
      </div>

      {/* Quick synonyms preview */}
      {synonyms.length > 0 && (
        <div className="modal-quick-synonyms">
          <h4>Key Synonyms</h4>
          <div className="quick-synonyms-list">
            {synonyms.slice(0, 6).map((synonym, index) => (
              <span key={index} className="quick-synonym-item">{synonym}</span>
            ))}
            {synonyms.length > 6 && (
              <button 
                className="view-all-synonyms"
                onClick={() => setActiveTab('synonyms')}
              >
                +{synonyms.length - 6} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick examples */}
      {examples.length > 0 && (
        <div className="modal-quick-examples">
          <h4>Example Usage</h4>
          <div className="quick-example">
            <p className="example-sentence">{examples[0].sentence || examples[0]}</p>
            {examples[0].translation && (
              <p className="example-translation">{examples[0].translation}</p>
            )}
          </div>
          {examples.length > 1 && (
            <button 
              className="view-all-examples"
              onClick={() => setActiveTab('examples')}
            >
              View all {examples.length} examples
            </button>
          )}
        </div>
      )}
    </div>
  );

  const SynonymsTab = () => (
    <div className="tab-content">
      <h3>Synonyms for "{wordText}"</h3>
      <div className="synonyms-grid">
        {synonyms.map((synonym, index) => (
          <div key={index} className="synonym-card">
            <span className="synonym-word">{synonym}</span>
            <button className="synonym-test-btn" title="Test this synonym">
              ✏️
            </button>
          </div>
        ))}
      </div>
      
      {antonyms.length > 0 && (
        <div className="antonyms-section">
          <h4>Antonyms</h4>
          <div className="antonyms-list">
            {antonyms.map((antonym, index) => (
              <span key={index} className="antonym-item">{antonym}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ExamplesTab = () => (
    <div className="tab-content">
      <h3>Example Sentences</h3>
      <div className="examples-detailed-list">
        {examples.map((example, index) => (
          <div key={index} className="detailed-example-item">
            <div className="example-number">#{index + 1}</div>
            <div className="example-content">
              <p className="detailed-example-text">{example.sentence || example}</p>
              {example.translation && (
                <p className="detailed-example-translation">{example.translation}</p>
              )}
              {example.context && (
                <p className="example-context">Context: {example.context}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const StudyTab = () => (
    <div className="tab-content">
      <h3>Study Tools</h3>
      
      {/* Progress tracking */}
      <div className="study-progress">
        <h4>Your Progress</h4>
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-label">Confidence</span>
            <div className="stat-bar">
              <div 
                className="stat-fill" 
                style={{ width: `${(userProgress.confidence || 0) * 100}%` }}
              ></div>
            </div>
            <span className="stat-value">{Math.round((userProgress.confidence || 0) * 100)}%</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Reviews</span>
            <span className="stat-value">{userProgress.reviewCount || 0}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Last Studied</span>
            <span className="stat-value">
              {userProgress.lastReviewed 
                ? new Date(userProgress.lastReviewed).toLocaleDateString()
                : 'Never'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Study actions */}
      <div className="study-actions">
        <button 
          className="study-action-button primary"
          onClick={() => onStartTest && onStartTest(word, 'synonym-match')}
        >
          <span className="action-icon">🎯</span>
          <div className="action-content">
            <div className="action-title">Synonym Matching</div>
            <div className="action-description">Match the word with correct synonyms</div>
          </div>
        </button>
        
        <button 
          className="study-action-button"
          onClick={() => onStartTest && onStartTest(word, 'fill-blank')}
        >
          <span className="action-icon">📝</span>
          <div className="action-content">
            <div className="action-title">Fill in the Blank</div>
            <div className="action-description">Complete sentences using this word</div>
          </div>
        </button>
        
        <button 
          className="study-action-button"
          onClick={() => onStartTest && onStartTest(word, 'definition-match')}
        >
          <span className="action-icon">📖</span>
          <div className="action-content">
            <div className="action-title">Definition Matching</div>
            <div className="action-description">Match word with correct definition</div>
          </div>
        </button>
      </div>

      {/* Personal notes */}
      <div className="personal-notes">
        <h4>Personal Notes</h4>
        <textarea
          className="notes-textarea"
          placeholder="Add your own notes, mnemonics, or examples..."
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          rows={4}
        />
        <button className="save-notes-btn">Save Notes</button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'synonyms', label: 'Synonyms', icon: '📝', count: synonyms.length },
    { id: 'examples', label: 'Examples', icon: '💡', count: examples.length },
    { id: 'study', label: 'Study', icon: '📚' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="word-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <h1 className="modal-title">Word Details</h1>
            <div className="modal-metadata">
              {subjectArea && <span className="subject-badge">{subjectArea}</span>}
              {sourceExams.map((exam, index) => (
                <span key={index} className="exam-badge">{exam}</span>
              ))}
            </div>
          </div>
          
          <div className="modal-header-actions">
            <button 
              className={`bookmark-button ${isBookmarked ? 'active' : ''}`}
              onClick={() => setIsBookmarked(!isBookmarked)}
              title={isBookmarked ? 'Remove from saved words' : 'Save word'}
            >
              {isBookmarked ? '★' : '☆'}
            </button>
            
            <button className="close-button" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="modal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.count && <span className="tab-count">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="modal-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'synonyms' && <SynonymsTab />}
          {activeTab === 'examples' && <ExamplesTab />}
          {activeTab === 'study' && <StudyTab />}
        </div>

        {/* Footer actions */}
        <div className="modal-footer">
          <button 
            className="footer-button secondary"
            onClick={onClose}
          >
            Close
          </button>
          
          <button 
            className="footer-button primary"
            onClick={() => onStartTest && onStartTest(word, 'quick-test')}
          >
            <span className="button-icon">🚀</span>
            Start Quick Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordDetailModal;