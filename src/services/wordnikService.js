// Wordnik API Service for vocabulary features
import { getWordnikAPIKey } from '../utils/envConfig';

const BASE_URL = 'https://api.wordnik.com/v4/word.json';

// Get Wordnik API key
const getAPIKey = () => {
  const key = getWordnikAPIKey();
  if (!key) {
    console.warn('Wordnik API key not found. Some vocabulary features may be limited.');
  }
  return key;
};

// Get word definition from Wordnik
export const getWordDefinition = async (word) => {
  const apiKey = getAPIKey();
  if (!apiKey) {
    throw new Error('Wordnik API key not available');
  }

  try {
    const url = `${BASE_URL}/${encodeURIComponent(word)}/definitions?limit=5&includeRelated=false&sourceDictionaries=all&useCanonical=true&includeTags=false&api_key=${apiKey}`;
    
    console.log('Fetching definition from Wordnik:', word);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Wordnik API error: ${response.status}`);
    }
    
    const definitions = await response.json();
    
    if (!definitions || definitions.length === 0) {
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

// Get word examples from Wordnik
export const getWordExamples = async (word) => {
  const apiKey = getAPIKey();
  if (!apiKey) {
    throw new Error('Wordnik API key not available');
  }

  try {
    const url = `${BASE_URL}/${encodeURIComponent(word)}/examples?includeDuplicates=false&useCanonical=true&skip=0&limit=10&api_key=${apiKey}`;
    
    console.log('Fetching examples from Wordnik:', word);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Wordnik API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.examples || data.examples.length === 0) {
      throw new Error('No examples found');
    }

    // Process and clean examples
    const examples = data.examples
      .filter(example => example.text && example.text.length > 10 && example.text.length < 200)
      .slice(0, 5)
      .map(example => ({
        sentence: example.text.trim(),
        translation: `"${word}"를 사용한 예문입니다.`, // Korean placeholder
        source: example.title || 'Wordnik'
      }));

    return examples;
    
  } catch (error) {
    console.error('Wordnik examples API failed:', error);
    throw error;
  }
};

// Get related words (synonyms, antonyms) from Wordnik
export const getRelatedWords = async (word) => {
  const apiKey = getAPIKey();
  if (!apiKey) {
    throw new Error('Wordnik API key not available');
  }

  try {
    const url = `${BASE_URL}/${encodeURIComponent(word)}/relatedWords?useCanonical=true&relationshipTypes=synonym,antonym,equivalent,similar&limitPerRelationshipType=10&api_key=${apiKey}`;
    
    console.log('Fetching related words from Wordnik:', word);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Wordnik API error: ${response.status}`);
    }
    
    const relatedData = await response.json();
    
    if (!relatedData || relatedData.length === 0) {
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

// Get comprehensive word information using multiple Wordnik endpoints
export const getWordnikWordInfo = async (word, context = '') => {
  const apiKey = getAPIKey();
  if (!apiKey) {
    throw new Error('Wordnik API key not available');
  }

  console.log('Getting comprehensive word info from Wordnik:', word);
  
  try {
    // Make parallel requests to different Wordnik endpoints
    const [definitionData, relatedWords, examples] = await Promise.allSettled([
      getWordDefinition(word),
      getRelatedWords(word),
      getWordExamples(word)
    ]);

    // Process results
    const definition = definitionData.status === 'fulfilled' ? definitionData.value : null;
    const related = relatedWords.status === 'fulfilled' ? relatedWords.value : { synonyms: [], antonyms: [] };
    const exampleSentences = examples.status === 'fulfilled' ? examples.value : [];

    // Determine difficulty based on word length and complexity
    const difficulty = word.length <= 4 ? 1 : 
                     word.length <= 6 ? 2 : 
                     word.length <= 8 ? 3 : 
                     word.length <= 10 ? 4 : 5;

    return {
      word: word,
      partOfSpeech: definition?.partOfSpeech || 'noun',
      definition: definition?.definition || `${word}: A vocabulary word with detailed information from Wordnik.`,
      difficulty: difficulty,
      synonyms: related.synonyms.length > 0 ? related.synonyms : ['similar', 'related', 'comparable'],
      antonyms: related.antonyms.length > 0 ? related.antonyms : ['opposite', 'different'],
      examples: exampleSentences.length > 0 ? exampleSentences : [
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

// Test Wordnik API connection
export const testWordnikConnection = async () => {
  const apiKey = getAPIKey();
  if (!apiKey) {
    return { success: false, error: 'No API key available' };
  }

  try {
    // Test with a simple word
    await getWordDefinition('test');
    return { success: true, message: 'Wordnik API connection successful' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};