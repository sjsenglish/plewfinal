// scripts/populateVocabulary.js - Script to populate vocabulary database from existing questions
// This would typically run once during migration or periodically to update vocabulary

const { batchProcessVocabulary } = require('../src/services/vocabularyAPIService');

async function populateFromAlgolia() {
  console.log('Starting vocabulary population from Algolia...');
  
  try {
    // This is a placeholder - in practice you'd fetch from your actual Algolia index
    // You could use the algoliasearch client to fetch questions
    
    const sampleQuestions = [
      {
        objectID: 'sample-1',
        question: 'The potential for market enforcement is greater when contracting parties have developed reputational mechanisms.',
        english_text: 'Economics requires understanding market dynamics and regulatory frameworks.',
        subject: 'economics'
      },
      {
        objectID: 'sample-2', 
        korean_text: '교육은 비판적 사고 능력을 기르는 것이다.',
        english_text: 'Education is about developing critical thinking abilities.',
        subject: 'general'
      }
      // Add more sample questions or fetch from Algolia
    ];

    const result = await batchProcessVocabulary(sampleQuestions);
    
    if (result.success) {
      console.log(`✅ Success! Processed ${result.processed} questions and extracted ${result.vocabularyWords} unique vocabulary words.`);
    } else {
      console.error('❌ Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Population failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  populateFromAlgolia();
}

module.exports = { populateFromAlgolia };