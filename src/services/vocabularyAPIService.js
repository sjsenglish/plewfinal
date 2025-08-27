// src/services/vocabularyAPIService.js - Client-side service for fetching pre-computed vocabulary
import { getOpenAIKey } from '../utils/envConfig';
import { getEnhancedWordInfo as getWordInfoFromService } from './vocabularyService';

// Fetch pre-computed vocabulary from server
export const fetchVocabulary = async (options = {}) => {
  const {
    limit = 20,
    offset = 0,
    sortBy = 'frequency',
    subjectArea = 'all',
    minFrequency = 1,
    search = null
  } = options;

  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      sortBy,
      subjectArea,
      minFrequency: minFrequency.toString()
    });

    if (search) {
      params.append('search', search);
    }

    console.log('Fetching vocabulary from API with params:', params.toString());

    const response = await fetch(`/api/vocabulary/fetch?${params}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch vocabulary');
    }

    console.log('Fetched vocabulary:', result.data.length, 'words');
    
    return {
      success: true,
      words: result.data,
      pagination: result.pagination,
      filters: result.filters
    };

  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    
    // Return fallback data structure
    return {
      success: false,
      error: error.message,
      words: [],
      pagination: { total: 0, limit, offset, hasMore: false },
      filters: { sortBy, subjectArea, minFrequency, search }
    };
  }
};

// Trigger vocabulary extraction for new questions (called when questions are added)
export const extractVocabularyForQuestion = async (questionData) => {
  try {
    console.log('Triggering vocabulary extraction for question:', questionData.objectID || questionData.id);

    const response = await fetch('/api/vocabulary/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionData,
        batchProcess: false
      })
    });

    if (!response.ok) {
      throw new Error(`Extraction API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to extract vocabulary');
    }

    console.log('Vocabulary extraction completed:', result.extractedWords, 'words processed');
    
    return {
      success: true,
      extractedWords: result.extractedWords
    };

  } catch (error) {
    console.error('Error extracting vocabulary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Batch process existing questions (for initial setup/migration)
export const batchProcessVocabulary = async (questionsData) => {
  try {
    console.log('Starting batch vocabulary processing for', questionsData.length, 'questions');

    const response = await fetch('/api/vocabulary/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionData: questionsData,
        batchProcess: true
      })
    });

    if (!response.ok) {
      throw new Error(`Batch processing API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to batch process vocabulary');
    }

    console.log('Batch vocabulary processing completed:', result.vocabularyWords, 'unique words from', result.processed, 'questions');
    
    return {
      success: true,
      processed: result.processed,
      vocabularyWords: result.vocabularyWords,
      message: result.message
    };

  } catch (error) {
    console.error('Error in batch vocabulary processing:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced word information (keep this for individual word details)
export const getEnhancedWordInfo = async (word, context = '') => {
  const apiKey = getOpenAIKey();
  
  if (!apiKey) {
    console.warn(`No OpenAI API key available. Using fallback data for word: ${word}`);
    return {
      word: word,
      partOfSpeech: 'unknown',
      definition: 'OpenAI API key required for enhanced definitions',
      difficulty: 3,
      synonyms: ['similar', 'equivalent', 'comparable'],
      antonyms: [],
      examples: [
        {"sentence": `This is an example with the word ${word}.`, "translation": "이것은 단어를 사용한 예시입니다."}
      ],
      koreanTranslation: '번역을 위해 OpenAI API 키가 필요합니다',
      frequency: 'common',
      subjectArea: 'general',
      collocations: [],
      etymology: ''
    };
  }

  try {
    // Use client-side OpenAI service for word analysis
    console.log('Getting enhanced word info for:', word);
    const enhancedInfo = await getWordInfoFromService(word, context);
    
    if (enhancedInfo && enhancedInfo.definition) {
      return enhancedInfo;
    } else {
      throw new Error('OpenAI analysis failed');
    }
  } catch (error) {
    console.error('Error getting enhanced word info:', error);
    // Return basic fallback data
    return {
      word: word,
      partOfSpeech: 'unknown',
      definition: 'Definition not available - API error',
      difficulty: 3,
      synonyms: ['similar', 'equivalent', 'comparable'],
      antonyms: [],
      examples: [
        {"sentence": `This is an example with the word ${word}.`, "translation": "이것은 단어를 사용한 예시입니다."}
      ],
      koreanTranslation: 'API 오류로 번역 불가능',
      frequency: 'common',
      subjectArea: 'general',
      collocations: [],
      etymology: ''
    };
  }
};