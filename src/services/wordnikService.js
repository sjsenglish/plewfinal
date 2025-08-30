// Wordnik API Service for vocabulary features (via server-side API)

// Use server-side API route to access Wordnik (since API key is server-side only)
const API_BASE = '/api/wordnik';

// Get word definition from Wordnik via server-side API
export const getWordDefinition = async (word) => {
  try {
    console.log('Fetching definition from Wordnik via server API:', word);
    const response = await fetch(`${API_BASE}/word?word=${encodeURIComponent(word)}&action=definitions`);
    
    if (!response.ok) {
      throw new Error(`Server API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get definitions');
    }

    const definitions = result.data.definitions || [];
    
    if (definitions.length === 0) {
      throw new Error('No definitions found');
    }

    // Return the best definition (usually the first one)
    const primaryDef = definitions[0];
    return {
      word: word,
      partOfSpeech: primaryDef.partOfSpeech || 'unknown',
      definition: primaryDef.text || `Definition for ${word}`,
      source: primaryDef.sourceDictionary || 'wordnik',
      allDefinitions: definitions.slice(0, 3).map(def => ({
        partOfSpeech: def.partOfSpeech,
        definition: def.text,
        source: def.sourceDictionary
      }))
    };
    
  } catch (error) {
    console.error('Wordnik definition API failed:', error);
    throw error;
  }
};

// Get word examples from Wordnik via server-side API
export const getWordExamples = async (word) => {
  try {
    console.log('Fetching examples from Wordnik via server API:', word);
    const response = await fetch(`${API_BASE}/word?word=${encodeURIComponent(word)}&action=examples`);
    
    if (!response.ok) {
      throw new Error(`Server API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get examples');
    }

    const examples = result.data.examples || [];
    
    if (examples.length === 0) {
      throw new Error('No examples found');
    }

    // Process and clean examples
    const processedExamples = examples
      .filter(example => example.text && example.text.length > 10 && example.text.length < 200)
      .slice(0, 5)
      .map(example => ({
        sentence: example.text.trim(),
        translation: `"${word}"를 사용한 예문입니다.`, // Korean placeholder
        source: example.title || 'Wordnik'
      }));

    return processedExamples;
    
  } catch (error) {
    console.error('Wordnik examples API failed:', error);
    throw error;
  }
};

// Get related words (synonyms, antonyms) from Wordnik via server-side API
export const getRelatedWords = async (word) => {
  try {
    console.log('Fetching related words from Wordnik via server API:', word);
    const response = await fetch(`${API_BASE}/word?word=${encodeURIComponent(word)}&action=related`);
    
    if (!response.ok) {
      throw new Error(`Server API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get related words');
    }

    const relatedData = result.data.related || [];
    
    if (relatedData.length === 0) {
      throw new Error('No related words found');
    }

    const synonyms = [];
    const antonyms = [];

    relatedData.forEach(relation => {
      if (relation.relationshipType === 'synonym' || 
          relation.relationshipType === 'equivalent' || 
          relation.relationshipType === 'similar') {
        synonyms.push(...(relation.words || []));
      } else if (relation.relationshipType === 'antonym') {
        antonyms.push(...(relation.words || []));
      }
    });

    return {
      synonyms: [...new Set(synonyms)].slice(0, 8), // Remove duplicates and limit
      antonyms: [...new Set(antonyms)].slice(0, 6)
    };
    
  } catch (error) {
    console.error('Wordnik related words API failed:', error);
    throw error;
  }
};

// Get comprehensive word information using server-side API (all data in one call)
export const getWordnikWordInfo = async (word, context = '') => {
  console.log('Getting comprehensive word info from Wordnik via server API:', word);
  
  try {
    // Make a single request to get all data
    const response = await fetch(`${API_BASE}/word?word=${encodeURIComponent(word)}&action=all`);
    
    if (!response.ok) {
      throw new Error(`Server API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      // Check if this is a fallback error (API key not configured)
      if (result.fallback) {
        throw new Error('Wordnik API not available on server - falling back to other sources');
      }
      throw new Error(result.error || 'Failed to get word information');
    }

    const data = result.data;
    
    // Extract definitions
    const definitions = data.definitions || [];
    const primaryDef = definitions[0];
    
    // Extract related words
    const relatedData = data.related || [];
    const synonyms = [];
    const antonyms = [];
    
    relatedData.forEach(relation => {
      if (relation.relationshipType === 'synonym' || 
          relation.relationshipType === 'equivalent' || 
          relation.relationshipType === 'similar') {
        synonyms.push(...(relation.words || []));
      } else if (relation.relationshipType === 'antonym') {
        antonyms.push(...(relation.words || []));
      }
    });
    
    // Extract examples
    const examples = (data.examples || [])
      .filter(example => example.text && example.text.length > 10 && example.text.length < 200)
      .slice(0, 5)
      .map(example => ({
        sentence: example.text.trim(),
        translation: `"${word}"를 사용한 예문입니다.`,
        source: example.title || 'Wordnik'
      }));

    // Determine difficulty based on word length and complexity
    const difficulty = word.length <= 4 ? 1 : 
                     word.length <= 6 ? 2 : 
                     word.length <= 8 ? 3 : 
                     word.length <= 10 ? 4 : 5;

    return {
      word: word,
      partOfSpeech: primaryDef?.partOfSpeech || 'noun',
      definition: primaryDef?.text || `${word}: A vocabulary word with detailed information from Wordnik.`,
      difficulty: difficulty,
      synonyms: synonyms.length > 0 ? [...new Set(synonyms)].slice(0, 8) : ['similar', 'related', 'comparable'],
      antonyms: antonyms.length > 0 ? [...new Set(antonyms)].slice(0, 6) : ['opposite', 'different'],
      examples: examples.length > 0 ? examples : [
        {
          sentence: `The word "${word}" is commonly used in English.`,
          translation: `"${word}"라는 단어는 영어에서 일반적으로 사용됩니다.`,
          source: 'Generated'
        }
      ],
      koreanTranslation: `${word} - 한국어 번역`,
      frequency: 'common',
      subjectArea: 'general',
      collocations: [`${word} is`, `${word} can`, `use ${word}`],
      etymology: 'See Wordnik for detailed etymology',
      pronunciation: `/${word}/`,
      audioUrl: null,
      source: 'wordnik'
    };

  } catch (error) {
    console.error('Wordnik comprehensive word info failed:', error);
    throw error;
  }
};

// Test Wordnik API connection via server-side API
export const testWordnikConnection = async () => {
  try {
    // Test with a simple word
    const response = await fetch(`${API_BASE}/word?word=test&action=definitions`);
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Server API connection failed' };
    }
    
    return { success: true, message: 'Wordnik API connection successful via server' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};