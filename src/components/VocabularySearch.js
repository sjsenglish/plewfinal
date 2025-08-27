import React, { useState, useEffect, useCallback } from 'react';
import { InstantSearch, Stats, Configure } from 'react-instantsearch';
import { extractVocabularyFromQuestions, sortWords } from '../services/vocabularyService';
import CustomSearchBox from './CustomSearchBox';
import VocabularyFilters from './VocabularyFilters';
import VocabularyHit from './VocabularyHit';
import './VocabularySearch.css';

const VocabularySearch = ({ searchClient, subjectConfig, bannerText, user }) => {
  const [vocabularyWords, setVocabularyWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('frequency');
  const [filters, setFilters] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Extract vocabulary from search results
  const extractVocabulary = useCallback(async (hits) => {
    if (!hits || hits.length === 0) return;
    
    setLoading(true);
    try {
      console.log('Extracting vocabulary from', hits.length, 'questions');
      const words = await extractVocabularyFromQuestions(hits);
      console.log('Extracted', words.length, 'unique words');
      
      setVocabularyWords(words);
      setFilteredWords(sortWords(words, sortBy));
    } catch (error) {
      console.error('Error extracting vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  // Handle search results from Algolia
  const handleSearchResults = useCallback((hits) => {
    if (hits && hits.length > 0) {
      extractVocabulary(hits);
    }
  }, [extractVocabulary]);

  // Initialize with empty search to get all questions
  useEffect(() => {
    if (!isInitialized) {
      // Trigger initial load - this will be handled by the search component
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Handle sorting changes
  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);
    const sorted = sortWords(filteredWords, newSortBy);
    setFilteredWords(sorted);
  }, [filteredWords]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // Apply filters to vocabulary words
    let filtered = [...vocabularyWords];
    
    // Apply difficulty filter
    if (newFilters.difficulty) {
      filtered = filtered.filter(word => {
        const difficulty = word.difficulty || 3;
        switch (newFilters.difficulty) {
          case 'beginner':
            return difficulty <= 2;
          case 'intermediate':
            return difficulty === 3;
          case 'advanced':
            return difficulty >= 4;
          default:
            return true;
        }
      });
    }
    
    // Apply part of speech filter
    if (newFilters.partOfSpeech) {
      filtered = filtered.filter(word => 
        (word.partOfSpeech || '').toLowerCase() === newFilters.partOfSpeech
      );
    }
    
    // Apply frequency filter
    if (newFilters.frequency) {
      filtered = filtered.filter(word => 
        (word.frequency || 'common') === newFilters.frequency
      );
    }
    
    // Apply subject area filter
    if (newFilters.subjectArea) {
      filtered = filtered.filter(word => 
        (word.subjectArea || 'general') === newFilters.subjectArea
      );
    }
    
    // Sort the filtered results
    const sorted = sortWords(filtered, sortBy);
    setFilteredWords(sorted);
  }, [vocabularyWords, sortBy]);

  // Custom Hits component that triggers vocabulary extraction
  const VocabularyHits = ({ hits }) => {
    // Store hits and trigger extraction when they change
    useEffect(() => {
      if (hits && hits.length > 0) {
        handleSearchResults(hits);
      }
    }, [hits]);

    // Don't render the actual question hits, we'll render vocabulary words instead
    return null;
  };

  return (
    <div className="vocabulary-search-container">
      {/* Search Header */}
      <div className="search-header">
        <h1 className="search-title">Vocabulary Learning</h1>
        <p className="search-subtitle">{bannerText}</p>
      </div>

      {/* InstantSearch wrapper for getting question data */}
      <InstantSearch searchClient={searchClient} indexName={subjectConfig.index}>
        <Configure hitsPerPage={500} />
        
        {/* Hidden search box to get all questions */}
        <div style={{ display: 'none' }}>
          <CustomSearchBox 
            placeholder="Loading vocabulary..."
            defaultQuery=""
          />
          <VocabularyHits />
        </div>
        
        {/* Search Stats */}
        <div className="search-stats">
          <Stats 
            translations={{
              stats: (nbHits, processingTime) => 
                `Found ${vocabularyWords.length} vocabulary words from ${nbHits} questions (${processingTime}ms)`
            }}
          />
        </div>
      </InstantSearch>

      {/* Vocabulary Filters */}
      <VocabularyFilters
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        currentFilters={filters}
        sortBy={sortBy}
      />

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Extracting vocabulary from questions...</p>
        </div>
      )}

      {/* Vocabulary Results */}
      <div className="vocabulary-results">
        {filteredWords.length > 0 ? (
          <div className="vocabulary-grid">
            {filteredWords.slice(0, 50).map((word, index) => (
              <VocabularyHit key={`${word.word}-${index}`} hit={word} />
            ))}
            
            {filteredWords.length > 50 && (
              <div className="load-more-container">
                <p>Showing first 50 words out of {filteredWords.length} total</p>
                <button className="load-more-btn">
                  Load More Words
                </button>
              </div>
            )}
          </div>
        ) : (
          !loading && vocabularyWords.length === 0 && (
            <div className="no-results">
              <h3>No vocabulary words found</h3>
              <p>Try adjusting your filters or check your search index.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default VocabularySearch;