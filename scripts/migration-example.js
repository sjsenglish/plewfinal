/**
 * Migration Example - How to update your existing vocabulary code
 * 
 * This file shows how to migrate from the current real-time Algolia search
 * to the new pre-extracted vocabulary database approach.
 */

// ================================================================
// BEFORE: Current Real-time Approach (VocabularyPinterest.js)
// ================================================================

/*
// Old fetchCSATPassage function - searches Algolia in real-time
const fetchCSATPassage = async (word) => {
  try {
    console.log(`Searching for CSAT passage containing: "${word}"`);
    const response = await searchClient.search([
      {
        indexName: 'korean-english-question-pairs',
        params: {
          query: word,
          hitsPerPage: 1,
          attributesToRetrieve: ['question', 'english_text', 'korean_text', 'paper_info', 'objectID'],
          attributesToHighlight: ['question', 'english_text'],
          highlightPreTag: '<mark>',
          highlightPostTag: '</mark>'
        }
      }
    ]);

    if (response.results[0].hits.length > 0) {
      const hit = response.results[0].hits[0];
      const passage = hit.english_text || hit.question || '';
      
      // Find sentence containing the word
      const sentences = passage.split(/[.!?]+/);
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      const sentenceWithWord = sentences.find(sentence => wordRegex.test(sentence));
      
      return {
        example: sentenceWithWord ? sentenceWithWord.trim() + '.' : passage.substring(0, 200) + '...',
        questionInfo: {
          number: hit.objectID ? hit.objectID.split('-').pop() : null,
          year: hit.paper_info?.year || '2023'
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching CSAT passage for', word, ':', error);
    return null;
  }
};

// Old loadWords function - fetches from API and enhances each word
const loadWords = useCallback(async (reset = false) => {
  setLoading(true);
  try {
    const options = {
      limit: 20,
      offset: reset ? 0 : words.length,
      subjectArea: selectedSubject,
      search: null,
      difficulty: filters.difficulty !== 'all' ? filters.difficulty : null,
      minFrequency: filters.frequency !== 'all' ? parseInt(filters.frequency) : 1
    };

    const result = await fetchVocabulary(options);
    
    if (result.success) {
      const enhancedWords = await Promise.all(
        result.words.map(async (word, index) => {
          // Try to get enhanced word info from Free Dictionary API
          let enhancedData = {};
          try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.word}`);
            if (response.ok) {
              const data = await response.json();
              const entry = data[0];
              const meaning = entry?.meanings?.[0];
              const definition = meaning?.definitions?.[0];
              
              enhancedData = {
                definition: definition?.definition || word.definition,
                synonyms: definition?.synonyms || [],
                pronunciation: entry?.phonetics?.[0]?.text || word.pronunciation
              };
            }
          } catch (error) {
            console.log(`Failed to enhance word ${word.word}:`, error);
          }

          // Fetch actual CSAT passage for this word - SLOW!
          const csatData = await fetchCSATPassage(word.word);

          return {
            ...word,
            ...enhancedData,
            id: word.word || word.id,
            height: Math.floor(Math.random() * 200) + 300,
            definition: enhancedData.definition || word.definition || `${word.word}: An important vocabulary word for CSAT preparation.`,
            synonyms: enhancedData.synonyms?.length > 0 ? enhancedData.synonyms : 
                      word.synonyms?.length > 0 ? word.synonyms :
                      ['similar', 'related', 'comparable', 'equivalent'],
            examples: csatData?.example ? [csatData.example] :
                     word.examples?.length > 0 ? word.examples :
                     [`The word "${word.word}" appears frequently in CSAT reading passages.`],
            questionInfo: csatData?.questionInfo || word.questionInfo || null
          };
        })
      );

      const newWords = enhancedWords;

      if (reset) {
        setWords(newWords);
      } else {
        setWords(prev => [...prev, ...newWords]);
      }
    }
  } catch (error) {
    console.error('Error loading words:', error);
  } finally {
    setLoading(false);
  }
}, [selectedSubject, filters, words.length]);
*/

// ================================================================
// AFTER: New Pre-extracted Approach 
// ================================================================

// Updated imports
import { fetchVocabulary, getWordDetails } from '../services/vocabularyServiceV2';

// New loadWords function - much faster, no real-time searches needed
const loadWords = useCallback(async (reset = false) => {
  setLoading(true);
  try {
    const options = {
      limit: 20,
      offset: reset ? 0 : words.length,
      subjectArea: selectedSubject,
      search: null,
      difficulty: filters.difficulty !== 'all' ? filters.difficulty : null,
      minFrequency: filters.frequency !== 'all' ? parseInt(filters.frequency) : 1,
      sortBy: 'frequency' // Can also be 'alphabetical', 'difficulty', 'rank'
    };

    const result = await fetchVocabulary(options);
    
    if (result.success) {
      // Words already come with all the data we need!
      const enhancedWords = result.words.map(word => ({
        ...word,
        id: word.word || word.id,
        height: Math.floor(Math.random() * 200) + 300, // Random height for masonry
        // Data already includes:
        // - frequency-based ranking
        // - difficulty scores  
        // - real CSAT examples with question info
        // - subject area categorization
        // - synonyms (can be enhanced with dictionary API if needed)
      }));

      if (reset) {
        setWords(enhancedWords);
      } else {
        setWords(prev => [...prev, ...enhancedWords]);
      }
    }
  } catch (error) {
    console.error('Error loading words:', error);
  } finally {
    setLoading(false);
  }
}, [selectedSubject, filters, words.length]);

// New function to get detailed word information (when user clicks on a word)
const getWordDetailedInfo = async (word) => {
  try {
    const details = await getWordDetails(word.word);
    return {
      ...word,
      ...details,
      detailedExamples: details.detailedExamples || [],
      allQuestionReferences: details.detailedExamples.map(ex => ({
        questionId: ex.questionId,
        questionNumber: ex.questionNumber,
        year: ex.year,
        subject: ex.subject
      }))
    };
  } catch (error) {
    console.error('Error getting word details:', error);
    return word;
  }
};

// ================================================================
// PERFORMANCE COMPARISON
// ================================================================

/*
BEFORE (Real-time approach):
- Load 20 words: 20+ API calls (1 for vocab + 20 for CSAT passages)
- Time per word: ~500ms (dictionary API + Algolia search)
- Total load time: ~10-15 seconds
- Rate limiting issues with dictionary API
- Inconsistent results due to search ranking
- High Algolia search costs

AFTER (Pre-extracted approach):  
- Load 20 words: 1 Firestore query
- Time per batch: ~200ms
- Total load time: <1 second
- No rate limiting
- Consistent, ranked results
- No ongoing search costs
*/

// ================================================================
// MIGRATION STEPS
// ================================================================

/*
1. Run the extraction script:
   cd scripts
   npm install
   npm run test-extract  # Test setup
   npm run extract       # Full extraction

2. Update your imports:
   // Replace this:
   import { fetchVocabulary } from '../services/vocabularyAPIService';
   
   // With this:
   import { fetchVocabulary, getWordDetails } from '../services/vocabularyServiceV2';

3. Remove the fetchCSATPassage function (no longer needed)

4. Simplify the loadWords function (remove the slow enhancement loop)

5. Optional: Add getWordDetails for detailed view when users click on words

6. Test the updated component

7. Monitor performance improvements
*/

// ================================================================
// ADDITIONAL FEATURES AVAILABLE
// ================================================================

/*
With the new service, you can also use:

// Get vocabulary statistics
const stats = await getVocabularyStats();
console.log(`Database contains ${stats.totalWords} words from ${stats.totalQuestions} questions`);

// Get words by difficulty
const difficultWords = await getWordsByDifficulty(8, 20); // Difficulty 8, limit 20

// Get words by frequency range
const commonWords = await getWordsByFrequency(50, 100, 20); // Frequency 50-100, limit 20

// Get random words for practice
const randomWords = await getRandomWords(10, { difficulty: 5 });

// Search for specific words
const searchResults = await searchWords('academ', { limit: 10 }); // Finds 'academic', 'academy', etc.
*/

export {
  loadWords,
  getWordDetailedInfo
};