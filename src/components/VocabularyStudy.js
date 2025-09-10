import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, collection, query, where, getDocs, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import VocabularyQuiz from './VocabularyQuiz';
import './VocabularyStudy.css';

const VocabularyStudy = () => {
  const [savedWords, setSavedWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWords, setSelectedWords] = useState(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizWords, setQuizWords] = useState([]);
  const [sortBy, setSortBy] = useState('recent'); // recent, alphabetical, difficulty, performance
  const [filterBy, setFilterBy] = useState('all'); // all, difficult, practiced, unpracticed
  const [searchQuery, setSearchQuery] = useState('');
  const [studyStats, setStudyStats] = useState({
    totalWords: 0,
    quizzedWords: 0,
    averageScore: 0,
    streakDays: 0
  });

  const auth = getAuth();
  const user = auth.currentUser;

  // Load saved words
  const loadSavedWords = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get saved vocabulary
      const vocabQuery = query(
        collection(db, 'savedVocabulary'),
        where('userId', '==', user.uid),
        orderBy('savedAt', 'desc')
      );
      
      const vocabSnapshot = await getDocs(vocabQuery);
      const wordsWithStats = [];

      // Get quiz results for performance data
      const quizQuery = query(
        collection(db, 'vocabularyQuizResults'),
        where('userId', '==', user.uid)
      );
      
      const quizSnapshot = await getDocs(quizQuery);
      const quizResults = {};
      
      quizSnapshot.forEach(doc => {
        const result = doc.data();
        result.answers.forEach(answer => {
          if (!quizResults[answer.word]) {
            quizResults[answer.word] = {
              attempts: 0,
              correct: 0,
              lastAttempt: null
            };
          }
          quizResults[answer.word].attempts++;
          if (answer.isCorrect) {
            quizResults[answer.word].correct++;
          }
          if (!quizResults[answer.word].lastAttempt || result.completedAt > quizResults[answer.word].lastAttempt) {
            quizResults[answer.word].lastAttempt = result.completedAt;
          }
        });
      });

      // Combine vocabulary with performance stats
      vocabSnapshot.forEach(doc => {
        const wordData = doc.data();
        const stats = quizResults[wordData.word] || {
          attempts: 0,
          correct: 0,
          lastAttempt: null
        };

        wordsWithStats.push({
          ...wordData,
          id: doc.id,
          performance: {
            attempts: stats.attempts,
            correct: stats.correct,
            accuracy: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0,
            lastAttempt: stats.lastAttempt
          }
        });
      });

      setSavedWords(wordsWithStats);

      // Calculate study stats
      const totalWords = wordsWithStats.length;
      const quizzedWords = wordsWithStats.filter(w => w.performance.attempts > 0).length;
      const averageScore = totalWords > 0 ? 
        Math.round(wordsWithStats.reduce((sum, w) => sum + w.performance.accuracy, 0) / totalWords) : 0;

      setStudyStats({
        totalWords,
        quizzedWords,
        averageScore,
        streakDays: 0 // TODO: Calculate based on daily quiz activity
      });

    } catch (error) {
      console.error('Error loading saved words:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Filter and sort words
  const getFilteredAndSortedWords = useCallback(() => {
    let filtered = [...savedWords];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(word =>
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (word.definition && word.definition.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'difficult':
        filtered = filtered.filter(word => word.performance.accuracy < 70 && word.performance.attempts > 0);
        break;
      case 'practiced':
        filtered = filtered.filter(word => word.performance.attempts > 0);
        break;
      case 'unpracticed':
        filtered = filtered.filter(word => word.performance.attempts === 0);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'difficulty':
        filtered.sort((a, b) => (b.difficulty || 3) - (a.difficulty || 3));
        break;
      case 'performance':
        filtered.sort((a, b) => {
          if (a.performance.attempts === 0 && b.performance.attempts === 0) return 0;
          if (a.performance.attempts === 0) return 1;
          if (b.performance.attempts === 0) return -1;
          return a.performance.accuracy - b.performance.accuracy;
        });
        break;
      default: // 'recent'
        filtered.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        break;
    }

    return filtered;
  }, [savedWords, searchQuery, filterBy, sortBy]);

  // Remove word from saved
  const removeWord = async (wordId) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'savedVocabulary', wordId));
      setSavedWords(prev => prev.filter(w => w.id !== wordId));
      setSelectedWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordId);
        return newSet;
      });
    } catch (error) {
      console.error('Error removing word:', error);
    }
  };

  // Toggle word selection
  const toggleWordSelection = (wordId) => {
    setSelectedWords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  };

  // Start quiz with selected words
  const startQuizWithSelected = () => {
    const words = savedWords.filter(w => selectedWords.has(w.id));
    if (words.length === 0) return;
    
    setQuizWords(words);
    setShowQuiz(true);
  };

  // Start quiz with all words
  const startQuizWithAll = () => {
    const filtered = getFilteredAndSortedWords();
    if (filtered.length === 0) return;
    
    setQuizWords(filtered);
    setShowQuiz(true);
  };

  // Start practice for difficult words
  const startDifficultWordsQuiz = () => {
    const difficultWords = savedWords.filter(w => 
      w.performance.accuracy < 70 && w.performance.attempts > 0
    );
    
    if (difficultWords.length === 0) {
      alert('No difficult words found. Keep practicing!');
      return;
    }
    
    setQuizWords(difficultWords);
    setShowQuiz(true);
  };

  // Quick actions
  const selectAll = () => {
    const filtered = getFilteredAndSortedWords();
    setSelectedWords(new Set(filtered.map(w => w.id)));
  };

  const clearSelection = () => {
    setSelectedWords(new Set());
  };

  useEffect(() => {
    loadSavedWords();
  }, [loadSavedWords]);

  const filteredWords = getFilteredAndSortedWords();

  if (!user) {
    return (
      <div className="vocabulary-study">
        <div className="auth-required">
          <div className="auth-message">
            <h3>로그인이 필요합니다</h3>
            <p>저장된 단어를 학습하려면 로그인하세요.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="vocabulary-study">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vocabulary-study">
      {/* Header with Stats */}
      <div className="study-header">
        <div className="header-content">
          <h2 className="study-title">
            <span className="title-icon">📚</span>
            My Vocabulary Collection
          </h2>
          <div className="study-stats">
            <div className="stat-item">
              <span className="stat-number">{studyStats.totalWords}</span>
              <span className="stat-label">Saved Words</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{studyStats.quizzedWords}</span>
              <span className="stat-label">Practiced</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{studyStats.averageScore}%</span>
              <span className="stat-label">Avg Score</span>
            </div>
          </div>
        </div>
      </div>

      {savedWords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <div className="empty-icon">📖</div>
            <h3>No saved words yet</h3>
            <p>Discover and save vocabulary words to start building your collection!</p>
            <button 
              onClick={() => window.location.href = '/vocabulary'} 
              className="discover-btn"
            >
              🔍 Discover Vocabulary
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="study-controls">
            {/* Search */}
            <div className="search-section">
              <input
                type="text"
                placeholder="Search your words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filters and Sort */}
            <div className="filter-sort-section">
              <div className="filter-group">
                <label>Filter:</label>
                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                  <option value="all">All Words</option>
                  <option value="unpracticed">Unpracticed</option>
                  <option value="practiced">Practiced</option>
                  <option value="difficult">Difficult (&lt;70%)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="recent">Recently Added</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="difficulty">Difficulty Level</option>
                  <option value="performance">Performance</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button onClick={startQuizWithAll} className="action-btn primary">
                🧠 Quiz All ({filteredWords.length})
              </button>
              <button onClick={startDifficultWordsQuiz} className="action-btn secondary">
                🎯 Practice Difficult
              </button>
              {selectedWords.size > 0 && (
                <>
                  <button onClick={startQuizWithSelected} className="action-btn selected">
                    ✓ Quiz Selected ({selectedWords.size})
                  </button>
                  <button onClick={clearSelection} className="action-btn clear">
                    Clear Selection
                  </button>
                </>
              )}
              <button onClick={selectAll} className="action-btn outline">
                Select All
              </button>
            </div>
          </div>

          {/* Words Grid */}
          <div className="words-grid">
            {filteredWords.map(word => (
              <WordCard
                key={word.id}
                word={word}
                isSelected={selectedWords.has(word.id)}
                onToggleSelect={() => toggleWordSelection(word.id)}
                onRemove={() => removeWord(word.id)}
                onQuiz={() => {
                  setQuizWords([word]);
                  setShowQuiz(true);
                }}
              />
            ))}
          </div>

          {filteredWords.length === 0 && (
            <div className="no-results">
              <p>No words match your current filters.</p>
            </div>
          )}
        </>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <VocabularyQuiz
          words={quizWords}
          onClose={() => setShowQuiz(false)}
          onComplete={(results) => {
            console.log('Quiz completed:', results);
            setShowQuiz(false);
            // Reload words to update performance stats
            loadSavedWords();
          }}
        />
      )}
    </div>
  );
};

// Individual Word Card Component
const WordCard = ({ word, isSelected, onToggleSelect, onRemove, onQuiz }) => {
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

  const getPerformanceColor = (accuracy) => {
    if (accuracy >= 80) return '#22c55e';
    if (accuracy >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className={`word-card ${isSelected ? 'selected' : ''}`}>
      {/* Selection Checkbox */}
      <div className="card-header">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="word-checkbox"
        />
        <button onClick={onRemove} className="remove-btn" title="Remove word">
          🗑️
        </button>
      </div>

      {/* Word Title */}
      <div className="word-title">
        <h3 className="word-text">{word.word}</h3>
        <div className="word-meta">
          <span 
            className="difficulty-badge"
            style={{ backgroundColor: getDifficultyColor(word.difficulty) }}
          >
            {getDifficultyLabel(word.difficulty)}
          </span>
          {word.subjectArea && (
            <span className="subject-tag">{word.subjectArea}</span>
          )}
        </div>
      </div>

      {/* Definition */}
      <div className="word-definition">
        <p>{word.definition}</p>
      </div>

      {/* Performance Stats */}
      <div className="performance-section">
        {word.performance.attempts > 0 ? (
          <div className="performance-stats">
            <div className="stat-row">
              <span className="stat-label">Accuracy:</span>
              <span 
                className="stat-value accuracy"
                style={{ color: getPerformanceColor(word.performance.accuracy) }}
              >
                {word.performance.accuracy}%
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Attempts:</span>
              <span className="stat-value">{word.performance.attempts}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Last practiced:</span>
              <span className="stat-value">
                {formatDate(word.performance.lastAttempt)}
              </span>
            </div>
          </div>
        ) : (
          <div className="no-practice">
            <span className="no-practice-text">Not practiced yet</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card-actions">
        <button onClick={onQuiz} className="quiz-btn">
          🧠 Quiz This Word
        </button>
      </div>

      {/* Saved Date */}
      <div className="saved-date">
        Saved {formatDate(word.savedAt)}
      </div>
    </div>
  );
};

export default VocabularyStudy;