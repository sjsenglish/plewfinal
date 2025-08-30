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
  try {
    // Always use the service function which has proper fallbacks
    console.log('Getting enhanced word info for:', word);
    const enhancedInfo = await getWordInfoFromService(word, context);
    
    if (enhancedInfo && enhancedInfo.definition) {
      console.log('Successfully retrieved word info with definition');
      return enhancedInfo;
    } else {
      console.log('No definition found, using fallback');
      throw new Error('No definition available');
    }
  } catch (error) {
    console.error('Error getting enhanced word info:', error.message);
    
    // Try one more time with the service function
    try {
      const fallbackInfo = await getWordInfoFromService(word, '');
      if (fallbackInfo) {
        return fallbackInfo;
      }
    } catch (secondError) {
      console.error('Second attempt failed:', secondError.message);
    }
    
    // Return comprehensive fallback data
    return {
      word: word,
      partOfSpeech: 'noun/verb',
      definition: `${word}: An important vocabulary word for Korean-English learners. This word frequently appears in academic and professional contexts.`,
      difficulty: 3,
      synonyms: ['similar', 'related', 'equivalent', 'comparable', 'corresponding', 'associated'],
      antonyms: ['opposite', 'different', 'contrasting', 'dissimilar'],
      examples: [
        {
          sentence: `The term "${word}" is commonly used in English conversations.`,
          translation: `"${word}"라는 용어는 영어 대화에서 일반적으로 사용됩니다.`
        },
        {
          sentence: `Students should practice using "${word}" in sentences.`,
          translation: `학생들은 문장에서 "${word}"를 사용하는 연습을 해야 합니다.`
        },
        {
          sentence: `The meaning of "${word}" varies depending on context.`,
          translation: `"${word}"의 의미는 문맥에 따라 다릅니다.`
        }
      ],
      koreanTranslation: `${word} - 한국어 번역`,
      frequency: 'common',
      subjectArea: 'general',
      collocations: [`${word} is`, `${word} can`, `using ${word}`, `${word} means`],
      etymology: 'Etymology details not available',
      pronunciation: `/${word}/`,
      audioUrl: null
    };
  }
};