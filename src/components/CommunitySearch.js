// src/components/CommunitySearch.js
import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, limit, query as firebaseQuery } from 'firebase/firestore';
import { searchCommunityQuestions } from '../utils/pineconeClient';
import CommunityHitWrapper from './CommunityHitWrapper';
import { db } from '../firebase';

const CommunitySearch = ({ user, placeholder = "search community questions..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ nbHits: 0, processingTimeMS: 0 });
  const [displayedCount, setDisplayedCount] = useState(20); // Show 20 initially
  const [hasMore, setHasMore] = useState(false);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setStats({ nbHits: 0, processingTimeMS: 0 });
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      const searchResults = await searchCommunityQuestions(searchQuery);
      const processingTime = Date.now() - startTime;
      
      const resultsArray = Array.isArray(searchResults) ? searchResults : [];
      setResults(resultsArray);
      setDisplayedCount(20); // Reset to show first 20
      setHasMore(resultsArray.length > 20); // Check if there are more than 20 results
      setStats({ 
        nbHits: resultsArray.length, 
        processingTimeMS: processingTime 
      });
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setStats({ nbHits: 0, processingTimeMS: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load random questions using Pinecone search
  const loadRandomQuestions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use a generic search term to get results from Pinecone instead
      const searchResults = await searchCommunityQuestions('question', 100);
      
      if (!Array.isArray(searchResults) || searchResults.length === 0) {
        // Fallback: try to get from Firebase directly
        const q = firebaseQuery(collection(db, 'plewcommunity'), limit(100));
        const querySnapshot = await getDocs(q);
        
        const questions = [];
        querySnapshot.forEach((doc) => {
          questions.push({
            objectID: doc.id,
            score: 1,
            ...doc.data()
          });
        });
        
        // Safe array shuffling
        const shuffled = Array.isArray(questions) ? [...questions].sort(() => 0.5 - Math.random()) : [];
        setResults(shuffled);
        setDisplayedCount(20); // Show first 20
        setHasMore(shuffled.length > 20); // Check if there are more than 20 results
        setStats({ 
          nbHits: shuffled.length, 
          processingTimeMS: 0 
        });
      } else {
        // Shuffle Pinecone results safely
        const shuffled = [...searchResults].sort(() => 0.5 - Math.random());
        setResults(shuffled);
        setDisplayedCount(20); // Show first 20
        setHasMore(shuffled.length > 20); // Check if there are more than 20 results
        setStats({ 
          nbHits: shuffled.length, 
          processingTimeMS: 0 
        });
      }
    } catch (error) {
      console.error('Error loading random questions:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Updated useEffect for search and random loading
  useEffect(() => {
    if (!query.trim()) {
      // Load random questions when no search query
      loadRandomQuestions();
      return;
    }

    // Existing search logic for when there is a query
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch, loadRandomQuestions]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setStats({ nbHits: 0, processingTimeMS: 0 });
    setDisplayedCount(20);
    setHasMore(false);
  };

  // Load more results function
  const loadMore = () => {
    const newDisplayedCount = displayedCount + 20;
    setDisplayedCount(newDisplayedCount);
    setHasMore(newDisplayedCount < results.length);
  };

  // Updated stats text for different states
  const statsText = query.trim() 
    ? (stats.nbHits === 0 ? '🚫 No results' : `✅ ${stats.nbHits.toLocaleString()} results found in ${stats.processingTimeMS.toLocaleString()}ms`)
    : (stats.nbHits === 0 ? '' : `📝 Showing ${stats.nbHits} community questions`);

  return (
    <div className="community-search-container">
      {/* Search Input */}
      <div className="header-search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="header-searchbox community-searchbox"
          />
          {query && (
            <button onClick={handleClear} className="clear-button">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="results-container">
        <div className="stats-container">
          {loading ? (
            <div className="loading-stats">🔄 Loading...</div>
          ) : (
            <div>{statsText}</div>
          )}
        </div>
        
        <div className="hits-container">
          {user && (
            <div className="community-hits">
              {Array.isArray(results) && results.slice(0, displayedCount).map((hit) => (
                <CommunityHitWrapper key={hit.objectID} hit={hit} />
              ))}
              {results.length === 0 && query && !loading && (
                <div className="no-results">
                  <p>No community questions found for "{query}"</p>
                  <p>Try different keywords like "personal statement", "interviews", or "applications"</p>
                </div>
              )}
              {results.length === 0 && !query && !loading && (
                <div className="no-results">
                  <p>No questions available yet. Check back soon!</p>
                  <p>In the meantime, try submitting a question to get started.</p>
                </div>
              )}
              
              {/* Load More Button */}
              {hasMore && results.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px' }}>
                  <button
                    onClick={loadMore}
                    style={{
                      backgroundColor: '#00ced1',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#00b5b8'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#00ced1'}
                  >
                    Load More Questions ({results.length - displayedCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunitySearch;