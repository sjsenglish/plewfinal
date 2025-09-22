/**
 * Upload Enhanced Korean-English Questions to Algolia
 * Updates existing index with new categorization fields
 */

const { algoliasearch } = require('algoliasearch');
const fs = require('fs');

const CREDENTIALS = {
  ALGOLIA_APP_ID: '83MRCSJJZF',
  ALGOLIA_ADMIN_KEY: process.env.ALGOLIA_ADMIN_KEY || 'your-admin-key-here' // You'll need admin key for uploads
};

async function uploadEnhancedQuestions() {
  console.log('🚀 Starting upload of enhanced Korean-English questions...\n');
  
  try {
    // Check if admin key is available
    if (CREDENTIALS.ALGOLIA_ADMIN_KEY === 'your-admin-key-here') {
      console.log('❌ Error: Please set your Algolia admin key in environment variables or update the script');
      console.log('   Set ALGOLIA_ADMIN_KEY environment variable or update CREDENTIALS.ALGOLIA_ADMIN_KEY');
      return;
    }
    
    // Load enhanced records
    const enhancedRecords = JSON.parse(
      fs.readFileSync('/Users/sj/Desktop/plew/scripts/enhanced-korean-english-questions.json', 'utf8')
    );
    
    console.log(`📊 Loaded ${enhancedRecords.length} enhanced records`);
    
    // Initialize Algolia client with admin key
    const client = algoliasearch(CREDENTIALS.ALGOLIA_APP_ID, CREDENTIALS.ALGOLIA_ADMIN_KEY);
    
    // Clean records for upload (remove debug fields)
    const cleanRecords = enhancedRecords.map(record => {
      const { _highlightResult, _confidence, _classification_details, ...cleanRecord } = record;
      return cleanRecord;
    });
    
    console.log('🔄 Uploading records to Algolia index...');
    
    // Upload in batches of 100
    const batchSize = 100;
    let uploaded = 0;
    
    for (let i = 0; i < cleanRecords.length; i += batchSize) {
      const batch = cleanRecords.slice(i, i + batchSize);
      
      try {
        const response = await client.saveObjects({
          indexName: 'korean-english-question-pairs',
          objects: batch
        });
        uploaded += batch.length;
        console.log(`  Uploaded batch ${Math.floor(i / batchSize) + 1}: ${uploaded}/${cleanRecords.length} records`);
        
      } catch (error) {
        console.error(`❌ Error uploading batch ${Math.floor(i / batchSize) + 1}:`, error);
        throw error;
      }
    }
    
    console.log(`\n✅ Successfully uploaded ${uploaded} enhanced records!`);
    console.log('\n🎯 NEW FIELDS ADDED:');
    console.log('   - source: past-paper | similar');
    console.log('   - primarySubjectArea: natural_sciences | social_sciences | literature_arts | humanities');
    console.log('   - secondarySubjectArea: biology, chemistry, physics, psychology, etc.');
    console.log('   - passageType: argumentative | discursive | analytical | comprehension');
    console.log('   - questionSkill: title_selection, main_idea, factual_comprehension, etc.');
    console.log('   - difficultyLevel: low | medium | high | very_high');
    console.log('   - expectedCorrectRate: 0.2-0.8');
    console.log('   - vocabularyDemand: 5000-9000+');
    console.log('   - textSource: academic_journal, university_textbook, etc.');
    
    console.log('\n📈 Your filters will now work with:');
    console.log('   - source:past-paper OR source:similar');
    console.log('   - primarySubjectArea:natural_sciences');
    console.log('   - secondarySubjectArea:biology');
    console.log('   - passageType:argumentative');
    console.log('   - difficultyLevel:high');
    
  } catch (error) {
    console.error('❌ Error during upload:', error);
  }
}

// Dry run function to show what would be uploaded without actually uploading
async function dryRun() {
  console.log('🧪 DRY RUN: Showing what would be uploaded (no actual changes)...\n');
  
  try {
    const enhancedRecords = JSON.parse(
      fs.readFileSync('/Users/sj/Desktop/plew/scripts/enhanced-korean-english-questions.json', 'utf8')
    );
    
    console.log(`📊 Would upload ${enhancedRecords.length} enhanced records`);
    
    // Show sample of what would be added
    const sample = enhancedRecords[0];
    const { _highlightResult, _confidence, _classification_details, ...cleanRecord } = sample;
    
    console.log('\\n📋 SAMPLE ENHANCED RECORD:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Original fields:');
    console.log(`  questionNumber: ${sample.questionNumber}`);
    console.log(`  year: ${sample.year}`);
    console.log(`  questionType: ${sample.questionType}`);
    console.log(`  theoryArea: ${sample.theoryArea}`);
    
    console.log('\\nNEW categorization fields that would be added:');
    console.log(`  source: ${sample.source}`);
    console.log(`  primarySubjectArea: ${sample.primarySubjectArea}`);
    console.log(`  secondarySubjectArea: ${sample.secondarySubjectArea}`);
    console.log(`  passageType: ${sample.passageType}`);
    console.log(`  questionSkill: ${sample.questionSkill}`);
    console.log(`  difficultyLevel: ${sample.difficultyLevel}`);
    console.log(`  expectedCorrectRate: ${sample.expectedCorrectRate}`);
    console.log(`  vocabularyDemand: ${sample.vocabularyDemand}`);
    console.log(`  textSource: ${sample.textSource}`);
    
    console.log('\\n🎯 To proceed with actual upload:');
    console.log('   1. Set your Algolia admin key in environment variables:');
    console.log('      export ALGOLIA_ADMIN_KEY="your-admin-key"');
    console.log('   2. Run: node upload-enhanced-questions.js --upload');
    
  } catch (error) {
    console.error('❌ Error during dry run:', error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--upload')) {
  uploadEnhancedQuestions();
} else {
  dryRun();
}