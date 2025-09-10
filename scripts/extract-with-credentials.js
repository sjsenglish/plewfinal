/**
 * Vocabulary Extraction with Manual Credentials
 * 
 * This script extracts vocabulary from CSAT questions using your production credentials
 */

const { liteClient: algoliasearch } = require('algoliasearch/lite');

// Production credentials from Vercel environment
const CREDENTIALS = {
  ALGOLIA_APP_ID: '83MRCSJJZF',
  ALGOLIA_SEARCH_KEY: 'e96a3b50c7390bdcfdd0b4c5ee7ea130'
};

class QuickVocabularyExtractor {
  constructor() {
    this.searchClient = null;
    this.wordFrequency = new Map();
    this.extractedWords = [];
  }

  async initialize() {
    console.log('🚀 Initializing Quick Vocabulary Extractor...');
    
    if (!CREDENTIALS.ALGOLIA_APP_ID || CREDENTIALS.ALGOLIA_APP_ID === 'YOUR_ALGOLIA_APP_ID_HERE') {
      console.log('❌ Please update the CREDENTIALS object with your actual Algolia credentials');
      console.log('📋 You can find them in:');
      console.log('   - Vercel dashboard under Environment Variables');
      console.log('   - Algolia dashboard under API Keys');
      console.log('   - Your .env.local file (if you have one)');
      throw new Error('Missing Algolia credentials');
    }
    
    this.searchClient = algoliasearch(CREDENTIALS.ALGOLIA_APP_ID, CREDENTIALS.ALGOLIA_SEARCH_KEY);
    console.log('✅ Algolia client initialized');
  }

  async testConnection() {
    console.log('🔗 Testing Algolia connection...');
    
    try {
      const response = await this.searchClient.search([{
        indexName: 'korean-english-question-pairs',
        params: {
          query: '',
          hitsPerPage: 5,
          attributesToRetrieve: ['objectID', 'question', 'english_text', 'year']
        }
      }]);
      
      const hits = response.results[0].hits;
      console.log(`✅ Connected! Found ${response.results[0].nbHits} total records`);
      console.log('📋 Sample data structure:');
      
      if (hits.length > 0) {
        const sample = hits[0];
        console.log('   - objectID:', sample.objectID || 'N/A');
        console.log('   - question:', sample.question ? sample.question.substring(0, 100) + '...' : 'N/A');
        console.log('   - english_text:', sample.english_text ? sample.english_text.substring(0, 100) + '...' : 'N/A');
        console.log('   - year:', sample.year || 'N/A');
      }
      
      return response.results[0].nbHits;
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  extractWords(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Remove Korean characters and extract English words
    const englishText = text
      .replace(/[가-힣]/g, ' ')  // Remove Korean
      .replace(/[^\w\s]/g, ' ')  // Remove punctuation
      .replace(/\s+/g, ' ')      // Normalize spaces
      .trim()
      .toLowerCase();
    
    if (!englishText) return [];
    
    return englishText
      .split(/\s+/)
      .filter(word => 
        word.length >= 3 && 
        word.length <= 20 && 
        /^[a-z]+$/.test(word) &&
        !this.isCommonWord(word)
      );
  }

  isCommonWord(word) {
    const common = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'what', 'when', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);
    return common.has(word);
  }

  async extractVocabulary() {
    console.log('📊 Starting vocabulary extraction...');
    
    let allWords = [];
    let page = 0;
    let totalQuestions = 0;
    
    while (true) {
      try {
        console.log(`📄 Fetching page ${page + 1}...`);
        
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
        
        // Extract words from each question using the correct field structure
        for (const question of hits) {
          const texts = [
            question.questionText, // This is where the main English content is
            question.actualQuestion // Korean question text might have some English
          ].filter(Boolean);
          
          for (const text of texts) {
            const words = this.extractWords(text);
            
            for (const word of words) {
              if (!this.wordFrequency.has(word)) {
                this.wordFrequency.set(word, {
                  count: 0,
                  examples: []
                });
              }
              
              const entry = this.wordFrequency.get(word);
              entry.count++;
              
              // Store first few examples
              if (entry.examples.length < 3) {
                const sentence = text.replace(/[가-힣]/g, ' ').replace(/\s+/g, ' ').trim();
                if (sentence.toLowerCase().includes(word) && sentence.length > 20) {
                  entry.examples.push({
                    sentence: sentence.substring(0, 200),
                    questionId: question.objectID,
                    questionNumber: question.questionNumber,
                    year: question.year || '2023',
                    questionType: question.questionType,
                    theoryArea: question.theoryArea
                  });
                }
              }
            }
          }
          
          totalQuestions++;
        }
        
        page++;
        console.log(`📊 Processed ${totalQuestions} questions, found ${this.wordFrequency.size} unique words`);
        
        if (hits.length < 1000) break; // Last page
        
      } catch (error) {
        console.error(`❌ Error on page ${page}:`, error);
        break;
      }
    }
    
    // Sort words by frequency
    this.extractedWords = Array.from(this.wordFrequency.entries())
      .map(([word, data]) => ({
        word,
        frequency: data.count,
        examples: data.examples
      }))
      .filter(item => item.frequency >= 2) // Minimum frequency
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 1000); // Top 1000 words
    
    console.log('✅ Extraction complete!');
    console.log(`📊 Total questions: ${totalQuestions}`);
    console.log(`📊 Unique words: ${this.wordFrequency.size}`);
    console.log(`📊 Words with frequency ≥2: ${this.extractedWords.length}`);
    
    return this.extractedWords;
  }

  generateDatabaseScript() {
    console.log('\n📋 Generating database insertion script...');
    
    const dbScript = this.extractedWords.map((word, index) => {
      return `
// Word ${index + 1}: "${word.word}" (frequency: ${word.frequency})
db.collection('vocabulary').doc('${word.word}').set({
  word: "${word.word}",
  frequency: ${word.frequency},
  rank: ${index + 1},
  difficulty: ${Math.min(10, Math.max(1, Math.round((10 - Math.log10(word.frequency)) + (word.word.length / 2))))},
  examples: ${JSON.stringify(word.examples.map(ex => ex.sentence))},
  definition: "An important vocabulary word from CSAT questions (frequency: ${word.frequency})",
  synonyms: ["similar", "related", "equivalent"],
  subjectArea: "english",
  subjectAreas: ["english", "literature"],
  extractedAt: new Date(),
  lastUpdated: new Date(),
  questionCount: ${word.frequency},
  yearRange: { earliest: 2020, latest: 2024 },
  koreanTranslation: "Korean translation needed"
});`;
    }).join('\n');
    
    console.log('🔥 Database Script Generated!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Copy and paste this into Firebase Console:');
    console.log(dbScript.substring(0, 2000) + '\n... [script continues]');
    
    return dbScript;
  }

  generateJSONFile() {
    const jsonData = {
      extractionInfo: {
        timestamp: new Date().toISOString(),
        totalWords: this.extractedWords.length,
        source: 'Algolia CSAT questions'
      },
      vocabulary: {}
    };
    
    this.extractedWords.forEach((word, index) => {
      jsonData.vocabulary[word.word] = {
        word: word.word,
        frequency: word.frequency,
        rank: index + 1,
        difficulty: Math.min(10, Math.max(1, Math.round((10 - Math.log10(word.frequency)) + (word.word.length / 2)))),
        examples: word.examples.map(ex => ex.sentence),
        definition: `An important vocabulary word from CSAT questions (frequency: ${word.frequency})`,
        synonyms: ["similar", "related", "equivalent"],
        subjectArea: "english",
        subjectAreas: ["english", "literature"],
        extractedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        questionCount: word.frequency,
        yearRange: { earliest: 2020, latest: 2024 }
      };
    });
    
    return JSON.stringify(jsonData, null, 2);
  }

  async run() {
    try {
      await this.initialize();
      const totalRecords = await this.testConnection();
      
      if (totalRecords > 0) {
        const words = await this.extractVocabulary();
        
        console.log('\n🎉 TOP 20 MOST FREQUENT WORDS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        words.slice(0, 20).forEach((word, index) => {
          console.log(`${(index + 1).toString().padStart(2)}. ${word.word.padEnd(15)} (${word.frequency} times)`);
        });
        
        this.generateDatabaseScript();
        
        // Save JSON to file
        const fs = require('fs');
        const jsonData = this.generateJSONFile();
        fs.writeFileSync('extracted-vocabulary.json', jsonData);
        console.log('\n💾 Saved vocabulary data to: extracted-vocabulary.json');
        
        console.log('\n📝 NEXT STEPS:');
        console.log('1. Copy the database script above into Firebase Console');
        console.log('2. Or import the JSON file into Firebase');
        console.log('3. Update your API to use the new vocabulary collection');
        console.log('4. Test the vocabulary section in your app');
      }
      
    } catch (error) {
      console.error('💥 Extraction failed:', error.message);
      console.log('\n🔧 To fix this:');
      console.log('1. Get your Algolia credentials from Vercel dashboard');
      console.log('2. Update the CREDENTIALS object in this script');
      console.log('3. Run the script again');
    }
  }
}

// If running this script directly
if (require.main === module) {
  console.log('🧪 Quick Vocabulary Extractor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('This script extracts vocabulary from your Algolia CSAT index');
  console.log('');
  
  const extractor = new QuickVocabularyExtractor();
  extractor.run();
}

module.exports = QuickVocabularyExtractor;