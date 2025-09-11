#!/usr/bin/env node

require('dotenv').config();

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const { algoliasearch } = require('algoliasearch');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../src/config/firebase-admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

// Initialize Algolia
const client = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_ADMIN_KEY || process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Common stop words to exclude
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up',
  'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'me',
  'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
  'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its',
  'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom',
  'whose', 'am', 'as', 'get', 'got', 'one', 'two', 'also', 'said', 'say', 'says', 'like',
  'go', 'goes', 'went', 'going', 'come', 'came', 'coming', 'see', 'saw', 'seen', 'seeing',
  'make', 'made', 'making', 'take', 'took', 'taken', 'taking', 'give', 'gave', 'given', 'giving'
]);

// Subject mapping for difficulty estimation
const SUBJECT_DIFFICULTY = {
  'literature': 3,
  'science': 4,
  'history': 3,
  'society': 2,
  'economics': 4,
  'politics': 3,
  'culture': 2,
  'technology': 4,
  'environment': 3,
  'default': 2
};

class VocabularyExtractor {
  constructor() {
    this.vocabularyMap = new Map();
    this.processedQuestions = 0;
    this.totalQuestions = 0;
  }

  // Clean and normalize text
  cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Remove HTML tags, special characters, keep only alphanumeric and basic punctuation
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/[^\w\s.,!?;:'"()-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Extract words from text
  extractWords(text) {
    const cleaned = this.cleanText(text);
    const words = cleaned
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.replace(/[.,!?;:'"()-]/g, ''))
      .filter(word => 
        word.length > 3 && 
        !STOP_WORDS.has(word) &&
        /^[a-z]+$/.test(word) && // Only alphabetic characters
        !/^\d+$/.test(word) // Exclude pure numbers
      );

    return words;
  }

  // Get question identifier
  getQuestionId(question) {
    // Try to extract year and question number from various fields
    const year = question.year || question.exam_year || '2024';
    const questionNum = question.question_number || question.questionNumber || 
                       question.number || this.processedQuestions + 1;
    
    return `${year} Q${questionNum}`;
  }

  // Estimate difficulty based on word characteristics and subject
  estimateDifficulty(word, frequency, subjects) {
    let difficulty = 1;

    // Length-based difficulty
    if (word.length > 8) difficulty += 2;
    else if (word.length > 6) difficulty += 1;

    // Frequency-based difficulty (less frequent = more difficult)
    if (frequency < 3) difficulty += 2;
    else if (frequency < 5) difficulty += 1;

    // Subject-based difficulty
    if (subjects.length > 0) {
      const avgSubjectDifficulty = subjects.reduce((sum, subject) => {
        return sum + (SUBJECT_DIFFICULTY[subject.toLowerCase()] || SUBJECT_DIFFICULTY.default);
      }, 0) / subjects.length;
      
      difficulty += Math.round(avgSubjectDifficulty / 2);
    }

    // Syllable complexity (rough estimation)
    const vowelCount = (word.match(/[aeiou]/g) || []).length;
    if (vowelCount > 3) difficulty += 1;

    return Math.min(Math.max(difficulty, 1), 5); // Clamp between 1-5
  }

  // Process a single question
  processQuestion(question) {
    this.processedQuestions++;
    
    // Extract text from questionText field
    const questionText = question.questionText || question.question_text || '';
    if (!questionText) return;

    const words = this.extractWords(questionText);
    const questionId = this.getQuestionId(question);
    const subject = question.subject || question.subject_area || 'general';

    console.log(`Processing ${questionId}: Found ${words.length} words`);

    words.forEach(word => {
      if (!this.vocabularyMap.has(word)) {
        this.vocabularyMap.set(word, {
          word: word,
          frequency: 0,
          questions: new Set(),
          contexts: new Set(),
          subjects: new Set(),
          sentences: new Map() // questionId -> sentence
        });
      }

      const entry = this.vocabularyMap.get(word);
      entry.frequency++;
      entry.questions.add(questionId);
      entry.subjects.add(subject);

      // Find sentence containing the word for context
      const sentences = questionText.split(/[.!?]+/);
      for (const sentence of sentences) {
        const cleanSentence = this.cleanText(sentence);
        if (cleanSentence.toLowerCase().includes(word)) {
          entry.contexts.add(cleanSentence.trim());
          entry.sentences.set(questionId, cleanSentence.trim());
          break; // Only take first occurrence per question
        }
      }
    });

    if (this.processedQuestions % 10 === 0) {
      console.log(`Processed ${this.processedQuestions}/${this.totalQuestions} questions...`);
    }
  }

  // Save vocabulary to Firebase
  async saveToFirebase() {
    console.log('\nSaving vocabulary to Firebase...');
    let savedWords = 0;
    const batchSize = 400; // Firebase batch limit is 500, use 400 for safety

    // Clear existing vocabulary collection first
    console.log('Clearing existing vocabulary collection...');
    const existingDocs = await db.collection('vocabulary').get();
    
    // Delete in batches
    for (let i = 0; i < existingDocs.docs.length; i += batchSize) {
      const deleteBatch = db.batch();
      const batchDocs = existingDocs.docs.slice(i, i + batchSize);
      batchDocs.forEach(doc => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();
      console.log(`Deleted ${batchDocs.length} existing documents...`);
    }

    // Prepare vocabulary data
    const vocabularyToSave = [];
    for (const [word, entry] of this.vocabularyMap) {
      // Only save words that appear at least twice
      if (entry.frequency >= 2) {
        const vocabularyData = {
          word: entry.word,
          frequency: entry.frequency,
          questions: Array.from(entry.questions),
          contexts: Array.from(entry.contexts).slice(0, 5), // Limit contexts
          subjects: Array.from(entry.subjects),
          difficulty: this.estimateDifficulty(
            entry.word, 
            entry.frequency, 
            Array.from(entry.subjects)
          ),
          definition: '', // To be filled manually or via API later
          examples: Array.from(entry.sentences.entries()).slice(0, 3).map(([qId, sentence]) => ({
            questionId: qId,
            sentence: sentence
          })),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        vocabularyToSave.push({ word, data: vocabularyData });
      }
    }

    // Save in batches
    console.log(`Saving ${vocabularyToSave.length} words in batches of ${batchSize}...`);
    for (let i = 0; i < vocabularyToSave.length; i += batchSize) {
      const batch = db.batch();
      const batchItems = vocabularyToSave.slice(i, i + batchSize);
      
      batchItems.forEach(item => {
        const docRef = db.collection('vocabulary').doc(item.word);
        batch.set(docRef, item.data);
      });
      
      await batch.commit();
      savedWords += batchItems.length;
      console.log(`Saved batch ${Math.floor(i/batchSize) + 1}: ${batchItems.length} words (Total: ${savedWords})`);
    }

    console.log(`✅ Saved ${savedWords} vocabulary words to Firebase`);
    
    return {
      totalWordsProcessed: this.vocabularyMap.size,
      wordsSaved: savedWords,
      questionsProcessed: this.processedQuestions
    };
  }

  // Main extraction process
  async extract() {
    try {
      console.log('🚀 Starting vocabulary extraction from Algolia...');
      
      // Get all questions from Algolia
      const searchResults = await client.search({
        requests: [{
          indexName: 'korean-english-question-pairs',
          query: '',
          hitsPerPage: 1000,
          attributesToRetrieve: [
            'objectID',
            'questionText',
            'question_text',
            'subject',
            'subject_area',
            'year',
            'exam_year',
            'question_number',
            'questionNumber',
            'number'
          ]
        }]
      });

      this.totalQuestions = searchResults.results[0].hits.length;
      console.log(`Found ${this.totalQuestions} questions to process`);

      if (this.totalQuestions === 0) {
        console.log('❌ No questions found in Algolia index');
        return;
      }

      // Process each question
      for (const question of searchResults.results[0].hits) {
        this.processQuestion(question);
      }

      console.log(`\n📊 Extraction Summary:`);
      console.log(`Questions processed: ${this.processedQuestions}`);
      console.log(`Unique words found: ${this.vocabularyMap.size}`);
      console.log(`Words appearing 2+ times: ${Array.from(this.vocabularyMap.values()).filter(v => v.frequency >= 2).length}`);

      // Save to Firebase
      const result = await this.saveToFirebase();
      
      console.log('\n🎉 Vocabulary extraction completed successfully!');
      console.log(`📈 Final Statistics:`);
      console.log(`- Total words processed: ${result.totalWordsProcessed}`);
      console.log(`- Words saved to Firebase: ${result.wordsSaved}`);
      console.log(`- Questions processed: ${result.questionsProcessed}`);
      
      return result;

    } catch (error) {
      console.error('❌ Error during vocabulary extraction:', error);
      throw error;
    }
  }
}

// Run the extraction
if (require.main === module) {
  const extractor = new VocabularyExtractor();
  
  extractor.extract()
    .then((result) => {
      console.log('\n✅ Extraction completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Extraction failed:', error);
      process.exit(1);
    });
}

module.exports = VocabularyExtractor;