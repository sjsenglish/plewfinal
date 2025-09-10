/**
 * Test Vocabulary Extractor
 * 
 * This script tests the vocabulary extraction process with a small sample
 * to validate configuration and database connectivity before running the full extraction.
 */

const VocabularyExtractor = require('./vocabularyExtractor');

class TestExtractor extends VocabularyExtractor {
  constructor() {
    super();
    // Override config for testing
    this.testConfig = {
      ...CONFIG,
      BATCH_SIZE: 10,        // Small batch for testing
      MAX_WORDS_TO_STORE: 50, // Store fewer words
      PROGRESS_INTERVAL: 5    // More frequent progress updates
    };
  }

  async testAlgoliaConnection() {
    console.log('🔍 Testing Algolia connection...');
    
    try {
      const response = await this.searchClient.search([{
        indexName: this.testConfig.ALGOLIA_INDEX,
        params: {
          query: '',
          hitsPerPage: 1,
          attributesToRetrieve: ['objectID', 'question']
        }
      }]);

      if (response.results[0].hits.length > 0) {
        console.log('✅ Algolia connection successful');
        console.log(`📊 Sample record:`, response.results[0].hits[0].objectID);
        return true;
      } else {
        console.log('⚠️ Algolia connected but no records found');
        return false;
      }
    } catch (error) {
      console.error('❌ Algolia connection failed:', error.message);
      return false;
    }
  }

  async testFirebaseConnection() {
    console.log('🔥 Testing Firebase connection...');
    
    try {
      // Test write permissions
      const testDoc = this.db.collection('test').doc('connection-test');
      await testDoc.set({
        timestamp: new Date(),
        test: true
      });
      
      // Test read permissions
      const docSnap = await testDoc.get();
      if (docSnap.exists) {
        console.log('✅ Firebase connection successful');
        
        // Clean up test document
        await testDoc.delete();
        return true;
      } else {
        console.log('❌ Firebase write succeeded but read failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Firebase connection failed:', error.message);
      return false;
    }
  }

  async testWordExtraction() {
    console.log('📝 Testing word extraction logic...');
    
    const sampleQuestion = {
      objectID: 'test-123',
      question: 'The quick brown fox jumps over the lazy dog. This sentence contains various words of different complexity levels.',
      english_text: 'Advanced vocabulary includes words like serendipity, ubiquitous, and paradigm.',
      year: 2023,
      subject: 'english'
    };

    try {
      const extractedWords = this.extractWordsFromText(sampleQuestion.question, sampleQuestion);
      console.log(`✅ Extracted ${extractedWords.length} words from sample text`);
      
      if (extractedWords.length > 0) {
        console.log('📝 Sample extracted words:');
        extractedWords.slice(0, 5).forEach(word => {
          console.log(`   - "${word.word}" (${word.sentence})`);
        });
      }
      
      return extractedWords.length > 0;
    } catch (error) {
      console.error('❌ Word extraction test failed:', error.message);
      return false;
    }
  }

  async testSmallExtraction() {
    console.log('🧪 Running small-scale extraction test...');
    
    try {
      // Fetch just a few records
      const response = await this.searchClient.search([{
        indexName: this.testConfig.ALGOLIA_INDEX,
        params: {
          query: '',
          hitsPerPage: 5,
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

      const questions = response.results[0].hits;
      console.log(`📊 Processing ${questions.length} sample questions...`);
      
      // Process questions
      await this.processQuestions(questions);
      
      // Prepare words for storage
      const wordsArray = this.prepareWordsForStorage();
      
      console.log('✅ Small extraction test completed successfully');
      console.log(`📊 Test Results:`);
      console.log(`   - Questions processed: ${questions.length}`);
      console.log(`   - Words extracted: ${this.statistics.totalWords}`);
      console.log(`   - Unique words: ${this.statistics.uniqueWords}`);
      console.log(`   - Words to store: ${wordsArray.length}`);
      
      if (wordsArray.length > 0) {
        console.log(`📝 Top words by frequency:`);
        wordsArray.slice(0, 5).forEach((word, index) => {
          console.log(`   ${index + 1}. "${word.word}" (frequency: ${word.frequency})`);
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Small extraction test failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('\n🧪 VOCABULARY EXTRACTOR TEST SUITE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const tests = [
      { name: 'Initialize Services', fn: () => this.initialize() },
      { name: 'Algolia Connection', fn: () => this.testAlgoliaConnection() },
      { name: 'Firebase Connection', fn: () => this.testFirebaseConnection() },
      { name: 'Word Extraction Logic', fn: () => this.testWordExtraction() },
      { name: 'Small-Scale Extraction', fn: () => this.testSmallExtraction() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      console.log(`\n🔍 Running: ${test.name}`);
      try {
        const result = await test.fn();
        if (result !== false) {
          console.log(`✅ ${test.name}: PASSED`);
          passed++;
        } else {
          console.log(`❌ ${test.name}: FAILED`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${test.name}: FAILED - ${error.message}`);
        failed++;
      }
    }

    console.log('\n📊 TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${failed}`);
    console.log(`📊 Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Ready to run full extraction.');
      console.log('Run: npm run extract');
    } else {
      console.log('\n⚠️ Some tests failed. Please fix issues before running full extraction.');
    }
    
    return failed === 0;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testExtractor = new TestExtractor();
  testExtractor.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = TestExtractor;