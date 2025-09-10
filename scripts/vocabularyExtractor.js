/**
 * Vocabulary Extraction Script
 * 
 * This script extracts vocabulary from all CSAT questions in the Algolia index,
 * processes them for frequency analysis, and stores the results in Firebase.
 * 
 * Usage: node scripts/vocabularyExtractor.js
 * 
 * Environment variables required:
 * - REACT_APP_ALGOLIA_APP_ID
 * - REACT_APP_ALGOLIA_SEARCH_KEY  
 * - Firebase config variables
 */

const { liteClient: algoliasearch } = require('algoliasearch/lite');
const admin = require('firebase-admin');
require('dotenv').config();

// Configuration
const CONFIG = {
  ALGOLIA_INDEX: 'korean-english-question-pairs',
  BATCH_SIZE: 1000,           // Records to fetch per batch
  MAX_WORDS_TO_STORE: 2000,   // Top N words to store
  MIN_FREQUENCY: 2,           // Minimum frequency to consider
  MIN_WORD_LENGTH: 3,         // Minimum word length
  MAX_WORD_LENGTH: 20,        // Maximum word length
  EXCLUDE_COMMON_WORDS: true, // Filter out common English words
  MAX_EXAMPLES_PER_WORD: 10,  // Maximum examples to store per word
  PROGRESS_INTERVAL: 100      // Show progress every N records
};

// Common English words to exclude (expandable list)
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
  'are', 'been', 'has', 'had', 'were', 'said', 'each', 'which', 'did',
  'very', 'where', 'much', 'too', 'may', 'should', 'must', 'such', 'here',
  'more', 'still', 'through', 'being', 'does', 'might', 'shall', 'before',
  'between', 'under', 'while', 'again', 'within', 'without', 'during'
]);

class VocabularyExtractor {
  constructor() {
    this.searchClient = null;
    this.db = null;
    this.extractionId = `extraction_${Date.now()}`;
    this.startTime = new Date();
    this.statistics = {
      totalQuestions: 0,
      totalWords: 0,
      uniqueWords: 0,
      filteredWords: 0,
      storedWords: 0,
      avgWordsPerQuestion: 0,
      topFrequency: 0,
      processingTimeMs: 0,
      errorsEncountered: 0
    };
    this.errors = [];
    this.wordFrequency = new Map(); // word -> { count, examples[] }
  }

  async initialize() {
    console.log('🚀 Initializing Vocabulary Extractor...');
    
    // Initialize Algolia
    if (!process.env.REACT_APP_ALGOLIA_APP_ID || !process.env.REACT_APP_ALGOLIA_SEARCH_KEY) {
      throw new Error('Missing Algolia environment variables');
    }
    
    this.searchClient = algoliasearch(
      process.env.REACT_APP_ALGOLIA_APP_ID,
      process.env.REACT_APP_ALGOLIA_SEARCH_KEY
    );

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    this.db = admin.firestore();
    
    // Log extraction start
    await this.logExtractionStart();
    console.log(`✅ Initialized. Extraction ID: ${this.extractionId}`);
  }

  async logExtractionStart() {
    await this.db.collection('extraction_metadata').doc(this.extractionId).set({
      extractionId: this.extractionId,
      startTime: admin.firestore.Timestamp.fromDate(this.startTime),
      status: 'running',
      statistics: this.statistics,
      parameters: {
        minFrequency: CONFIG.MIN_FREQUENCY,
        maxWords: CONFIG.MAX_WORDS_TO_STORE,
        excludeCommon: CONFIG.EXCLUDE_COMMON_WORDS,
        minWordLength: CONFIG.MIN_WORD_LENGTH,
        maxWordLength: CONFIG.MAX_WORD_LENGTH,
        indexName: CONFIG.ALGOLIA_INDEX,
        fieldsProcessed: ['question', 'english_text', 'korean_text']
      },
      errors: []
    });
  }

  async extractAllQuestions() {
    console.log('📊 Starting question extraction from Algolia...');
    
    let allQuestions = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        console.log(`📄 Fetching page ${page + 1}...`);
        
        const response = await this.searchClient.search([{
          indexName: CONFIG.ALGOLIA_INDEX,
          params: {
            query: '',
            hitsPerPage: CONFIG.BATCH_SIZE,
            page: page,
            attributesToRetrieve: [
              'objectID', 
              'question', 
              'english_text', 
              'korean_text',
              'paper_info',
              'subject',
              'year'
            ]
          }
        }]);

        const hits = response.results[0].hits;
        allQuestions.push(...hits);
        
        hasMore = hits.length === CONFIG.BATCH_SIZE;
        page++;
        
        console.log(`📄 Retrieved ${hits.length} questions (Total: ${allQuestions.length})`);
        
        // Small delay to be respectful to Algolia
        await this.sleep(100);
        
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error);
        this.errors.push({
          page: page,
          error: error.message,
          timestamp: new Date()
        });
        this.statistics.errorsEncountered++;
        break;
      }
    }

    this.statistics.totalQuestions = allQuestions.length;
    console.log(`✅ Extracted ${allQuestions.length} total questions`);
    
    return allQuestions;
  }

  extractWordsFromText(text, questionData) {
    if (!text || typeof text !== 'string') return [];
    
    // Remove Korean characters and special formatting
    const englishText = text
      .replace(/[가-힣]/g, ' ')  // Remove Korean characters
      .replace(/[^\w\s]/g, ' ')  // Remove punctuation except word chars and spaces
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
    
    if (!englishText) return [];
    
    // Split into sentences for context
    const sentences = englishText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const wordData = [];
    
    sentences.forEach((sentence, sentenceIndex) => {
      const words = sentence
        .toLowerCase()
        .split(/\s+/)
        .filter(word => {
          // Filter by length
          if (word.length < CONFIG.MIN_WORD_LENGTH || word.length > CONFIG.MAX_WORD_LENGTH) {
            return false;
          }
          
          // Filter common words if enabled
          if (CONFIG.EXCLUDE_COMMON_WORDS && COMMON_WORDS.has(word)) {
            return false;
          }
          
          // Only keep words with letters
          return /^[a-z]+$/.test(word);
        });
      
      words.forEach((word, wordIndex) => {
        wordData.push({
          word: word,
          originalWord: sentence.split(/\s+/)[wordIndex] || word,
          sentence: sentence.trim(),
          sentenceIndex: sentenceIndex,
          wordPosition: wordIndex,
          questionId: questionData.objectID,
          questionNumber: questionData.paper_info?.question_number || null,
          year: questionData.year || questionData.paper_info?.year || new Date().getFullYear(),
          subject: questionData.subject || 'general',
          context: sentence.trim(),
          sentenceLength: sentence.split(/\s+/).length,
          complexity: this.calculateComplexity(sentence)
        });
      });
    });
    
    return wordData;
  }

  calculateComplexity(sentence) {
    // Simple complexity score based on sentence length and word length
    const words = sentence.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentenceLength = words.length;
    
    // Normalize to 1-10 scale
    return Math.min(10, Math.max(1, Math.round((avgWordLength * 0.5) + (sentenceLength * 0.1))));
  }

  async processQuestions(questions) {
    console.log('🔍 Processing questions for vocabulary extraction...');
    
    let processedCount = 0;
    
    for (const question of questions) {
      try {
        // Extract words from all text fields
        const textFields = [
          question.question,
          question.english_text,
          question.korean_text
        ].filter(Boolean);
        
        let questionWords = [];
        for (const text of textFields) {
          const words = this.extractWordsFromText(text, question);
          questionWords.push(...words);
        }
        
        // Process each word
        questionWords.forEach(wordData => {
          const word = wordData.word;
          
          if (!this.wordFrequency.has(word)) {
            this.wordFrequency.set(word, {
              count: 0,
              examples: [],
              originalWord: wordData.originalWord,
              years: new Set(),
              subjects: new Set(),
              questionIds: new Set(),
              totalSentenceLength: 0,
              sentenceCount: 0
            });
          }
          
          const wordEntry = this.wordFrequency.get(word);
          wordEntry.count++;
          wordEntry.years.add(wordData.year);
          wordEntry.subjects.add(wordData.subject);
          wordEntry.questionIds.add(wordData.questionId);
          wordEntry.totalSentenceLength += wordData.sentenceLength;
          wordEntry.sentenceCount++;
          
          // Store example if we have room
          if (wordEntry.examples.length < CONFIG.MAX_EXAMPLES_PER_WORD) {
            wordEntry.examples.push({
              sentence: wordData.sentence,
              questionId: wordData.questionId,
              questionNumber: wordData.questionNumber,
              year: wordData.year,
              subject: wordData.subject,
              wordPosition: wordData.wordPosition,
              sentenceLength: wordData.sentenceLength,
              complexity: wordData.complexity,
              isHighlighted: wordEntry.examples.length < 3 // First 3 are highlighted
            });
          }
        });
        
        this.statistics.totalWords += questionWords.length;
        processedCount++;
        
        if (processedCount % CONFIG.PROGRESS_INTERVAL === 0) {
          console.log(`📈 Processed ${processedCount}/${questions.length} questions (${Math.round(processedCount/questions.length*100)}%)`);
          console.log(`📊 Current unique words: ${this.wordFrequency.size}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing question ${question.objectID}:`, error);
        this.errors.push({
          questionId: question.objectID,
          error: error.message,
          timestamp: new Date()
        });
        this.statistics.errorsEncountered++;
      }
    }
    
    this.statistics.uniqueWords = this.wordFrequency.size;
    this.statistics.avgWordsPerQuestion = this.statistics.totalWords / questions.length;
    
    console.log(`✅ Processing complete!`);
    console.log(`📊 Total words found: ${this.statistics.totalWords}`);
    console.log(`📊 Unique words: ${this.statistics.uniqueWords}`);
    console.log(`📊 Average words per question: ${this.statistics.avgWordsPerQuestion.toFixed(2)}`);
  }

  prepareWordsForStorage() {
    console.log('📋 Preparing words for storage...');
    
    // Convert Map to Array and sort by frequency
    const wordsArray = Array.from(this.wordFrequency.entries())
      .map(([word, data]) => ({
        word,
        frequency: data.count,
        originalWord: data.originalWord,
        examples: data.examples,
        questionCount: data.questionIds.size,
        years: Array.from(data.years).sort(),
        subjects: Array.from(data.subjects),
        avgSentenceLength: data.totalSentenceLength / data.sentenceCount
      }))
      .filter(item => item.frequency >= CONFIG.MIN_FREQUENCY)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, CONFIG.MAX_WORDS_TO_STORE);
    
    // Add ranking
    wordsArray.forEach((item, index) => {
      item.rank = index + 1;
      item.difficulty = this.calculateDifficulty(item);
    });
    
    this.statistics.filteredWords = this.statistics.uniqueWords - wordsArray.length;
    this.statistics.storedWords = wordsArray.length;
    this.statistics.topFrequency = wordsArray[0]?.frequency || 0;
    
    console.log(`📊 Words after filtering: ${wordsArray.length}`);
    console.log(`📊 Top word frequency: ${this.statistics.topFrequency}`);
    
    return wordsArray;
  }

  calculateDifficulty(wordData) {
    // Calculate difficulty based on frequency, sentence complexity, and word length
    const frequencyScore = Math.max(1, 11 - Math.min(10, Math.ceil(wordData.frequency / 10)));
    const complexityScore = wordData.examples.reduce((sum, ex) => sum + ex.complexity, 0) / wordData.examples.length;
    const lengthScore = Math.min(10, Math.max(1, wordData.word.length - 2));
    
    return Math.round((frequencyScore + complexityScore + lengthScore) / 3);
  }

  async storeWordsInDatabase(wordsArray) {
    console.log('💾 Storing words in Firebase...');
    
    const batch = this.db.batch();
    let batchCount = 0;
    const BATCH_LIMIT = 500; // Firestore batch limit
    
    for (const wordData of wordsArray) {
      try {
        // Store vocabulary word
        const wordRef = this.db.collection('vocabulary_words').doc(wordData.word);
        const wordDoc = {
          word: wordData.word,
          originalWord: wordData.originalWord,
          frequency: wordData.frequency,
          rank: wordData.rank,
          difficulty: wordData.difficulty,
          extractedAt: admin.firestore.Timestamp.now(),
          lastUpdated: admin.firestore.Timestamp.now(),
          questionCount: wordData.questionCount,
          yearRange: {
            earliest: Math.min(...wordData.years),
            latest: Math.max(...wordData.years)
          },
          subjectAreas: wordData.subjects,
          avgSentenceLength: Math.round(wordData.avgSentenceLength * 100) / 100,
          examples: wordData.examples.slice(0, 3).map(ex => ex.sentence) // Top 3 for quick access
        };
        
        batch.set(wordRef, wordDoc);
        batchCount++;
        
        // Store detailed examples
        const examplesRef = this.db.collection('vocabulary_examples').doc(wordData.word);
        const examplesDoc = {
          wordId: wordData.word,
          word: wordData.word,
          examples: wordData.examples,
          totalExamples: wordData.examples.length,
          extractedAt: admin.firestore.Timestamp.now(),
          lastUpdated: admin.firestore.Timestamp.now()
        };
        
        batch.set(examplesRef, examplesDoc);
        batchCount++;
        
        // Commit batch if approaching limit
        if (batchCount >= BATCH_LIMIT) {
          await batch.commit();
          console.log(`💾 Committed batch of ${batchCount} operations`);
          batchCount = 0;
        }
        
      } catch (error) {
        console.error(`❌ Error preparing word ${wordData.word}:`, error);
        this.errors.push({
          word: wordData.word,
          error: error.message,
          timestamp: new Date()
        });
        this.statistics.errorsEncountered++;
      }
    }
    
    // Commit remaining items
    if (batchCount > 0) {
      await batch.commit();
      console.log(`💾 Committed final batch of ${batchCount} operations`);
    }
    
    console.log(`✅ Stored ${wordsArray.length} words and their examples in Firebase`);
  }

  async logExtractionComplete() {
    const endTime = new Date();
    this.statistics.processingTimeMs = endTime.getTime() - this.startTime.getTime();
    
    await this.db.collection('extraction_metadata').doc(this.extractionId).update({
      endTime: admin.firestore.Timestamp.fromDate(endTime),
      status: 'completed',
      statistics: this.statistics,
      errors: this.errors.slice(0, 100) // Limit error log size
    });
    
    console.log(`✅ Extraction complete! Processing time: ${this.statistics.processingTimeMs}ms`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    try {
      await this.initialize();
      
      const questions = await this.extractAllQuestions();
      await this.processQuestions(questions);
      
      const wordsArray = this.prepareWordsForStorage();
      await this.storeWordsInDatabase(wordsArray);
      
      await this.logExtractionComplete();
      
      console.log('\n🎉 EXTRACTION SUMMARY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Total Questions Processed: ${this.statistics.totalQuestions}`);
      console.log(`📊 Total Words Extracted: ${this.statistics.totalWords}`);
      console.log(`📊 Unique Words Found: ${this.statistics.uniqueWords}`);
      console.log(`📊 Words Stored: ${this.statistics.storedWords}`);
      console.log(`📊 Top Word Frequency: ${this.statistics.topFrequency}`);
      console.log(`📊 Average Words/Question: ${this.statistics.avgWordsPerQuestion.toFixed(2)}`);
      console.log(`📊 Processing Time: ${(this.statistics.processingTimeMs / 1000).toFixed(2)}s`);
      console.log(`📊 Errors Encountered: ${this.statistics.errorsEncountered}`);
      console.log(`📊 Extraction ID: ${this.extractionId}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
    } catch (error) {
      console.error('💥 Fatal error during extraction:', error);
      
      // Log failure
      try {
        await this.db.collection('extraction_metadata').doc(this.extractionId).update({
          endTime: admin.firestore.Timestamp.now(),
          status: 'failed',
          statistics: this.statistics,
          errors: [...this.errors, {
            error: error.message,
            timestamp: new Date(),
            fatal: true
          }]
        });
      } catch (logError) {
        console.error('Failed to log error to database:', logError);
      }
      
      process.exit(1);
    }
  }
}

// Run the extraction if this file is executed directly
if (require.main === module) {
  const extractor = new VocabularyExtractor();
  extractor.run();
}

module.exports = VocabularyExtractor;