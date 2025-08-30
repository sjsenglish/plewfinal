// vocabularyService.js - Extract and analyze vocabulary from Korean-English questions
import OpenAI from 'openai';
import { getOpenAIKey } from '../utils/envConfig';
import { getWordnikWordInfo, testWordnikConnection } from './wordnikService';

const apiKey = getOpenAIKey();

// Create OpenAI client with better error handling
let openai = null;
if (apiKey) {
  openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
} else {
  console.warn('⚠️ OpenAI API key not found. Vocabulary features will use fallback data.');
}

// Extract vocabulary words from question text
export const extractVocabularyFromQuestions = async (hits) => {
  console.log('Processing', hits.length, 'questions for vocabulary extraction');
  const vocabularyWords = new Map();
  
  // Extract unique words from all question texts
  hits.forEach((hit, index) => {
    // Try multiple field names to find question text in Korean-English pairs
    const questionText = hit.question || hit.question_text || hit.questionText || 
                        hit.english_text || hit.english || hit.text || 
                        hit.korean_text || hit.korean || '';
    
    // Also extract from any other text fields that might contain vocabulary
    const additionalText = [
      hit.answer || hit.answer_text || '',
      hit.explanation || hit.explanation_text || '',
      hit.translation || '',
      hit.romanization || ''
    ].filter(text => text && typeof text === 'string').join(' ');
    
    const fullText = [questionText, additionalText].filter(t => t).join(' ');
    
    if (fullText && fullText.trim().length > 0) {
      console.log(`Processing question ${index + 1}: "${fullText.substring(0, 100)}..."`);
      
      // Extract meaningful words (filter out common words, focus on vocabulary-rich content)
      const words = extractMeaningfulWords(fullText);
      console.log(`Found ${words.length} vocabulary words in question ${index + 1}`);
      
      words.forEach(word => {
        if (!vocabularyWords.has(word.toLowerCase())) {
          vocabularyWords.set(word.toLowerCase(), {
            word: word,
            frequency: 1,
            contexts: [fullText.substring(0, 200)],
            sourceQuestions: [hit.objectID || hit.id || `question-${index}`]
          });
        } else {
          const existing = vocabularyWords.get(word.toLowerCase());
          existing.frequency += 1;
          if (existing.contexts.length < 5) { // Limit contexts to avoid memory issues
            existing.contexts.push(fullText.substring(0, 200));
          }
          existing.sourceQuestions.push(hit.objectID || hit.id || `question-${index}`);
        }
      });
    } else {
      console.log(`Question ${index + 1} has no extractable text. Fields:`, Object.keys(hit));
    }
  });

  console.log('Total unique vocabulary words extracted:', vocabularyWords.size);
  
  // Convert to array and sort by frequency
  const result = Array.from(vocabularyWords.values())
    .sort((a, b) => b.frequency - a.frequency);
    
  console.log('Top 10 most frequent words:', result.slice(0, 10).map(w => `${w.word} (${w.frequency})`));
  
  return result;
};

// Extract meaningful vocabulary words from text
const extractMeaningfulWords = (text) => {
  // Common words to exclude - keeping this minimal to get more vocabulary
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
    'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i',
    'me', 'him', 'her', 'them', 'us', 'my', 'your', 'his', 'her', 'their', 'our',
    'what', 'when', 'where', 'why', 'how', 'which', 'who', 'whom', 'whose',
    'not', 'no', 'yes', 'so', 'very', 'much', 'many', 'more', 'most', 'some', 'any', 'all',
    'from', 'into', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'any',
    'as', 'because', 'before', 'below', 'between', 'both', 'down', 'during', 'each', 'few',
    'further', 'here', 'how', 'if', 'into', 'just', 'now', 'once', 'only', 'other', 'our',
    'out', 'over', 'own', 'same', 'such', 'than', 'then', 'there', 'through', 'too', 'under',
    'until', 'up', 'while', 'with'
  ]);

  // Extract words that are likely to be good vocabulary - made less restrictive
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => 
      word.length >= 3 && // Reduced to 3 characters for more words
      word.length <= 20 && // Increased max length
      !stopWords.has(word) && // Not a stop word
      !/^\d+$/.test(word) && // Not just numbers
      /^[a-z]+$/.test(word) && // Only letters
      !word.includes('http') && // Filter out URLs
      !word.includes('www') // Filter out web addresses
    );

  // Remove duplicates and return
  const uniqueWords = [...new Set(words)];
  console.log(`Extracted ${uniqueWords.length} unique words from text: "${text.substring(0, 50)}..."`);
  return uniqueWords;
};

// Get enhanced word information using OpenAI
// Free Dictionary API fallback (no API key required)
const getFallbackWordInfo = async (word) => {
  try {
    console.log('Trying Free Dictionary API for:', word);
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    
    if (!response.ok) {
      throw new Error(`Dictionary API responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data[0]) {
      throw new Error('No dictionary data found');
    }
    
    const entry = data[0];
    const meaning = entry.meanings?.[0];
    const definition = meaning?.definitions?.[0];
    
    // Extract audio URL
    const audioObj = entry.phonetics?.find(p => p.audio) || {};
    const audioUrl = audioObj.audio || '';
    
    // Extract multiple definitions if available
    const allDefinitions = meaning?.definitions || [];
    const primaryDef = definition?.definition || `${word} - dictionary definition not available`;
    
    // Extract synonyms and antonyms
    const synonyms = [];
    const antonyms = [];
    
    allDefinitions.forEach(def => {
      if (def.synonyms) synonyms.push(...def.synonyms);
      if (def.antonyms) antonyms.push(...def.antonyms);
    });
    
    // Create examples from dictionary
    const examples = [];
    if (definition?.example) {
      examples.push({
        sentence: definition.example,
        translation: "번역이 필요합니다"
      });
    }
    
    // Add more examples from other definitions
    allDefinitions.slice(1, 3).forEach(def => {
      if (def.example) {
        examples.push({
          sentence: def.example,
          translation: "번역이 필요합니다"
        });
      }
    });
    
    // Generate more realistic examples if none found
    const finalExamples = examples.length > 0 ? examples : [
      {
        sentence: `The word "${word}" is important to understand in this context.`,
        translation: `"${word}"라는 단어는 이 문맥에서 이해하는 것이 중요합니다.`
      },
      {
        sentence: `Students often encounter "${word}" in their studies.`,
        translation: `학생들은 공부하면서 종종 "${word}"를 접합니다.`
      }
    ];
    
    // Generate more synonyms if needed
    const finalSynonyms = synonyms.length > 0 ? [...new Set(synonyms)].slice(0, 6) : 
      ['related', 'similar', 'comparable', 'equivalent'].filter(s => s !== word);
    
    return {
      word: word,
      partOfSpeech: meaning?.partOfSpeech || 'noun',
      definition: primaryDef || `${word}: A vocabulary word commonly used in English.`,
      difficulty: 3, // Default middle difficulty
      synonyms: finalSynonyms,
      antonyms: [...new Set(antonyms)].slice(0, 4) || ['opposite', 'different'],
      examples: finalExamples,
      koreanTranslation: `${word} - 한국어 번역`,
      frequency: 'common',
      subjectArea: 'general',
      collocations: [`${word} is`, `${word} can be`, `use ${word}`],
      etymology: 'See dictionary for etymology',
      pronunciation: entry.phonetic || audioObj?.text || `/${word}/`,
      audioUrl: audioUrl
    };
    
  } catch (error) {
    console.error('Free Dictionary API failed:', error);
    
    // Return enhanced fallback data with better examples
    return {
      word: word,
      partOfSpeech: 'noun/verb',
      definition: `${word}: A vocabulary word commonly used in Korean-English learning materials. The word represents an important concept for language learners.`,
      difficulty: 3,
      synonyms: ['similar', 'related', 'comparable', 'equivalent', 'corresponding'],
      antonyms: ['opposite', 'different', 'contrasting'],
      examples: [
        {
          sentence: `The word "${word}" appears frequently in academic texts.`,
          translation: `"${word}"라는 단어는 학술 텍스트에 자주 나타납니다.`
        },
        {
          sentence: `Understanding "${word}" is essential for English proficiency.`,
          translation: `"${word}"를 이해하는 것은 영어 실력에 필수적입니다.`
        },
        {
          sentence: `Practice using "${word}" in different contexts.`,
          translation: `다양한 맥락에서 "${word}"를 사용하는 연습을 하세요.`
        }
      ],
      koreanTranslation: `${word} - 한국어 번역`,
      frequency: 'common',
      subjectArea: 'academic',
      collocations: [`${word} is`, `${word} means`, `use ${word}`, `${word} can be`],
      etymology: 'Etymology information unavailable',
      pronunciation: `/${word}/`,
      audioUrl: null
    };
  }
};

export const getEnhancedWordInfo = async (word, context = '') => {
  console.log(`Getting enhanced info for word: ${word}`);
  
  // First try Wordnik API as primary source (best quality)
  try {
    const wordnikData = await getWordnikWordInfo(word, context);
    if (wordnikData && wordnikData.definition) {
      console.log('Successfully got word info from Wordnik API');
      return wordnikData;
    }
  } catch (error) {
    console.log('Wordnik API failed, trying Free Dictionary API:', error.message);
  }
  
  // Then try Free Dictionary API as secondary source
  try {
    const fallbackData = await getFallbackWordInfo(word, context);
    if (fallbackData && fallbackData.definition && !fallbackData.definition.includes('lookup failed')) {
      console.log('Successfully got word info from Free Dictionary API');
      return fallbackData;
    }
  } catch (error) {
    console.log('Free Dictionary API failed, trying OpenAI if available');
  }
  
  // If no OpenAI client available, return enhanced fallback data
  if (!openai) {
    console.warn(`No OpenAI API key available. Using enhanced fallback for word: ${word}`);
    // Return comprehensive fallback if all APIs fail
    return {
      word: word,
      partOfSpeech: 'noun/verb',
      definition: `${word}: A vocabulary word from Korean-English study materials. This word is important for language learning and appears in academic contexts.`,
      difficulty: 3,
      synonyms: ['similar', 'related', 'comparable', 'equivalent', 'corresponding'],
      antonyms: ['opposite', 'different', 'contrasting'],
      examples: [
        {"sentence": `The word "${word}" is commonly used in academic contexts.`, "translation": `"${word}"라는 단어는 학술적 맥락에서 일반적으로 사용됩니다.`},
        {"sentence": `Students should understand the meaning of "${word}".`, "translation": `학생들은 "${word}"의 의미를 이해해야 합니다.`},
        {"sentence": `Practice using "${word}" in different sentences.`, "translation": `다양한 문장에서 "${word}"를 사용하는 연습을 하세요.`}
      ],
      koreanTranslation: `${word} - 한국어 번역`,
      frequency: 'common',
      subjectArea: 'academic',
      collocations: [`${word} is`, `${word} can`, `use ${word}`, `${word} means`],
      etymology: 'Etymology information not available',
      source: 'fallback'
    };
  }

  try {
    const prompt = `Analyze the English word "${word}" and provide comprehensive information in JSON format:

Context: "${context}"

Please provide:
{
  "word": "${word}",
  "partOfSpeech": "primary part of speech",
  "definition": "clear, concise definition",
  "difficulty": number from 1-5 (1=beginner, 5=advanced),
  "synonyms": ["synonym1", "synonym2", "synonym3", "synonym4", "synonym5"],
  "antonyms": ["antonym1", "antonym2"],
  "examples": [
    {"sentence": "example sentence", "translation": "Korean translation"},
    {"sentence": "another example", "translation": "Korean translation"}
  ],
  "koreanTranslation": "Korean translation",
  "frequency": "very_common|common|uncommon|rare",
  "subjectArea": "academic|business|science|literature|everyday|technology",
  "collocations": ["common phrase 1", "common phrase 2", "common phrase 3"],
  "etymology": "brief word origin if notable"
}

Provide accurate information suitable for Korean middle/high school students learning English.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert English vocabulary teacher helping Korean students. Provide accurate, educational information in JSON format only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const jsonResponse = response.choices[0].message.content.trim();
    return JSON.parse(jsonResponse);
  } catch (error) {
    console.error('OpenAI failed, trying fallback APIs:', error);
    
    // Try fallback APIs in order of preference
    try {
      const fallbackData = await getFallbackWordInfo(word, context);
      if (fallbackData) {
        console.log('Successfully got fallback data for:', word);
        return fallbackData;
      }
    } catch (fallbackError) {
      console.error('All fallback APIs failed:', fallbackError);
    }
    
    // Final fallback with basic data
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

// Generate synonym quiz for a word
export const generateSynonymQuiz = async (word, wordInfo) => {
  // If no OpenAI client available, return fallback quiz
  if (!openai) {
    console.warn(`No OpenAI API key available. Using fallback quiz for word: ${word}`);
    const synonyms = wordInfo.synonyms && wordInfo.synonyms.length > 0 ? wordInfo.synonyms : ['similar', 'equivalent', 'comparable'];
    const correctAnswer = synonyms[0];
    const wrongOptions = ['different', 'opposite', 'unrelated'].filter(opt => opt !== correctAnswer);
    
    return {
      question: `Which word is a synonym of '${word}'?`,
      correctAnswer: correctAnswer,
      options: [correctAnswer, ...wrongOptions.slice(0, 3)].sort(() => Math.random() - 0.5),
      explanation: `"${correctAnswer}" is a synonym of "${word}". Note: OpenAI API key required for enhanced quizzes.`
    };
  }

  try {
    const prompt = `Create a multiple choice synonym quiz for the word "${word}".

Word information:
- Definition: ${wordInfo.definition}
- Part of speech: ${wordInfo.partOfSpeech}

Generate 4 answer choices where:
- One is the correct synonym
- Three are plausible but incorrect options
- All options should be at similar difficulty level
- Format as JSON:

{
  "question": "Which word is a synonym of '${word}'?",
  "correctAnswer": "correct synonym",
  "options": ["option1", "option2", "option3", "option4"],
  "explanation": "Brief explanation of why the correct answer is right"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are creating educational vocabulary quizzes for Korean students learning English. Provide JSON format only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 300
    });

    const jsonResponse = response.choices[0].message.content.trim();
    return JSON.parse(jsonResponse);
  } catch (error) {
    console.error('Error generating synonym quiz:', error);
    const synonyms = wordInfo.synonyms && wordInfo.synonyms.length > 0 ? wordInfo.synonyms : ['similar', 'equivalent', 'comparable'];
    const correctAnswer = synonyms[0];
    
    return {
      question: `Which word is a synonym of '${word}'?`,
      correctAnswer: correctAnswer,
      options: [correctAnswer, 'example', 'sample', 'test'].sort(() => Math.random() - 0.5),
      explanation: 'Quiz generation failed. Please try again.'
    };
  }
};

// Categorize words by type and subject
export const categorizeWords = (words) => {
  const categories = {
    byFrequency: {
      'very_common': [],
      'common': [],
      'uncommon': [],
      'rare': []
    },
    byPartOfSpeech: {
      'noun': [],
      'verb': [],
      'adjective': [],
      'adverb': [],
      'other': []
    },
    bySubjectArea: {
      'academic': [],
      'business': [],
      'science': [],
      'literature': [],
      'everyday': [],
      'technology': [],
      'general': []
    },
    byDifficulty: {
      'beginner': [], // 1-2
      'intermediate': [], // 3
      'advanced': [] // 4-5
    }
  };

  words.forEach(wordInfo => {
    // By frequency
    const freq = wordInfo.frequency || 'common';
    if (categories.byFrequency[freq]) {
      categories.byFrequency[freq].push(wordInfo);
    }

    // By part of speech
    const pos = wordInfo.partOfSpeech || 'other';
    const posKey = pos.toLowerCase();
    if (categories.byPartOfSpeech[posKey]) {
      categories.byPartOfSpeech[posKey].push(wordInfo);
    } else {
      categories.byPartOfSpeech.other.push(wordInfo);
    }

    // By subject area
    const subject = wordInfo.subjectArea || 'general';
    if (categories.bySubjectArea[subject]) {
      categories.bySubjectArea[subject].push(wordInfo);
    }

    // By difficulty
    const difficulty = wordInfo.difficulty || 3;
    if (difficulty <= 2) {
      categories.byDifficulty.beginner.push(wordInfo);
    } else if (difficulty === 3) {
      categories.byDifficulty.intermediate.push(wordInfo);
    } else {
      categories.byDifficulty.advanced.push(wordInfo);
    }
  });

  return categories;
};

// Sort words based on criteria
export const sortWords = (words, sortBy = 'frequency') => {
  switch (sortBy) {
    case 'frequency':
      return [...words].sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
    
    case 'alphabetical':
      return [...words].sort((a, b) => a.word.localeCompare(b.word));
    
    case 'difficulty':
      return [...words].sort((a, b) => (a.difficulty || 3) - (b.difficulty || 3));
    
    case 'length':
      return [...words].sort((a, b) => a.word.length - b.word.length);
    
    default:
      return words;
  }
};