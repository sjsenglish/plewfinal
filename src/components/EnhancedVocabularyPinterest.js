import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Fuse from 'fuse.js';
import WordDetailModal from './WordDetailModal';
import SimpleVocabularyTest from './SimpleVocabularyTest';
import './VocabularyPinterest.css';

const EnhancedVocabularyPinterest = () => {
  const [allWords, setAllWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('frequency');
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [wordsPerPage] = useState(50);
  const [showTest, setShowTest] = useState(false);
  
  // Remove auth since we no longer need save functionality

  // Load vocabulary data from Firebase
  const loadVocabularyData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📚 Loading vocabulary data from Firebase...');
      const vocabularyRef = collection(db, 'vocabulary_words');
      const querySnapshot = await getDocs(vocabularyRef);
      
      const vocabularyData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vocabularyData.push({
          id: doc.id,
          word: data.word,
          frequency: data.frequency || 1,
          difficulty: data.difficulty || 5,
          definition: data.definition || '',
          contexts: Array.isArray(data.contexts) ? data.contexts : [],
          subjects: Array.isArray(data.subjects) ? data.subjects : ['general'],
          questions: Array.isArray(data.questions) ? data.questions : [],
          years: Array.isArray(data.years) ? data.years : [],
          examples: Array.isArray(data.examples) ? data.examples : data.contexts?.slice(0, 3) || [],
          // Dynamic height based on content
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      setAllWords(vocabularyData);
      console.log(`✅ Loaded ${vocabularyData.length} vocabulary words from Firebase`);
    } catch (error) {
      console.error('❌ Error loading vocabulary data from Firebase:', error);
      // Fallback to empty array
      setAllWords([]);
    } finally {
      setLoading(false);
    }
  }, []);


  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!allWords.length) return null;
    
    const fuseOptions = {
      keys: [
        { name: 'word', weight: 3.0 },      // Exact word match is most important
        { name: 'definition', weight: 1.5 }, // Definition match is important
        { name: 'contexts', weight: 1.0 }    // Context match is helpful
      ],
      threshold: 0.3,         // Lower = more strict matching (0.3 allows for some typos)
      includeScore: true,
      shouldSort: true,
      minMatchCharLength: 2,
      ignoreLocation: true,   // Don't prioritize matches at beginning
      findAllMatches: true,
      useExtendedSearch: true
    };
    
    return new Fuse(allWords, fuseOptions);
  }, [allWords]);

  // Filter and search words
  const filteredWords = useMemo(() => {
    let filtered = [...allWords];
    
    // Apply search filter using Fuse.js for fuzzy matching
    if (searchTerm.trim() && fuse) {
      const searchLower = searchTerm.toLowerCase();
      
      // First, check for exact matches
      const exactMatches = allWords.filter(word => 
        word.word.toLowerCase() === searchLower
      );
      
      if (exactMatches.length > 0) {
        // If we have exact matches, prioritize them
        filtered = exactMatches;
      } else {
        // Use Fuse.js for fuzzy search
        // Support advanced search operators
        let searchQuery = searchTerm;
        
        // If it's a simple search (no operators), search all fields
        if (!searchTerm.includes('=') && !searchTerm.includes('^') && !searchTerm.includes('!')) {
          searchQuery = `${searchTerm} | '${searchTerm}`;
        }
        
        const searchResults = fuse.search(searchQuery);
        
        // Extract the items from search results and sort by score
        filtered = searchResults
          .filter(result => result.score < 0.6) // Only include good matches
          .map(result => result.item);
      }
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
    
    // Apply sorting (only if not searching, as search results are already sorted by relevance)
    if (!searchTerm.trim()) {
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
    }
    
    return filtered;
  }, [allWords, searchTerm, selectedDifficulty, selectedSubject, sortBy, fuse]);

  // Paginate filtered words
  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * wordsPerPage;
    return filteredWords.slice(startIndex, startIndex + wordsPerPage);
  }, [filteredWords, currentPage, wordsPerPage]);

  const totalPages = Math.ceil(filteredWords.length / wordsPerPage);

  // Function to get unique example sentences (max 4)
  const getUniqueExamples = (contexts, maxCount = 4) => {
    if (!contexts || !Array.isArray(contexts)) return [];
    
    // Remove duplicates and empty strings, then limit to maxCount
    const uniqueContexts = [...new Set(contexts.filter(context => context && context.trim()))]
      .slice(0, maxCount);
    
    return uniqueContexts;
  };

  // Function to highlight the target word in example sentences
  const highlightWordInSentence = (sentence, targetWord) => {
    if (!sentence || !targetWord) return sentence;
    
    // Create a regex that matches the word and its variations (case insensitive)
    const wordVariations = [
      targetWord,
      targetWord + 's',
      targetWord + 'es',
      targetWord + 'ed',
      targetWord + 'ing',
      targetWord + 'er',
      targetWord + 'est',
      targetWord + 'ly'
    ];
    
    // Also handle words that might end with common suffixes
    const baseWord = targetWord.replace(/(s|es|ed|ing|er|est|ly)$/, '');
    if (baseWord !== targetWord) {
      wordVariations.push(baseWord);
    }
    
    const pattern = new RegExp(`\\b(${wordVariations.join('|')})\\b`, 'gi');
    
    return sentence.replace(pattern, '<mark class="word-highlight">$1</mark>');
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDifficulty, selectedSubject, sortBy]);

  // Load data on component mount
  useEffect(() => {
    loadVocabularyData();
  }, [loadVocabularyData]);


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
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search words (typos allowed)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              className="test-button"
              onClick={() => setShowTest(true)}
              title="Take vocabulary test"
            >
              📝 Test
            </button>
          </div>
          <div className="search-stats">
            {filteredWords.length.toLocaleString()} words found
            {searchTerm && ` for "${searchTerm}"`}
            {searchTerm && filteredWords.length === 0 && (
              <span className="search-hint"> - Try a different spelling</span>
            )}
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
                onClick={() => setSelectedWord(word)}
              >
                <div className="vocab-card-content">
                  <div className="vocab-header">
                    <h3 className="vocab-word">{word.word}</h3>
                    <div className="vocab-meta">
                      <span className={`difficulty-badge difficulty-${word.difficulty}`}>
                        Level {word.difficulty}
                      </span>
                      <span className={`csat-frequency ${word.frequency > 2 ? 'high-frequency' : ''}`}>
                        CSAT ×{word.frequency}
                      </span>
                    </div>
                  </div>

                  {word.definition && (
                    <p className="vocab-definition">{word.definition}</p>
                  )}

                  {word.contexts && word.contexts.length > 0 && (
                    <div className="vocab-examples">
                      {getUniqueExamples(word.contexts, 4).map((context, index) => (
                        <div 
                          key={index} 
                          className="example-sentence"
                          dangerouslySetInnerHTML={{
                            __html: highlightWordInSentence(context, word.word)
                          }}
                        />
                      ))}
                    </div>
                  )}
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
        />
      )}

      {/* Vocabulary Test */}
      {showTest && (
        <SimpleVocabularyTest
          onClose={() => setShowTest(false)}
        />
      )}
    </div>
  );
};

export default EnhancedVocabularyPinterest;