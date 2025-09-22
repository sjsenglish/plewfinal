import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import WordDetailModal from './WordDetailModal';
import './VocabularyPinterest.css';

const EnhancedVocabularyPinterest = () => {
  const [allWords, setAllWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('frequency');
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [savedWords, setSavedWords] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [wordsPerPage] = useState(50);
  
  const auth = getAuth();
  const user = auth.currentUser;

  // Load vocabulary data from JSON file
  const loadVocabularyData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📚 Loading enhanced vocabulary data...');
      const response = await fetch('/vocabulary-data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const vocabularyData = await response.json();
      
      // Process and enhance the data
      const processedWords = vocabularyData.map((word, index) => ({
        id: word.word,
        word: word.word,
        frequency: word.frequency || 1,
        difficulty: word.difficulty || 5,
        definition: word.definition || '',
        contexts: Array.isArray(word.contexts) ? word.contexts : [],
        subjects: Array.isArray(word.subjects) ? word.subjects : ['general'],
        questions: Array.isArray(word.questions) ? word.questions : [],
        years: Array.isArray(word.years) ? word.years : [],
        examples: Array.isArray(word.examples) ? word.examples : word.contexts?.slice(0, 3) || [],
        height: Math.floor(Math.random() * 200) + 250, // For masonry layout
        createdAt: word.createdAt,
        updatedAt: word.updatedAt
      }));

      setAllWords(processedWords);
      console.log(`✅ Loaded ${processedWords.length} vocabulary words`);
    } catch (error) {
      console.error('Error loading vocabulary data:', error);
      // Fallback to empty array
      setAllWords([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Filter and search words
  const filteredWords = useMemo(() => {
    let filtered = [...allWords];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(word => 
        word.word.toLowerCase().includes(searchLower) ||
        word.definition.toLowerCase().includes(searchLower) ||
        word.contexts.some(context => context.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      const difficultyNum = parseInt(selectedDifficulty);
      filtered = filtered.filter(word => word.difficulty === difficultyNum);
    }
    
    // Apply subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(word => 
        word.subjects.includes(selectedSubject)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.frequency - a.frequency;
        case 'alphabetical':
          return a.word.localeCompare(b.word);
        case 'difficulty':
          return b.difficulty - a.difficulty;
        case 'length':
          return b.word.length - a.word.length;
        default:
          return b.frequency - a.frequency;
      }
    });
    
    return filtered;
  }, [allWords, searchTerm, selectedDifficulty, selectedSubject, sortBy]);

  // Paginate filtered words
  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * wordsPerPage;
    return filteredWords.slice(startIndex, startIndex + wordsPerPage);
  }, [filteredWords, currentPage, wordsPerPage]);

  const totalPages = Math.ceil(filteredWords.length / wordsPerPage);

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
        const wordData = {
          userId: user.uid,
          word: word.word || '',
          definition: word.definition || '',
          difficulty: word.difficulty || 5,
          subjectArea: word.subjects?.[0] || 'general',
          savedAt: new Date()
        };

        if (word.examples && word.examples.length > 0) wordData.examples = word.examples;

        await setDoc(docRef, wordData);
        setSavedWords(prev => new Set([...prev, word.word]));
      }
    } catch (error) {
      console.error('Error saving word:', error);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDifficulty, selectedSubject, sortBy]);

  // Load data on component mount
  useEffect(() => {
    loadVocabularyData();
  }, [loadVocabularyData]);

  useEffect(() => {
    loadSavedWords();
  }, [loadSavedWords]);

  // Get unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set();
    allWords.forEach(word => {
      word.subjects.forEach(subject => subjects.add(subject));
    });
    return Array.from(subjects).sort();
  }, [allWords]);

  return (
    <div className="vocabulary-pinterest">
      {/* Search and Filter Controls */}
      <div className="vocab-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="단어 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="search-stats">
            {filteredWords.length.toLocaleString()} words found
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>

        <div className="filter-section">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="filter-select"
          >
            <option value="all">모든 난이도</option>
            <option value="4">중급 (4)</option>
            <option value="5">중급+ (5)</option>
            <option value="6">중상급 (6)</option>
            <option value="7">상급 (7)</option>
            <option value="8">상급+ (8)</option>
            <option value="9">고급 (9)</option>
            <option value="10">최고급 (10)</option>
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="filter-select"
          >
            <option value="all">모든 주제</option>
            {uniqueSubjects.map(subject => (
              <option key={subject} value={subject}>
                {subject.charAt(0).toUpperCase() + subject.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="frequency">빈도순</option>
            <option value="alphabetical">알파벳순</option>
            <option value="difficulty">난이도순</option>
            <option value="length">길이순</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading vocabulary...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredWords.length === 0 && (
        <div className="empty-state">
          <h3>검색 결과가 없습니다</h3>
          <p>다른 검색어나 필터를 시도해보세요.</p>
        </div>
      )}

      {/* Vocabulary Grid */}
      {!loading && filteredWords.length > 0 && (
        <>
          <div className="vocab-grid">
            {paginatedWords.map((word) => (
              <div
                key={word.id}
                className="vocab-card"
                style={{ height: `${word.height}px` }}
                onClick={() => setSelectedWord(word)}
              >
                <div className="vocab-card-content">
                  <div className="vocab-header">
                    <h3 className="vocab-word">{word.word}</h3>
                    <div className="vocab-meta">
                      <span className={`difficulty-badge difficulty-${word.difficulty}`}>
                        {word.difficulty}
                      </span>
                      <span className="frequency-badge">
                        {word.frequency}회
                      </span>
                    </div>
                  </div>

                  {word.definition && (
                    <p className="vocab-definition">{word.definition}</p>
                  )}

                  {word.contexts.length > 0 && (
                    <div className="vocab-context">
                      <p>"{word.contexts[0].substring(0, 100)}..."</p>
                    </div>
                  )}

                  <div className="vocab-footer">
                    <div className="vocab-subjects">
                      {word.subjects.slice(0, 2).map(subject => (
                        <span key={subject} className="subject-tag">
                          {subject}
                        </span>
                      ))}
                    </div>
                    
                    <button
                      className={`save-btn ${savedWords.has(word.word) ? 'saved' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveWord(word);
                      }}
                      title={savedWords.has(word.word) ? '저장됨' : '저장하기'}
                    >
                      {savedWords.has(word.word) ? '💾' : '💾'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                이전
              </button>
              
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* Word Detail Modal */}
      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onSave={toggleSaveWord}
          isSaved={savedWords.has(selectedWord.word)}
        />
      )}
    </div>
  );
};

export default EnhancedVocabularyPinterest;