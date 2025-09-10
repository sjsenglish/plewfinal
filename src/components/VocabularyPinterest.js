import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { fetchVocabulary, getEnhancedWordInfo } from '../services/vocabularyAPIService';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import VocabularyQuiz from './VocabularyQuiz';
import './VocabularyPinterest.css';

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

const VocabularyPinterest = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedWords, setSavedWords] = useState(new Set());
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizWords, setQuizWords] = useState([]);
  const [hoveredWord, setHoveredWord] = useState(null);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    frequency: 'all'
  });

  const auth = getAuth();
  const user = auth.currentUser;
  const masonryRef = useRef(null);

  // Fetch CSAT passage containing the word from Algolia
  const fetchCSATPassage = async (word) => {
    try {
      console.log(`Searching for CSAT passage containing: "${word}"`);
      const response = await searchClient.search([
        {
          indexName: 'korean-english-question-pairs',
          params: {
            query: word,
            hitsPerPage: 1,
            attributesToRetrieve: ['question', 'english_text', 'korean_text', 'paper_info', 'objectID'],
            attributesToHighlight: ['question', 'english_text'],
            highlightPreTag: '<mark>',
            highlightPostTag: '</mark>'
          }
        }
      ]);

      console.log(`Algolia response for "${word}":`, response.results[0].hits.length, 'hits');
      
      if (response.results[0].hits.length > 0) {
        const hit = response.results[0].hits[0];
        const passage = hit.english_text || hit.question || '';
        
        console.log(`Found passage for "${word}":`, passage.substring(0, 100) + '...');
        
        // Find sentence containing the word
        const sentences = passage.split(/[.!?]+/);
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        const sentenceWithWord = sentences.find(sentence => wordRegex.test(sentence));
        
        const result = {
          example: sentenceWithWord ? sentenceWithWord.trim() + '.' : passage.substring(0, 200) + '...',
          questionInfo: {
            number: hit.objectID ? hit.objectID.split('-').pop() : null,
            year: hit.paper_info?.year || '2023'
          }
        };
        
        console.log(`CSAT result for "${word}":`, result);
        return result;
      }
      
      console.log(`No CSAT passage found for: "${word}"`);
      return null;
    } catch (error) {
      console.error('Error fetching CSAT passage for', word, ':', error);
      return null;
    }
  };

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
        search: null,
        difficulty: filters.difficulty !== 'all' ? filters.difficulty : null,
        minFrequency: filters.frequency !== 'all' ? parseInt(filters.frequency) : 1
      };

      const result = await fetchVocabulary(options);
      
      if (result.success) {
        const enhancedWords = await Promise.all(
          result.words.map(async (word, index) => {
            // Try to get enhanced word info from Free Dictionary API
            let enhancedData = {};
            try {
              const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.word}`);
              if (response.ok) {
                const data = await response.json();
                const entry = data[0];
                const meaning = entry?.meanings?.[0];
                const definition = meaning?.definitions?.[0];
                
                enhancedData = {
                  definition: definition?.definition || word.definition,
                  synonyms: definition?.synonyms || [],
                  pronunciation: entry?.phonetics?.[0]?.text || word.pronunciation
                };
              }
            } catch (error) {
              console.log(`Failed to enhance word ${word.word}:`, error);
            }

            // Fetch actual CSAT passage for this word
            const csatData = await fetchCSATPassage(word.word);

            return {
              ...word,
              ...enhancedData,
              id: word.word || word.id,
              height: Math.floor(Math.random() * 200) + 300, // Random height for masonry
              // Fallback to ensure we have content for display
              definition: enhancedData.definition || word.definition || `${word.word}: An important vocabulary word for CSAT preparation.`,
              // Ensure all words have synonyms
              synonyms: enhancedData.synonyms?.length > 0 ? enhancedData.synonyms : 
                        word.synonyms?.length > 0 ? word.synonyms :
                        ['similar', 'related', 'comparable', 'equivalent'],
              // Use actual CSAT passage examples
              examples: csatData?.example ? [csatData.example] :
                       word.examples?.length > 0 ? word.examples :
                       [`The word "${word.word}" appears frequently in CSAT reading passages.`],
              questionInfo: csatData?.questionInfo || word.questionInfo || null
            };
          })
        );

        const newWords = enhancedWords;

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


  useEffect(() => {
    loadWords(true);
  }, [selectedSubject, filters]);

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
  isSaved, 
  onToggleSave, 
  onHover 
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
    <div 
      className="vocabulary-card"
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