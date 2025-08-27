// vocabularyService.js - Extract and analyze vocabulary from Korean-English questions
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Extract vocabulary words from question text
export const extractVocabularyFromQuestions = async (hits) => {
  const vocabularyWords = new Map();
  
  // Extract unique words from all question texts
  hits.forEach(hit => {
    const questionText = hit.question || hit.question_text || hit.questionText || '';
    if (questionText) {
      // Extract meaningful words (filter out common words, focus on vocabulary-rich content)
      const words = extractMeaningfulWords(questionText);
      words.forEach(word => {
        if (!vocabularyWords.has(word.toLowerCase())) {
          vocabularyWords.set(word.toLowerCase(), {
            word: word,
            frequency: 1,
            contexts: [questionText.substring(0, 200)],
            sourceQuestions: [hit.objectID || hit.id]
          });
        } else {
          const existing = vocabularyWords.get(word.toLowerCase());
          existing.frequency += 1;
          existing.contexts.push(questionText.substring(0, 200));
          existing.sourceQuestions.push(hit.objectID || hit.id);
        }
      });
    }
  });

  // Convert to array and sort by frequency
  return Array.from(vocabularyWords.values())
    .sort((a, b) => b.frequency - a.frequency);
};

// Extract meaningful vocabulary words from text
const extractMeaningfulWords = (text) => {
  // Common words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
    'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i',
    'me', 'him', 'her', 'them', 'us', 'my', 'your', 'his', 'her', 'their', 'our',
    'what', 'when', 'where', 'why', 'how', 'which', 'who', 'whom', 'whose',
    'not', 'no', 'yes', 'so', 'very', 'much', 'many', 'more', 'most', 'some', 'any', 'all'
  ]);

  // Extract words that are likely to be good vocabulary
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => 
      word.length >= 4 && // At least 4 characters
      word.length <= 15 && // Not too long
      !stopWords.has(word) && // Not a stop word
      !/^\d+$/.test(word) && // Not just numbers
      /^[a-z]+$/.test(word) // Only letters
    );

  // Remove duplicates and return
  return [...new Set(words)];
};

// Get enhanced word information using OpenAI
export const getEnhancedWordInfo = async (word, context = '') => {
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
    console.error('Error getting enhanced word info:', error);
    // Return basic fallback data
    return {
      word: word,
      partOfSpeech: 'unknown',
      definition: 'Definition not available',
      difficulty: 3,
      synonyms: [],
      antonyms: [],
      examples: [],
      koreanTranslation: '번역 불가능',
      frequency: 'common',
      subjectArea: 'general',
      collocations: [],
      etymology: ''
    };
  }
};

// Generate synonym quiz for a word
export const generateSynonymQuiz = async (word, wordInfo) => {
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
    return {
      question: `Which word is a synonym of '${word}'?`,
      correctAnswer: word,
      options: [word, 'example', 'sample', 'test'],
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