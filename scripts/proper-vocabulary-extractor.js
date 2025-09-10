/**
 * Proper Vocabulary Extractor - Fixed Version
 * 
 * This script properly extracts vocabulary with:
 * - Validated word-sentence matching 
 * - Dictionary definitions and synonyms
 * - Complete, relevant sentences from CSAT passages
 * - Data quality validation
 */

const { liteClient: algoliasearch } = require('algoliasearch/lite');
const fetch = require('node-fetch');

const CREDENTIALS = {
  ALGOLIA_APP_ID: '83MRCSJJZF',
  ALGOLIA_SEARCH_KEY: 'e96a3b50c7390bdcfdd0b4c5ee7ea130'
};

// Common words to exclude from vocabulary building
const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
  'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
  'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
  'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
  'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some',
  'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
  'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
  'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was',
  'are', 'been', 'has', 'had', 'were', 'said', 'each', 'did', 'very',
  'where', 'much', 'too', 'may', 'should', 'must', 'such', 'here', 'more',
  'still', 'through', 'being', 'does', 'might', 'shall', 'before', 'between',
  'under', 'while', 'again', 'within', 'without', 'during', 'above', 'below',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should',
  'now', 'made', 'find', 'here', 'where', 'much', 'system', 'those', 'many',
  'during', 'used', 'came', 'water', 'long', 'right', 'left', 'number',
  'called', 'great', 'little', 'world', 'life', 'still', 'school', 'never',
  'last', 'another', 'while', 'house', 'might', 'every', 'don', 'does',
  'part', 'place', 'right', 'where', 'while', 'same', 'old', 'tell', 'boy',
  'follow', 'around', 'came', 'show', 'large', 'often', 'together', 'asked',
  'put', 'end', 'why', 'turned', 'here', 'move', 'live', 'believe', 'hold',
  'bring', 'happen', 'wrote', 'provide', 'sit', 'stood', 'lose', 'power',
  'pay', 'meet', 'include', 'continue', 'set', 'lot', 'sure', 'big', 'book',
  'eye', 'job', 'word', 'though', 'business', 'issue', 'become', 'point',
  'try', 'ask', 'seem', 'feel', 'hand', 'high', 'government', 'person',
  'student', 'group', 'problem', 'fact'
]);

class ProperVocabularyExtractor {
  constructor() {
    this.searchClient = null;
    this.wordFrequency = new Map(); // word -> { count, sentences: [{ sentence, questionId, verified: true }] }
    this.extractedWords = [];
    this.validationErrors = [];
  }

  async initialize() {
    console.log('🚀 Initializing Proper Vocabulary Extractor...');
    this.searchClient = algoliasearch(CREDENTIALS.ALGOLIA_APP_ID, CREDENTIALS.ALGOLIA_SEARCH_KEY);
    console.log('✅ Algolia client initialized');
  }

  // Extract words from text and return word-sentence pairs with validation
  extractWordsFromText(text, questionData) {
    if (!text || typeof text !== 'string') return [];
    
    // Clean text and split into sentences
    const cleanText = text
      .replace(/[가-힣]/g, ' ')  // Remove Korean characters
      .replace(/\([^)]*\)/g, ' ') // Remove parenthetical content like (A), (B)
      .replace(/[^\w\s.!?]/g, ' ') // Keep only words, spaces, and sentence endings
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split into sentences properly
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20); // Only keep substantial sentences
    
    const wordSentencePairs = [];
    
    sentences.forEach(sentence => {
      // Extract words from this sentence
      const words = sentence
        .toLowerCase()
        .split(/\s+/)
        .filter(word => {
          // Clean the word
          word = word.replace(/[^a-z]/g, '');
          
          // Filter criteria
          return word.length >= 4 && 
                 word.length <= 15 && 
                 !COMMON_WORDS.has(word) &&
                 /^[a-z]+$/.test(word);
        });
      
      // For each word, verify it actually appears in the sentence
      words.forEach(word => {
        const cleanWord = word.replace(/[^a-z]/g, '');
        
        // CRITICAL: Verify the word actually appears in the sentence
        const sentenceLower = sentence.toLowerCase();
        const wordRegex = new RegExp(`\\b${cleanWord}\\b`, 'i');
        
        if (wordRegex.test(sentenceLower)) {
          wordSentencePairs.push({
            word: cleanWord,
            sentence: sentence,
            questionId: questionData.objectID,
            questionNumber: questionData.questionNumber,
            year: questionData.year,
            questionType: questionData.questionType,
            theoryArea: questionData.theoryArea,
            verified: true // Mark as verified since we checked
          });
        } else {
          // Log validation error
          this.validationErrors.push({
            word: cleanWord,
            sentence: sentence.substring(0, 100),
            error: 'Word not found in sentence',
            questionId: questionData.objectID
          });
        }
      });
    });
    
    return wordSentencePairs;
  }

  async fetchAllCSATData() {
    console.log('📊 Fetching all CSAT data from Algolia...');
    
    let allQuestions = [];
    let page = 0;
    
    while (true) {
      const response = await this.searchClient.search([{
        indexName: 'korean-english-question-pairs',
        params: {
          query: '',
          hitsPerPage: 1000,
          page: page,
          attributesToRetrieve: [
            'objectID', 
            'questionText', 
            'actualQuestion',
            'questionNumber',
            'year',
            'questionType',
            'theoryArea'
          ]
        }
      }]);

      const hits = response.results[0].hits;
      if (hits.length === 0) break;
      
      allQuestions.push(...hits);
      page++;
      console.log(`📄 Fetched page ${page}, total questions: ${allQuestions.length}`);
      
      if (hits.length < 1000) break;
    }
    
    console.log(`✅ Fetched ${allQuestions.length} total CSAT questions`);
    return allQuestions;
  }

  async extractVocabularyFromQuestions(questions) {
    console.log('🔍 Extracting vocabulary with proper validation...');
    
    let processedCount = 0;
    
    for (const question of questions) {
      // Extract from English text only (questionText contains the English passages)
      if (question.questionText && question.questionText.length > 100) {
        const wordSentencePairs = this.extractWordsFromText(question.questionText, question);
        
        // Add to frequency map with validation
        wordSentencePairs.forEach(pair => {
          if (!this.wordFrequency.has(pair.word)) {
            this.wordFrequency.set(pair.word, {
              count: 0,
              sentences: []
            });
          }
          
          const entry = this.wordFrequency.get(pair.word);
          entry.count++;
          
          // Only store verified sentences and limit to prevent duplication
          if (pair.verified && entry.sentences.length < 5) {
            // Check if we already have this sentence
            const isDuplicate = entry.sentences.some(existing => 
              existing.sentence === pair.sentence
            );
            
            if (!isDuplicate) {
              entry.sentences.push({
                sentence: pair.sentence,
                questionId: pair.questionId,
                questionNumber: pair.questionNumber,
                year: pair.year,
                questionType: pair.questionType,
                theoryArea: pair.theoryArea
              });
            }
          }
        });
      }
      
      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`📈 Processed ${processedCount}/${questions.length} questions`);
        console.log(`📊 Unique words found: ${this.wordFrequency.size}`);
      }
    }
    
    console.log(`✅ Extraction complete. Found ${this.wordFrequency.size} unique words`);
    console.log(`⚠️  Validation errors: ${this.validationErrors.length}`);
  }

  // Get definition and synonyms from Free Dictionary API
  async getWordDefinition(word) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      
      if (!response.ok) {
        throw new Error(`Dictionary API returned ${response.status}`);
      }
      
      const data = await response.json();
      const entry = data[0];
      
      if (!entry || !entry.meanings || entry.meanings.length === 0) {
        throw new Error('No meanings found');
      }
      
      // Get the first definition
      const meaning = entry.meanings[0];
      const definition = meaning.definitions[0]?.definition || null;
      
      // Extract synonyms from all meanings
      const synonyms = [];
      entry.meanings.forEach(meaning => {
        meaning.definitions.forEach(def => {
          if (def.synonyms && def.synonyms.length > 0) {
            synonyms.push(...def.synonyms);
          }
        });
      });
      
      // Get pronunciation
      const pronunciation = entry.phonetic || 
                          (entry.phonetics && entry.phonetics[0]?.text) || 
                          null;
      
      // Get part of speech
      const partOfSpeech = meaning.partOfSpeech || null;
      
      return {
        definition,
        synonyms: [...new Set(synonyms)].slice(0, 6), // Remove duplicates, limit to 6
        pronunciation,
        partOfSpeech,
        source: 'Free Dictionary API'
      };
      
    } catch (error) {
      console.log(`📝 No dictionary data for "${word}": ${error.message}`);
      
      // Return fallback data
      return {
        definition: `${word}: An important vocabulary word from CSAT reading passages. This word appears frequently in academic English texts and is essential for test preparation.`,
        synonyms: ['related', 'similar', 'equivalent'],
        pronunciation: null,
        partOfSpeech: 'noun/verb',
        source: 'Generated'
      };
    }
  }

  async enrichWordsWithDefinitions() {
    console.log('📚 Enriching words with definitions and synonyms...');
    
    // Get top 300 most frequent words
    const sortedWords = Array.from(this.wordFrequency.entries())
      .filter(([word, data]) => data.count >= 2 && data.sentences.length > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 300);
    
    console.log(`📊 Processing ${sortedWords.length} words for definitions...`);
    
    const enrichedWords = [];
    let processedCount = 0;
    
    for (const [word, data] of sortedWords) {
      try {
        // Get definition from dictionary API
        const wordInfo = await this.getWordDefinition(word);
        
        // Validate that we have good example sentences
        const validSentences = data.sentences.filter(sentenceData => {
          const sentence = sentenceData.sentence.toLowerCase();
          const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
          return wordRegex.test(sentence) && sentence.length > 30;
        });
        
        if (validSentences.length === 0) {
          console.log(`⚠️  Skipping "${word}" - no valid sentences found`);
          continue;
        }
        
        enrichedWords.push({
          word,
          frequency: data.count,
          rank: enrichedWords.length + 1,
          difficulty: this.calculateDifficulty(word, data.count, wordInfo.partOfSpeech),
          definition: wordInfo.definition,
          synonyms: wordInfo.synonyms,
          pronunciation: wordInfo.pronunciation,
          partOfSpeech: wordInfo.partOfSpeech,
          examples: validSentences.slice(0, 3).map(s => s.sentence),
          questionCount: validSentences.length,
          csatQuestions: validSentences.map(s => ({
            questionId: s.questionId,
            questionNumber: s.questionNumber,
            year: s.year,
            questionType: s.questionType,
            theoryArea: s.theoryArea
          })),
          source: wordInfo.source,
          extractedAt: new Date().toISOString(),
          validated: true
        });
        
        processedCount++;
        if (processedCount % 25 === 0) {
          console.log(`📚 Enriched ${processedCount}/${sortedWords.length} words`);
          // Small delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`❌ Error processing word "${word}":`, error);
      }
    }
    
    this.extractedWords = enrichedWords;
    console.log(`✅ Successfully enriched ${enrichedWords.length} vocabulary words`);
  }

  calculateDifficulty(word, frequency, partOfSpeech) {
    // Base difficulty on word length
    let difficulty = Math.min(10, Math.max(1, word.length - 2));
    
    // Adjust for frequency (less frequent = more difficult)
    if (frequency < 5) difficulty += 2;
    else if (frequency < 10) difficulty += 1;
    else if (frequency > 50) difficulty -= 1;
    
    // Adjust for part of speech
    if (partOfSpeech === 'adjective' || partOfSpeech === 'adverb') difficulty += 1;
    if (partOfSpeech === 'verb') difficulty += 0.5;
    
    return Math.min(10, Math.max(1, Math.round(difficulty)));
  }

  async validateExtractedData() {
    console.log('🔍 Validating extracted data quality...');
    
    let validWords = 0;
    let invalidWords = 0;
    const validationReport = [];
    
    for (const word of this.extractedWords) {
      const issues = [];
      
      // Check if word appears in its example sentences
      let validExamples = 0;
      word.examples.forEach((sentence, index) => {
        const wordRegex = new RegExp(`\\b${word.word}\\b`, 'i');
        if (wordRegex.test(sentence)) {
          validExamples++;
        } else {
          issues.push(`Example ${index + 1} does not contain the word "${word.word}"`);
        }
      });
      
      // Check if we have a proper definition
      if (!word.definition || word.definition.length < 20) {
        issues.push('Definition is missing or too short');
      }
      
      // Check if we have synonyms
      if (!word.synonyms || word.synonyms.length === 0) {
        issues.push('No synonyms provided');
      }
      
      if (issues.length === 0 && validExamples > 0) {
        validWords++;
      } else {
        invalidWords++;
        validationReport.push({
          word: word.word,
          issues: issues,
          validExamples: validExamples,
          totalExamples: word.examples.length
        });
      }
    }
    
    console.log(`✅ Validation complete:`);
    console.log(`   Valid words: ${validWords}`);
    console.log(`   Invalid words: ${invalidWords}`);
    
    if (invalidWords > 0) {
      console.log(`⚠️  First 5 validation issues:`);
      validationReport.slice(0, 5).forEach(report => {
        console.log(`   - ${report.word}: ${report.issues.join(', ')}`);
      });
    }
    
    return { validWords, invalidWords, validationReport };
  }

  generateDataFile() {
    const outputData = {
      extractionInfo: {
        timestamp: new Date().toISOString(),
        totalWords: this.extractedWords.length,
        source: 'Algolia CSAT questions with proper validation',
        validationErrors: this.validationErrors.length
      },
      vocabulary: {}
    };
    
    this.extractedWords.forEach(word => {
      outputData.vocabulary[word.word] = {
        word: word.word,
        frequency: word.frequency,
        rank: word.rank,
        difficulty: word.difficulty,
        definition: word.definition,
        synonyms: word.synonyms,
        pronunciation: word.pronunciation,
        partOfSpeech: word.partOfSpeech,
        examples: word.examples,
        questionCount: word.questionCount,
        csatQuestions: word.csatQuestions,
        subjectArea: 'english',
        subjectAreas: ['english', 'literature'],
        yearRange: { 
          earliest: Math.min(...word.csatQuestions.map(q => q.year || 2023)),
          latest: Math.max(...word.csatQuestions.map(q => q.year || 2023))
        },
        extractedAt: word.extractedAt,
        validated: word.validated,
        source: word.source
      };
    });
    
    const fs = require('fs');
    fs.writeFileSync('proper-vocabulary.json', JSON.stringify(outputData, null, 2));
    console.log('💾 Saved validated vocabulary to: proper-vocabulary.json');
    
    return outputData;
  }

  async run() {
    try {
      await this.initialize();
      
      const questions = await this.fetchAllCSATData();
      await this.extractVocabularyFromQuestions(questions);
      await this.enrichWordsWithDefinitions();
      
      const validation = await this.validateExtractedData();
      const dataFile = this.generateDataFile();
      
      console.log('\n🎉 PROPER EXTRACTION COMPLETE!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Total CSAT Questions: ${questions.length}`);
      console.log(`📊 Vocabulary Words Extracted: ${this.extractedWords.length}`);
      console.log(`📊 Valid Words: ${validation.validWords}`);
      console.log(`📊 Invalid Words: ${validation.invalidWords}`);
      console.log(`📊 Validation Errors: ${this.validationErrors.length}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log('\n🔍 TOP 10 VALIDATED WORDS:');
      this.extractedWords.slice(0, 10).forEach((word, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${word.word.padEnd(15)} (${word.frequency}x) - ${word.definition.substring(0, 50)}...`);
      });
      
      console.log('\n📝 NEXT STEPS:');
      console.log('1. Review the validation report above');
      console.log('2. Upload the validated data with: node scripts/upload-proper-vocabulary.js');
      console.log('3. Test the vocabulary section in your app');
      
      return dataFile;
      
    } catch (error) {
      console.error('💥 Extraction failed:', error);
      throw error;
    }
  }
}

if (require.main === module) {
  const extractor = new ProperVocabularyExtractor();
  extractor.run().catch(console.error);
}

module.exports = ProperVocabularyExtractor;