// src/services/vocabularyAPIService.js - Client-side service for fetching pre-computed vocabulary
import { getOpenAIKey, getWordnikAPIKey } from '../utils/envConfig';
import { getEnhancedWordInfo as getWordInfoFromService } from './vocabularyService';
import { testWordnikConnection } from './wordnikService';

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


// Enhanced word information with Wordnik integration
export const getEnhancedWordInfo = async (word, context = '') => {
  const wordnikKey = getWordnikAPIKey();
  
  console.log(`Getting enhanced word info for: ${word} (Wordnik available: ${!!wordnikKey})`);
  
  try {
    // Use the service function which now prioritizes Wordnik -> Free Dictionary -> OpenAI
    const enhancedInfo = await getWordInfoFromService(word, context);
    
    if (enhancedInfo && enhancedInfo.definition) {
      console.log(`Successfully retrieved word info from ${enhancedInfo.source || 'unknown source'}`);
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
    
    // Return comprehensive fallback data with better content
    return {
      word: word,
      partOfSpeech: 'noun/verb',
      definition: `${word}: An important vocabulary word for Korean-English learners. This word frequently appears in academic and professional contexts and is essential for building strong English proficiency.`,
      difficulty: Math.min(Math.max(Math.floor(word.length / 2), 1), 5),
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
          sentence: `Understanding "${word}" will improve your English vocabulary.`,
          translation: `"${word}"를 이해하면 영어 어휘력이 향상됩니다.`
        }
      ],
      koreanTranslation: `${word} - 한국어 번역`,
      frequency: 'common',
      subjectArea: 'general',
      collocations: [`${word} is`, `${word} can be`, `using ${word}`, `${word} means`],
      etymology: 'Etymology details not available - connect Wordnik API for detailed word origins',
      pronunciation: `/${word}/`,
      audioUrl: null,
      source: 'fallback'
    };
  }
};

// Test vocabulary services connection
export const testVocabularyServices = async () => {
  const results = {
    wordnik: { available: false, tested: false },
    openai: { available: false, tested: false }
  };
  
  // Test Wordnik
  const wordnikKey = getWordnikAPIKey();
  results.wordnik.available = !!wordnikKey;
  if (wordnikKey) {
    try {
      const wordnikTest = await testWordnikConnection();
      results.wordnik.tested = wordnikTest.success;
      results.wordnik.message = wordnikTest.message || wordnikTest.error;
    } catch (error) {
      results.wordnik.tested = false;
      results.wordnik.message = error.message;
    }
  }
  
  // Test OpenAI
  const openaiKey = getOpenAIKey();
  results.openai.available = !!openaiKey;
  
  return results;
};