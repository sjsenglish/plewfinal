import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { fetchVocabulary } from '../services/vocabularyAPIService';
import VocabularyQuiz from './VocabularyQuiz';
import './VocabularyPinterest.css';


const VocabularyPinterest = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedWords, setSavedWords] = useState(new Set());
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizWords, setQuizWords] = useState([]);
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


  // Load vocabulary words - optimized for speed
  const loadWords = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const options = {
        limit: 20,
        offset: reset ? 0 : words.length,
        subjectArea: selectedSubject,
        search: null,
        difficulty: filters.difficulty !== 'all' ? filters.difficulty : null,
        minFrequency: filters.frequency !== 'all' ? parseInt(filters.frequency) : 1
      };

      console.log('📚 Loading vocabulary words with options:', options);
      const result = await fetchVocabulary(options);
      
      if (result.success) {
        // Process words with minimal enhancement for better performance
        const enhancedWords = result.words.map(word => ({
          ...word,
          id: word.word || word.id,
          height: Math.floor(Math.random() * 200) + 300, // Random height for masonry
          // Use existing data from API or provide good fallbacks
          definition: word.definition || `${word.word}: An important vocabulary word for CSAT preparation.`,
          synonyms: word.synonyms?.length > 0 ? word.synonyms : 
                   ['similar', 'related', 'comparable', 'equivalent'],
          examples: word.examples?.length > 0 ? word.examples :
                   [`The word "${word.word}" appears frequently in CSAT reading passages.`],
          questionInfo: word.questionInfo || null,
          pronunciation: word.pronunciation || null,
          difficulty: word.difficulty || 5,
          frequency: word.frequency || 1,
          subjectArea: word.subjectArea || selectedSubject
        }));

        console.log(`📚 Processed ${enhancedWords.length} words`);

        if (reset) {
          setWords(enhancedWords);
        } else {
          setWords(prev => [...prev, ...enhancedWords]);
        }
      }
    } catch (error) {
      console.error('Error loading words:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, filters, words.length]);

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

  // Start quiz for subject area
  const startSubjectQuiz = () => {
    if (words.length === 0) return;
    
    // Get 10 random words from current subject
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const quizWords = shuffled.slice(0, 10);
    setQuizWords(quizWords);
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


  useEffect(() => {
    loadWords(true);
  }, [selectedSubject, filters, loadWords]);

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
              isSaved={savedWords.has(word.word)}
              onToggleSave={() => toggleSaveWord(word)}
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

      {/* Synonyms - Always Visible */}
      {word.synonyms && word.synonyms.length > 0 && (
        <div className="synonyms-section">
          <span className="synonyms-label">Synonyms:</span>
          <div className="synonyms-list">
            {word.synonyms.map((synonym, index) => (
              <span key={index} className="synonym-tag">{synonym}</span>
            ))}
          </div>
        </div>
      )}

      {/* CSAT Example Sentences */}
      {word.examples && word.examples.length > 0 && (
        <div className="examples-section">
          <h4 className="examples-title">
            CSAT Example
            {word.questionInfo && (
              <span className="question-info"> - Q{word.questionInfo.number || ''} ({word.questionInfo.year || '2023'})</span>
            )}:
          </h4>
          <p className="example-sentence">{word.examples[0]}</p>
        </div>
      )}
    </div>
  );
};

export default VocabularyPinterest;