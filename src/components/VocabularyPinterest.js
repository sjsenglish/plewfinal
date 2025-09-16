import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import VocabularyQuiz from './VocabularyQuiz';
import './VocabularyPinterest.css';

// Error Boundary Component
class VocabularyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Vocabulary Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', border: '1px solid #f56565', borderRadius: '8px', backgroundColor: '#fed7d7' }}>
          <h3>🚨 Error Loading Vocabulary</h3>
          <p>Something went wrong while displaying the vocabulary cards.</p>
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '0.5rem' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', backgroundColor: '#4299e1', color: 'white' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}


const VocabularyPinterest = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedWords, setSavedWords] = useState(new Set());
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizWords, setQuizWords] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters] = useState({
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


  // Load vocabulary words from Firebase
  const loadWords = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      let vocabularyQuery = collection(db, 'vocabulary');
      
      // Apply subject filter
      if (selectedSubject !== 'all') {
        vocabularyQuery = query(vocabularyQuery, where('subjects', 'array-contains', selectedSubject));
      }

      // Apply difficulty filter
      if (filters.difficulty !== 'all') {
        vocabularyQuery = query(vocabularyQuery, where('difficulty', '==', parseInt(filters.difficulty)));
      }

      // Apply search filter
      if (searchTerm.trim()) {
        // For search, we'll filter client-side since Firestore doesn't support full-text search
        vocabularyQuery = query(vocabularyQuery, orderBy('frequency', 'desc'));
      } else {
        vocabularyQuery = query(vocabularyQuery, orderBy('frequency', 'desc'));
      }

      // Pagination
      if (!reset && lastDoc) {
        vocabularyQuery = query(vocabularyQuery, startAfter(lastDoc));
      }
      
      vocabularyQuery = query(vocabularyQuery, limit(20));

      const querySnapshot = await getDocs(vocabularyQuery);
      
      if (querySnapshot.empty) {
        if (reset) {
          setWords([]);
          setHasMore(false);
        }
        return;
      }

      const newWords = [];
      querySnapshot.forEach((doc) => {
        const wordData = doc.data();
        
        // Debug logging for first few words
        if (newWords.length < 3) {
          console.log('Debug - Word data structure:', wordData);
        }
        
        // Client-side search filtering
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase();
          if (!wordData.word.toLowerCase().includes(searchLower) &&
              !wordData.contexts?.some(context => context.toLowerCase().includes(searchLower))) {
            return;
          }
        }

        // Ensure required fields exist and are properly formatted
        const sanitizedWord = {
          id: doc.id,
          word: wordData.word || doc.id,
          frequency: wordData.frequency || 1,
          difficulty: wordData.difficulty || 3,
          definition: wordData.definition || '',
          contexts: Array.isArray(wordData.contexts) ? wordData.contexts : [],
          subjects: Array.isArray(wordData.subjects) ? wordData.subjects : [],
          questions: Array.isArray(wordData.questions) ? wordData.questions : [],
          examples: Array.isArray(wordData.examples) ? wordData.examples : [],
          height: Math.floor(Math.random() * 200) + 300, // For masonry layout
          createdAt: wordData.createdAt,
          updatedAt: wordData.updatedAt
        };

        newWords.push(sanitizedWord);
      });

      // Set last document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === 20);
      } else {
        setHasMore(false);
      }

      if (reset) {
        setWords(newWords);
      } else {
        setWords(prev => [...prev, ...newWords]);
      }

      console.log(`📚 Loaded ${newWords.length} words from Firebase`);
      
    } catch (error) {
      console.error('Error loading vocabulary from Firebase:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, filters, searchTerm, lastDoc, loading]);

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
        // Filter out undefined values to prevent Firebase errors
        const wordData = {
          userId: user.uid,
          word: word.word || '',
          definition: word.definition || '',
          difficulty: word.difficulty || 3,
          subjectArea: word.subjectArea || 'general',
          savedAt: new Date()
        };

        // Add optional fields only if they exist and are not undefined
        if (word.pronunciation) wordData.pronunciation = word.pronunciation;
        if (word.koreanTranslation) wordData.koreanTranslation = word.koreanTranslation;
        if (word.synonyms && word.synonyms.length > 0) wordData.synonyms = word.synonyms;
        if (word.antonyms && word.antonyms.length > 0) wordData.antonyms = word.antonyms;
        if (word.examples && word.examples.length > 0) wordData.examples = word.examples;
        if (word.etymology) wordData.etymology = word.etymology;
        if (word.collocations && word.collocations.length > 0) wordData.collocations = word.collocations;

        await setDoc(docRef, wordData);
        setSavedWords(prev => new Set([...prev, word.word]));
      }
    } catch (error) {
      console.error('Error saving word:', error);
    }
  };

  // Close quiz function
  const closeQuiz = useCallback(() => {
    console.log('Closing quiz and resetting state');
    setShowQuiz(false);
    setQuizWords([]);
  }, []);

  // Start quiz for subject area
  const startSubjectQuiz = () => {
    console.log('Quiz button clicked! Words available:', words.length);
    
    if (words.length === 0) {
      console.log('No words available for quiz');
      return;
    }
    
    // Prevent multiple quiz instances
    if (showQuiz) {
      console.log('Quiz already open, ignoring click');
      return;
    }
    
    // Get 10 random words from current subject
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const selectedQuizWords = shuffled.slice(0, 10);
    
    console.log('Setting quiz words:', selectedQuizWords.length);
    console.log('Quiz words sample:', selectedQuizWords[0]);
    setQuizWords(selectedQuizWords);
    setShowQuiz(true);
    console.log('Quiz modal should now be visible');
  };


  // Generate random words for subject  
  const generateRandomWords = async () => {
    if (selectedSubject === 'all') return;
    
    try {
      // Reload words but shuffled for the selected subject
      await loadWords(true);
      const shuffled = [...words].sort(() => 0.5 - Math.random());
      setWords(shuffled.slice(0, 10));
    } catch (error) {
      console.error('Error generating random words:', error);
    }
  };


  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    loadWords(true);
  }, [selectedSubject, filters, searchTerm]);

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
      {/* Filters */}
      <div className="search-filters">

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

        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search vocabulary words and contexts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
              title="Clear search"
            >
              ×
            </button>
          )}
          {searchTerm && (
            <div className="search-info">
              Searching in word names and context sentences
              {words.length > 0 && (
                <span className="search-results-count">
                  ({words.length} {words.length === 1 ? 'result' : 'results'} found)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          {selectedSubject !== 'all' && (
            <button onClick={generateRandomWords} className="action-btn generate-btn">
              🎲 Generate 10 Random Words
            </button>
          )}
          {words.length > 0 && (
            <button 
              onClick={startSubjectQuiz} 
              className="action-btn quiz-btn"
              disabled={showQuiz}
              style={{
                opacity: showQuiz ? 0.6 : 1,
                cursor: showQuiz ? 'not-allowed' : 'pointer'
              }}
            >
              {showQuiz ? '🧠 Quiz Running...' : '🧠 Quiz This Subject'}
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
            <VocabularyErrorBoundary key={`${word.word}-${index}`}>
              <VocabularyCard
                word={word}
                isSaved={savedWords.has(word.word)}
                onToggleSave={() => toggleSaveWord(word)}
              />
            </VocabularyErrorBoundary>
          ))}
        </div>

        {/* Load More */}
        {!loading && words.length > 0 && hasMore && (
          <div className="load-more-container">
            <button onClick={() => loadWords(false)} className="load-more-btn">
              Load More Words
            </button>
          </div>
        )}

        {/* No Words Message */}
        {!loading && words.length === 0 && (
          <div className="loading-container">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <h3>📚 No vocabulary words found</h3>
              <p>Add some vocabulary data to your Firebase collection to see words here.</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
                Check the console for debug information or add test data using the scripts provided.
              </p>
            </div>
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
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            // Close when clicking on backdrop
            if (e.target === e.currentTarget) {
              closeQuiz();
            }
          }}
          onKeyDown={(e) => {
            // Close on Escape key
            if (e.key === 'Escape') {
              closeQuiz();
            }
          }}
          tabIndex={-1}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {quizWords && quizWords.length > 0 ? (
              <VocabularyErrorBoundary>
                <VocabularyQuiz
                  key={`quiz-${Date.now()}`} // Force re-render each time
                  words={quizWords}
                  onClose={closeQuiz}
                  onComplete={(results) => {
                    console.log('Quiz completed:', results);
                    closeQuiz();
                  }}
                />
              </VocabularyErrorBoundary>
            ) : (
              <div style={{
                padding: '2rem',
                textAlign: 'center'
              }}>
                <p>Loading quiz...</p>
                <button onClick={closeQuiz}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Vocabulary Card Component
const VocabularyCard = ({ 
  word, 
  isSaved, 
  onToggleSave
}) => {

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

  // Highlight the target word in context sentences
  const highlightWord = (sentence, targetWord) => {
    if (!sentence || !targetWord) return sentence;
    if (typeof sentence !== 'string') return String(sentence);
    
    const regex = new RegExp(`\\b(${targetWord})\\b`, 'gi');
    const parts = sentence.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => {
          if (part.toLowerCase() === targetWord.toLowerCase()) {
            return <strong key={index} style={{ backgroundColor: '#fef08a', padding: '2px 4px', borderRadius: '3px' }}>{part}</strong>;
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="vocabulary-card">
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

      {/* Frequency and Subject Info */}
      <div className="word-stats">
        <div className="frequency-badge">
          Appears {word.frequency} time{word.frequency !== 1 ? 's' : ''}
        </div>
        {word.subjects && word.subjects.length > 0 && (
          <div className="subject-tags">
            {word.subjects.slice(0, 2).map((subject, index) => (
              <span key={index} className="subject-tag">{subject}</span>
            ))}
          </div>
        )}
      </div>


      {/* Context Sentences from CSAT Questions */}
      {word.contexts && Array.isArray(word.contexts) && word.contexts.length > 0 && (
        <div className="context-section">
          <h4 className="context-title">📖 CSAT Context:</h4>
          <div className="context-sentence">
            {highlightWord(word.contexts[0], word.word)}
          </div>
        </div>
      )}

      {/* Question Examples */}
      {word.examples && Array.isArray(word.examples) && word.examples.length > 0 && (
        <div className="examples-section">
          <h4 className="examples-title">📋 Found in Questions:</h4>
          {word.examples.slice(0, 2).map((example, index) => {
            // Handle different example formats
            if (typeof example === 'object' && example !== null) {
              return (
                <div key={index} className="example-item">
                  <div className="question-id">
  {String(typeof example.questionId === 'string' ? example.questionId : 
    typeof example.questionId === 'object' && example.questionId ? 
      (example.questionId.id || example.questionId.questionId || `Example ${index + 1}`) : 
      `Example ${index + 1}`)}
</div>
                  <div className="example-sentence">
                    {typeof example.sentence === 'string' ? highlightWord(example.sentence, word.word) : 
                     typeof example.sentence === 'object' && example.sentence ? 
                       highlightWord(String(example.sentence.text || example.sentence.sentence || example.sentence), word.word) : 
                       'No sentence available'}
                  </div>
                </div>
              );
            }
            return (
              <div key={index} className="example-item">
                <div className="question-id">Example {index + 1}</div>
                <div className="example-sentence">
                  {typeof example === 'string' ? highlightWord(example, word.word) : 'No sentence available'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Questions List */}
      {word.questions && Array.isArray(word.questions) && word.questions.length > 0 && (
        <div className="questions-section">
          <h4 className="questions-title">🎯 Appears in:</h4>
          <div className="questions-list">
            {word.questions.slice(0, 3).map((questionId, index) => (
              <span key={index} className="question-badge">
  {String(typeof questionId === 'string' ? questionId : 
    typeof questionId === 'object' && questionId ? 
      (questionId.id || questionId.questionId || `Q${index + 1}`) : 
      `Q${index + 1}`)}
</span>
            ))}
            {word.questions.length > 3 && (
              <span className="more-questions">+{word.questions.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyPinterest;