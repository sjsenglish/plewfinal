/**
 * Vocabulary Service V2 - Updated to use pre-extracted vocabulary data
 * 
 * This service replaces the real-time search approach with efficient 
 * database queries against pre-extracted vocabulary data.
 */

import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';

class VocabularyService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch vocabulary words with filtering and pagination
   */
  async fetchVocabulary(options = {}) {
    const {
      limit: limitCount = 20,
      offset = 0,
      sortBy = 'frequency', // frequency, alphabetical, difficulty, rank
      subjectArea = 'all',
      minFrequency = 1,
      maxFrequency = null,
      difficulty = null,
      search = null,
      startAfterDoc = null
    } = options;

    try {
      console.log('📚 Fetching vocabulary with options:', options);

      let q = collection(db, 'vocabulary_words');
      const constraints = [];

      // Apply filters
      if (subjectArea !== 'all') {
        constraints.push(where('subjectAreas', 'array-contains', subjectArea));
      }

      if (minFrequency > 1) {
        constraints.push(where('frequency', '>=', minFrequency));
      }

      if (maxFrequency) {
        constraints.push(where('frequency', '<=', maxFrequency));
      }

      if (difficulty) {
        constraints.push(where('difficulty', '==', parseInt(difficulty)));
      }

      // Apply sorting
      switch (sortBy) {
        case 'frequency':
          constraints.push(orderBy('frequency', 'desc'));
          break;
        case 'alphabetical':
          constraints.push(orderBy('word', 'asc'));
          break;
        case 'difficulty':
          constraints.push(orderBy('difficulty', 'desc'));
          break;
        case 'rank':
          constraints.push(orderBy('rank', 'asc'));
          break;
        default:
          constraints.push(orderBy('frequency', 'desc'));
      }

      // Apply pagination
      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }
      
      constraints.push(limit(limitCount));

      // Build and execute query
      q = query(q, ...constraints);
      const snapshot = await getDocs(q);
      
      let words = [];
      snapshot.forEach(doc => {
        words.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Apply text search filter if provided (client-side for simplicity)
      if (search && search.trim()) {
        const searchTerm = search.toLowerCase().trim();
        words = words.filter(word => 
          word.word.toLowerCase().includes(searchTerm) ||
          (word.definition && word.definition.toLowerCase().includes(searchTerm)) ||
          (word.examples && word.examples.some(ex => 
            ex.toLowerCase().includes(searchTerm)
          ))
        );
      }

      // Apply offset (client-side pagination)
      if (offset > 0) {
        words = words.slice(offset);
      }

      console.log(`📚 Retrieved ${words.length} vocabulary words`);

      return {
        success: true,
        words: words,
        pagination: {
          total: words.length,
          limit: limitCount,
          offset: offset,
          hasMore: words.length === limitCount,
          lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
        },
        filters: {
          sortBy,
          subjectArea,
          minFrequency,
          search
        }
      };

    } catch (error) {
      console.error('❌ Error fetching vocabulary:', error);
      return {
        success: false,
        error: error.message,
        words: [],
        pagination: { total: 0, limit: limitCount, offset, hasMore: false },
        filters: { sortBy, subjectArea, minFrequency, search }
      };
    }
  }

  /**
   * Get detailed information about a specific word including all examples
   */
  async getWordDetails(word) {
    try {
      const cacheKey = `word_details_${word}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      console.log(`🔍 Fetching detailed info for word: ${word}`);

      // Get basic word info
      const wordDoc = await getDoc(doc(db, 'vocabulary_words', word));
      if (!wordDoc.exists()) {
        throw new Error(`Word "${word}" not found in vocabulary database`);
      }

      const wordData = { id: wordDoc.id, ...wordDoc.data() };

      // Get detailed examples
      const examplesDoc = await getDoc(doc(db, 'vocabulary_examples', word));
      let examples = [];
      if (examplesDoc.exists()) {
        examples = examplesDoc.data().examples || [];
      }

      const result = {
        ...wordData,
        detailedExamples: examples,
        hasDetailedExamples: examples.length > 0
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error(`❌ Error fetching word details for "${word}":`, error);
      throw error;
    }
  }

  /**
   * Search for words by text query
   */
  async searchWords(searchTerm, options = {}) {
    const {
      limit: limitCount = 50,
      sortBy = 'frequency'
    } = options;

    try {
      console.log(`🔍 Searching for words: "${searchTerm}"`);

      // For now, we'll fetch a larger set and filter client-side
      // In production, you might want to use Algolia or full-text search
      const searchOptions = {
        limit: Math.max(limitCount * 3, 100), // Fetch more to account for filtering
        sortBy,
        search: searchTerm
      };

      const result = await this.fetchVocabulary(searchOptions);
      
      // Limit results to requested amount
      if (result.words.length > limitCount) {
        result.words = result.words.slice(0, limitCount);
      }

      return result;

    } catch (error) {
      console.error(`❌ Error searching words for "${searchTerm}":`, error);
      return {
        success: false,
        error: error.message,
        words: [],
        pagination: { total: 0, limit: limitCount, offset: 0, hasMore: false }
      };
    }
  }

  /**
   * Get vocabulary statistics
   */
  async getVocabularyStats() {
    try {
      const cacheKey = 'vocabulary_stats';
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      console.log('📊 Fetching vocabulary statistics...');

      // Get latest extraction metadata
      const metadataQuery = query(
        collection(db, 'extraction_metadata'),
        where('status', '==', 'completed'),
        orderBy('endTime', 'desc'),
        limit(1)
      );

      const metadataSnapshot = await getDocs(metadataQuery);
      let stats = {
        totalWords: 0,
        totalQuestions: 0,
        lastExtraction: null,
        avgWordsPerQuestion: 0,
        topFrequency: 0
      };

      if (!metadataSnapshot.empty) {
        const latestExtraction = metadataSnapshot.docs[0].data();
        stats = {
          totalWords: latestExtraction.statistics?.storedWords || 0,
          totalQuestions: latestExtraction.statistics?.totalQuestions || 0,
          lastExtraction: latestExtraction.endTime?.toDate() || null,
          avgWordsPerQuestion: latestExtraction.statistics?.avgWordsPerQuestion || 0,
          topFrequency: latestExtraction.statistics?.topFrequency || 0,
          extractionId: latestExtraction.extractionId
        };
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;

    } catch (error) {
      console.error('❌ Error fetching vocabulary stats:', error);
      return {
        totalWords: 0,
        totalQuestions: 0,
        lastExtraction: null,
        avgWordsPerQuestion: 0,
        topFrequency: 0
      };
    }
  }

  /**
   * Get words by difficulty level
   */
  async getWordsByDifficulty(difficultyLevel, limitCount = 20) {
    return this.fetchVocabulary({
      difficulty: difficultyLevel,
      limit: limitCount,
      sortBy: 'frequency'
    });
  }

  /**
   * Get words by frequency range
   */
  async getWordsByFrequency(minFreq, maxFreq = null, limitCount = 20) {
    return this.fetchVocabulary({
      minFrequency: minFreq,
      maxFrequency: maxFreq,
      limit: limitCount,
      sortBy: 'frequency'
    });
  }

  /**
   * Get random words for practice
   */
  async getRandomWords(count = 10, options = {}) {
    try {
      // Fetch a larger set and randomly sample
      const fetchOptions = {
        limit: Math.max(count * 5, 100),
        sortBy: 'frequency',
        ...options
      };

      const result = await this.fetchVocabulary(fetchOptions);
      
      if (result.success && result.words.length > 0) {
        // Randomly shuffle and take requested count
        const shuffled = result.words.sort(() => 0.5 - Math.random());
        result.words = shuffled.slice(0, count);
      }

      return result;

    } catch (error) {
      console.error('❌ Error fetching random words:', error);
      return {
        success: false,
        error: error.message,
        words: [],
        pagination: { total: 0, limit: count, offset: 0, hasMore: false }
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Vocabulary service cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create and export singleton instance
const vocabularyService = new VocabularyService();
export default vocabularyService;

// Export individual methods for backward compatibility
export const fetchVocabulary = (options) => vocabularyService.fetchVocabulary(options);
export const getWordDetails = (word) => vocabularyService.getWordDetails(word);
export const searchWords = (searchTerm, options) => vocabularyService.searchWords(searchTerm, options);
export const getVocabularyStats = () => vocabularyService.getVocabularyStats();
export const getWordsByDifficulty = (level, limit) => vocabularyService.getWordsByDifficulty(level, limit);
export const getWordsByFrequency = (min, max, limit) => vocabularyService.getWordsByFrequency(min, max, limit);
export const getRandomWords = (count, options) => vocabularyService.getRandomWords(count, options);