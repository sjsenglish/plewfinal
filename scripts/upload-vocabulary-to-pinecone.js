/**
 * Upload Vocabulary to Pinecone with Embeddings
 * 
 * This script uploads vocabulary words to Pinecone for semantic search
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
const fs = require('fs');

// Initialize OpenAI (requires OPENAI_API_KEY environment variable)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Pinecone (requires PINECONE_API_KEY environment variable)
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

class VocabularyPineconeUploader {
  constructor() {
    this.index = null;
    this.batchSize = 100; // Process 100 words at a time
  }

  async initialize() {
    console.log('🚀 Initializing Pinecone...');
    // Connect to the plewvocab index
    this.index = pinecone.index('plewvocab');
    console.log('✅ Connected to Pinecone plewvocab index');
  }

  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  async clearIndex() {
    console.log('🗑️ Clearing existing vectors from index...');
    try {
      // Delete all vectors by using deleteAll
      await this.index.deleteAll();
      console.log('✅ Cleared all existing vectors');
    } catch (error) {
      console.error('Error clearing index:', error);
    }
  }

  async uploadVocabulary(vocabularyList) {
    console.log(`📚 Uploading ${vocabularyList.length} vocabulary words to Pinecone...`);
    
    let uploaded = 0;
    let failed = 0;
    
    // Process in batches
    for (let i = 0; i < vocabularyList.length; i += this.batchSize) {
      const batch = vocabularyList.slice(i, i + this.batchSize);
      const vectors = [];
      
      // Generate embeddings for batch
      for (const word of batch) {
        // Create searchable text combining word, definition, and contexts
        const searchableText = `${word.word} ${word.definition || ''} ${(word.contexts || []).join(' ')}`.trim();
        
        console.log(`🔄 Processing: ${word.word} (${uploaded + failed + 1}/${vocabularyList.length})`);
        
        const embedding = await this.generateEmbedding(searchableText);
        
        if (embedding) {
          vectors.push({
            id: word.word.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            values: embedding,
            metadata: {
              word: word.word,
              definition: word.definition || '',
              difficulty: word.difficulty || 5,
              frequency: word.frequency || 1,
              contexts: (word.contexts || []).slice(0, 3), // Store first 3 contexts
              subjects: (word.subjects || []).slice(0, 5), // Store first 5 subjects
              years: (word.years || []).slice(0, 5), // Store first 5 years
              searchText: searchableText.substring(0, 1000) // Store searchable text (limited)
            }
          });
        } else {
          failed++;
          console.error(`❌ Failed to generate embedding for: ${word.word}`);
        }
        
        // Add a small delay to avoid rate limiting
        if ((uploaded + failed) % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Upload batch to Pinecone
      if (vectors.length > 0) {
        try {
          await this.index.upsert(vectors);
          uploaded += vectors.length;
          console.log(`✅ Uploaded batch: ${uploaded}/${vocabularyList.length} words`);
        } catch (error) {
          console.error('Error uploading batch to Pinecone:', error);
          failed += vectors.length;
        }
      }
      
      // Progress update
      const progress = Math.round(((uploaded + failed) / vocabularyList.length) * 100);
      console.log(`📊 Progress: ${progress}% (${uploaded} succeeded, ${failed} failed)`);
    }
    
    console.log(`\n✅ Upload complete!`);
    console.log(`📊 Successfully uploaded: ${uploaded} words`);
    console.log(`❌ Failed: ${failed} words`);
    
    // Get index stats
    try {
      const stats = await this.index.describeIndexStats();
      console.log('\n📈 Index Statistics:');
      console.log(`Total vectors: ${stats.totalVectorCount}`);
      console.log(`Dimensions: ${stats.dimension}`);
    } catch (error) {
      console.error('Error getting index stats:', error);
    }
  }

  async run() {
    try {
      await this.initialize();
      
      // Load the vocabulary data
      console.log('📖 Loading vocabulary data...');
      const vocabularyData = JSON.parse(fs.readFileSync('enhanced-vocabulary-output.json', 'utf8'));
      console.log(`Loaded ${vocabularyData.length} words`);
      
      // Clear existing data
      await this.clearIndex();
      
      // Upload to Pinecone
      await this.uploadVocabulary(vocabularyData);
      
      console.log('\n🎉 Vocabulary upload to Pinecone completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Vocabulary search will now use semantic search');
      console.log('2. Words will be found even with partial matches');
      console.log('3. Related words will appear in search results');
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      process.exit(1);
    }
  }
}

// Run the uploader
const uploader = new VocabularyPineconeUploader();
uploader.run().then(() => {
  console.log('✅ Process completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});