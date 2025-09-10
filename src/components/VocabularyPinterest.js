import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { fetchVocabulary, getEnhancedWordInfo } from '../services/vocabularyAPIService';
import VocabularyQuiz from './VocabularyQuiz';
import './VocabularyPinterest.css';

const VocabularyPinterest = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedWords, setSavedWords] = useState(new Set());
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizWords, setQuizWords] = useState([]);
  const [hoveredWord, setHoveredWord] = useState(null);
  const [expandedWords, setExpandedWords] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    frequency: 'all'
  });

  const auth = getAuth();
  const user = auth.currentUser;
  const masonryRef = useRef(null);

  // Subject areas for browsing
  const subjectAreas = [
    { id: 'all', name: 'All Subjects', icon: '🌟' },
    { id: 'literature', name: 'Literature', icon: '📚' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'philosophy', name: 'Philosophy', icon: '🤔' },
    { id: 'history', name: 'History', icon: '🏛️' },
    { id: 'social', name: 'Social Studies', icon: '🌍' },
    { id: 'arts', name: 'Arts', icon: '🎨' },
    { id: 'economics', name: 'Economics', icon: '💼' },
    { id: 'psychology', name: 'Psychology', icon: '🧠' }
  ];

  // Difficulty levels
  const difficultyLevels = [
    { id: 'all', name: 'All Levels', color: '#64748b' },
    { id: 'beginner', name: 'Beginner', color: '#22c55e' },
    { id: 'intermediate', name: 'Intermediate', color: '#f59e0b' },
    { id: 'advanced', name: 'Advanced', color: '#ef4444' },
    { id: 'expert', name: 'Expert', color: '#8b5cf6' }
  ];

  // Load vocabulary words
  const loadWords = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const options = {
        limit: 20,
        offset: reset ? 0 : words.length,
        subjectArea: selectedSubject,
        search: searchQuery || null,
        difficulty: filters.difficulty !== 'all' ? filters.difficulty : null,
        minFrequency: filters.frequency !== 'all' ? parseInt(filters.frequency) : 1
      };

      const result = await fetchVocabulary(options);
      
      if (result.success) {
        const newWords = result.words.map(word => ({
          ...word,
          id: word.word || word.id,
          height: Math.floor(Math.random() * 200) + 300 // Random height for masonry
        }));

        if (reset) {
          setWords(newWords);
        } else {
          setWords(prev => [...prev, ...newWords]);
        }
      }
    } catch (error) {
      console.error('Error loading words:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, searchQuery, filters, words.length]);

  // Load saved words for current user
  const loadSavedWords = useCallback(async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'savedVocabulary'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const saved = new Set();
      querySnapshot.forEach((doc) => {
        saved.add(doc.data().word);
      });
      setSavedWords(saved);
    } catch (error) {
      console.error('Error loading saved words:', error);
    }
  }, [user]);

  // Save/unsave word
  const toggleSaveWord = async (word) => {
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }

    try {
      const docRef = doc(db, 'savedVocabulary', `${user.uid}_${word.word}`);
      
      if (savedWords.has(word.word)) {
        await deleteDoc(docRef);
        setSavedWords(prev => {
          const newSet = new Set(prev);
          newSet.delete(word.word);
          return newSet;
        });
      } else {
        await setDoc(docRef, {
          userId: user.uid,
          word: word.word,
          definition: word.definition,
          difficulty: word.difficulty,
          subjectArea: word.subjectArea,
          savedAt: new Date()
        });
        setSavedWords(prev => new Set([...prev, word.word]));
      }
    } catch (error) {
      console.error('Error saving word:', error);
    }
  };

  // Start quiz for subject area
  const startSubjectQuiz = () => {
    if (words.length === 0) return;
    
    // Get 10 random words from current subject
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const quizWords = shuffled.slice(0, 10);
    setQuizWords(quizWords);
    setShowQuiz(true);
  };

  // Start quiz for single word
  const startWordQuiz = (word) => {
    setQuizWords([word]);
    setShowQuiz(true);
  };

  // Generate random words for subject
  const generateRandomWords = async () => {
    if (selectedSubject === 'all') return;
    
    const options = {
      limit: 10,
      offset: Math.floor(Math.random() * 100),
      subjectArea: selectedSubject,
      sortBy: 'random'
    };

    try {
      const result = await fetchVocabulary(options);
      if (result.success) {
        const newWords = result.words.map(word => ({
          ...word,
          id: word.word || word.id,
          height: Math.floor(Math.random() * 200) + 300
        }));
        setWords(newWords);
      }
    } catch (error) {
      console.error('Error generating random words:', error);
    }
  };

  // Handle word expansion
  const toggleWordExpansion = async (word) => {
    const wordId = word.word;
    
    if (expandedWords.has(wordId)) {
      setExpandedWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordId);
        return newSet;
      });
    } else {
      // Load enhanced word info
      try {
        const enhancedInfo = await getEnhancedWordInfo(word.word);
        // Update word with enhanced info
        setWords(prev => prev.map(w => 
          w.word === wordId ? { ...w, ...enhancedInfo, enhanced: true } : w
        ));
        setExpandedWords(prev => new Set([...prev, wordId]));
      } catch (error) {
        console.error('Error loading enhanced word info:', error);
      }
    }
  };

  useEffect(() => {
    loadWords(true);
  }, [selectedSubject, searchQuery, filters]);

  useEffect(() => {
    loadSavedWords();
  }, [loadSavedWords]);

  // Masonry layout helper
  const getMasonryColumns = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  const [columns, setColumns] = useState(getMasonryColumns());

  useEffect(() => {
    const handleResize = () => {
      setColumns(getMasonryColumns());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="vocabulary-pinterest">
      {/* Header */}
      <div className="pinterest-header">
        <div className="header-content">
          <h1 className="main-title">
            <span className="title-icon">📚</span>
            Vocabulary Discovery
          </h1>
          <p className="subtitle">Discover and master CSAT vocabulary through engaging exploration</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Subject Area Tabs */}
        <div className="subject-tabs">
          {subjectAreas.map(subject => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`subject-tab ${selectedSubject === subject.id ? 'active' : ''}`}
            >
              <span className="subject-icon">{subject.icon}</span>
              <span className="subject-name">{subject.name}</span>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          {selectedSubject !== 'all' && (
            <button onClick={generateRandomWords} className="action-btn generate-btn">
              🎲 Generate 10 Random Words
            </button>
          )}
          {words.length > 0 && (
            <button onClick={startSubjectQuiz} className="action-btn quiz-btn">
              🧠 Quiz This Subject
            </button>
          )}
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="masonry-container" ref={masonryRef}>
        <div 
          className="masonry-grid"
          style={{ '--columns': columns }}
        >
          {words.map((word, index) => (
            <VocabularyCard
              key={`${word.word}-${index}`}
              word={word}
              isExpanded={expandedWords.has(word.word)}
              isSaved={savedWords.has(word.word)}
              onToggleExpansion={() => toggleWordExpansion(word)}
              onToggleSave={() => toggleSaveWord(word)}
              onStartQuiz={() => startWordQuiz(word)}
              onHover={setHoveredWord}
            />
          ))}
        </div>

        {/* Load More */}
        {!loading && words.length > 0 && (
          <div className="load-more-container">
            <button onClick={() => loadWords(false)} className="load-more-btn">
              Load More Words
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Discovering vocabulary...</p>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuiz && (
        <VocabularyQuiz
          words={quizWords}
          onClose={() => setShowQuiz(false)}
          onComplete={(results) => {
            console.log('Quiz completed:', results);
            setShowQuiz(false);
          }}
        />
      )}
    </div>
  );
};

// Individual Vocabulary Card Component
const VocabularyCard = ({ 
  word, 
  isExpanded, 
  isSaved, 
  onToggleExpansion, 
  onToggleSave, 
  onStartQuiz,
  onHover 
}) => {
  const [showSynonyms, setShowSynonyms] = useState(false);

  const getDifficultyColor = (difficulty) => {
    const level = typeof difficulty === 'number' ? difficulty : 3;
    if (level <= 2) return '#22c55e';
    if (level <= 4) return '#f59e0b';
    if (level <= 6) return '#ef4444';
    return '#8b5cf6';
  };

  const getDifficultyLabel = (difficulty) => {
    const level = typeof difficulty === 'number' ? difficulty : 3;
    if (level <= 2) return 'Beginner';
    if (level <= 4) return 'Intermediate';
    if (level <= 6) return 'Advanced';
    return 'Expert';
  };

  return (
    <div 
      className={`vocabulary-card ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => onHover(word)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Card Header */}
      <div className="card-header">
        <div className="word-title">
          <h3 className="word-text">{word.word}</h3>
          {word.pronunciation && (
            <span className="pronunciation">/{word.pronunciation}/</span>
          )}
        </div>
        <button
          onClick={onToggleSave}
          className={`save-btn ${isSaved ? 'saved' : ''}`}
          title={isSaved ? 'Remove from saved' : 'Save word'}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Difficulty Badge */}
      <div 
        className="difficulty-badge"
        style={{ backgroundColor: getDifficultyColor(word.difficulty) }}
      >
        {getDifficultyLabel(word.difficulty)}
      </div>

      {/* Subject Area Tags */}
      {word.subjectArea && (
        <div className="subject-tags">
          <span className="subject-tag">{word.subjectArea}</span>
        </div>
      )}

      {/* Definition */}
      <div className="definition-section">
        <p className="definition-en">{word.definition}</p>
        {word.koreanTranslation && (
          <p className="definition-ko">{word.koreanTranslation}</p>
        )}
      </div>

      {/* Synonyms Preview on Hover */}
      {word.synonyms && word.synonyms.length > 0 && (
        <div 
          className="synonyms-preview"
          onMouseEnter={() => setShowSynonyms(true)}
          onMouseLeave={() => setShowSynonyms(false)}
        >
          <span className="synonyms-label">Synonyms:</span>
          <div className="synonyms-list">
            {word.synonyms.slice(0, 3).map((synonym, index) => (
              <span key={index} className="synonym-tag">{synonym}</span>
            ))}
            {word.synonyms.length > 3 && <span className="synonym-more">+{word.synonyms.length - 3}</span>}
          </div>
        </div>
      )}

      {/* Example Sentences */}
      {word.examples && word.examples.length > 0 && (
        <div className="examples-section">
          <h4 className="examples-title">CSAT Example:</h4>
          <p className="example-sentence">{word.examples[0]}</p>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && word.enhanced && (
        <div className="expanded-content">
          {word.etymology && (
            <div className="etymology-section">
              <h4>Etymology:</h4>
              <p>{word.etymology}</p>
            </div>
          )}
          
          {word.collocations && word.collocations.length > 0 && (
            <div className="collocations-section">
              <h4>Common Collocations:</h4>
              <div className="collocations-list">
                {word.collocations.map((collocation, index) => (
                  <span key={index} className="collocation-tag">{collocation}</span>
                ))}
              </div>
            </div>
          )}

          {word.antonyms && word.antonyms.length > 0 && (
            <div className="antonyms-section">
              <h4>Antonyms:</h4>
              <div className="antonyms-list">
                {word.antonyms.map((antonym, index) => (
                  <span key={index} className="antonym-tag">{antonym}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card Actions */}
      <div className="card-actions">
        <button 
          onClick={onToggleExpansion}
          className="action-btn expand-btn"
        >
          {isExpanded ? '📖 Show Less' : '📖 Show More'}
        </button>
        <button 
          onClick={onStartQuiz}
          className="action-btn quiz-btn"
        >
          🧠 Quiz This Word
        </button>
      </div>
    </div>
  );
};

export default VocabularyPinterest;