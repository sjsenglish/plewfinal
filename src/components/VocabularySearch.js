import React, { useState, useEffect, useCallback } from 'react';
import { fetchVocabulary } from '../services/vocabularyAPIService';
import VocabularyFilters from './VocabularyFilters';
import VocabularyHit from './VocabularyHit';
import './VocabularySearch.css';

const VocabularySearch = ({ bannerText }) => {
  const [vocabularyWords, setVocabularyWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });
  const [filters, setFilters] = useState({
    sortBy: 'frequency',
    subjectArea: 'all',
    minFrequency: 1,
    search: null
  });

  // Fetch vocabulary from API
  const loadVocabulary = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading vocabulary from API with options:', options);
      
      const result = await fetchVocabulary({
        ...filters,
        ...options
      });

      if (result.success) {
        setVocabularyWords(result.words);
        setPagination(result.pagination);
        console.log('Loaded vocabulary:', result.words.length, 'words');
      } else {
        setError(result.error);
        console.error('Failed to load vocabulary:', result.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading vocabulary:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load initial vocabulary on component mount
  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);

  // Handle sorting changes
  const handleSortChange = useCallback((newSortBy) => {
    const newFilters = { ...filters, sortBy: newSortBy };
    setFilters(newFilters);
    loadVocabulary({ sortBy: newSortBy, offset: 0 });
  }, [filters, loadVocabulary]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, offset: 0 };
    setFilters(updatedFilters);
    loadVocabulary(updatedFilters);
  }, [filters, loadVocabulary]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      const newOffset = pagination.offset + pagination.limit;
      loadVocabulary({ offset: newOffset });
    }
  }, [pagination, loading, loadVocabulary]);

  return (
    <div className="vocabulary-search-container">
      {/* Search Header */}
      <div className="search-header">
        <h1 className="search-title">Vocabulary Learning</h1>
        <p className="search-subtitle">{bannerText}</p>
      </div>

      {/* Search Stats */}
      <div className="search-stats">
        <p>Found {pagination.total} vocabulary words (pre-computed from questions database)</p>
      </div>

      {/* Vocabulary Filters */}
      <VocabularyFilters
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        currentFilters={filters}
        sortBy={filters.sortBy}
      />

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading vocabulary from database...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state" style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '1rem', 
          borderRadius: '8px', 
          margin: '1rem 0' 
        }}>
          <h3>Error Loading Vocabulary</h3>
          <p>{error}</p>
          <button onClick={() => loadVocabulary()} style={{
            background: '#ff6b35',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Retry
          </button>
        </div>
      )}

      {/* Debug Info */}
      <div style={{ padding: '10px', background: '#f0f0f0', margin: '10px 0', fontSize: '12px' }}>
        <p>API Info:</p>
        <p>Loading: {loading.toString()}</p>
        <p>Vocabulary Words: {vocabularyWords.length}</p>
        <p>Total Available: {pagination.total}</p>
        <p>Current Filters: {JSON.stringify(filters)}</p>
        <p>Has More: {pagination.hasMore.toString()}</p>
      </div>

      {/* Vocabulary Results */}
      <div className="vocabulary-results">
        {vocabularyWords.length > 0 ? (
          <div className="vocabulary-grid">
            {vocabularyWords.map((word, index) => (
              <VocabularyHit key={`${word.word || word.id}-${index}`} hit={word} />
            ))}
            
            {pagination.hasMore && (
              <div className="load-more-container">
                <p>Showing {vocabularyWords.length} of {pagination.total} vocabulary words</p>
                <button 
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Words'}
                </button>
              </div>
            )}
          </div>
        ) : (
          !loading && !error && (
            <div className="no-results">
              <h3>No vocabulary words found</h3>
              <p>No vocabulary words match your current filters.</p>
              <p>Try adjusting your search criteria or check if the vocabulary database has been populated.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default VocabularySearch;