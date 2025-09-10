/**
 * Create Sample Vocabulary Data
 * 
 * This script creates sample vocabulary data for testing the system
 * without needing to run the full extraction.
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Sample vocabulary words with Korean academic focus
const SAMPLE_WORDS = [
  {
    word: "analyze",
    definition: "To examine something in detail to understand it better or discover more about it",
    frequency: 45,
    difficulty: 4,
    rank: 1,
    pronunciation: "/ˈænəlaɪz/",
    synonyms: ["examine", "study", "investigate", "scrutinize"],
    examples: ["Students must analyze the given passage carefully.", "The data shows an interesting pattern when we analyze it.", "Please analyze the author's argument in paragraph three."],
    subjectAreas: ["english", "literature", "science"],
    questionCount: 15,
    yearRange: { earliest: 2020, latest: 2024 },
    avgSentenceLength: 12.5
  },
  {
    word: "interpret",
    definition: "To explain the meaning of something or to understand something in a particular way",
    frequency: 38,
    difficulty: 5,
    rank: 2,
    pronunciation: "/ɪnˈtɜrprɪt/",
    synonyms: ["explain", "clarify", "decode", "understand"],
    examples: ["How do you interpret this graph?", "The critic interpreted the poem differently.", "Students should interpret the data objectively."],
    subjectAreas: ["english", "literature", "arts"],
    questionCount: 12,
    yearRange: { earliest: 2021, latest: 2024 },
    avgSentenceLength: 11.8
  },
  {
    word: "synthesis",
    definition: "The combination of different ideas, styles, or things to create something new",
    frequency: 32,
    difficulty: 7,
    rank: 3,
    pronunciation: "/ˈsɪnθəsɪs/",
    synonyms: ["combination", "fusion", "integration", "merger"],
    examples: ["The essay requires synthesis of multiple sources.", "Her research represents a synthesis of Eastern and Western philosophy.", "The synthesis of these elements creates a unique compound."],
    subjectAreas: ["science", "philosophy", "english"],
    questionCount: 10,
    yearRange: { earliest: 2020, latest: 2024 },
    avgSentenceLength: 13.2
  },
  {
    word: "hypothesis",
    definition: "A proposed explanation for a phenomenon, used as a starting point for investigation",
    frequency: 28,
    difficulty: 6,
    rank: 4,
    pronunciation: "/haɪˈpɑθəsɪs/",
    synonyms: ["theory", "assumption", "supposition", "conjecture"],
    examples: ["The scientist tested her hypothesis through experiments.", "What hypothesis can you form based on this evidence?", "The data supports our initial hypothesis."],
    subjectAreas: ["science", "psychology"],
    questionCount: 8,
    yearRange: { earliest: 2021, latest: 2024 },
    avgSentenceLength: 10.5
  },
  {
    word: "paradigm",
    definition: "A typical example or pattern of something; a model or framework for understanding",
    frequency: 25,
    difficulty: 8,
    rank: 5,
    pronunciation: "/ˈpærədaɪm/",
    synonyms: ["model", "framework", "pattern", "example"],
    examples: ["This discovery represents a new paradigm in physics.", "The old paradigm of learning is being challenged.", "We need to shift our paradigm to solve this problem."],
    subjectAreas: ["science", "philosophy", "social"],
    questionCount: 7,
    yearRange: { earliest: 2020, latest: 2023 },
    avgSentenceLength: 12.0
  },
  {
    word: "phenomenon",
    definition: "A fact or situation that is observed to exist or happen, especially something unusual",
    frequency: 24,
    difficulty: 6,
    rank: 6,
    pronunciation: "/fəˈnɑməˌnɑn/",
    synonyms: ["occurrence", "event", "happening", "manifestation"],
    examples: ["This social phenomenon affects many teenagers.", "Scientists study natural phenomena.", "The aurora borealis is a beautiful phenomenon."],
    subjectAreas: ["science", "social", "psychology"],
    questionCount: 9,
    yearRange: { earliest: 2021, latest: 2024 },
    avgSentenceLength: 9.8
  },
  {
    word: "correlation",
    definition: "A mutual relationship or connection between two or more things",
    frequency: 22,
    difficulty: 5,
    rank: 7,
    pronunciation: "/ˌkɔrəˈleɪʃən/",
    synonyms: ["connection", "relationship", "association", "link"],
    examples: ["There's a strong correlation between study time and grades.", "The correlation between these variables is significant.", "Researchers found no correlation between the two factors."],
    subjectAreas: ["science", "psychology", "economics"],
    questionCount: 6,
    yearRange: { earliest: 2020, latest: 2024 },
    avgSentenceLength: 11.3
  },
  {
    word: "ambiguous",
    definition: "Having more than one possible meaning; unclear or confusing",
    frequency: 20,
    difficulty: 5,
    rank: 8,
    pronunciation: "/æmˈbɪgjuəs/",
    synonyms: ["unclear", "vague", "confusing", "uncertain"],
    examples: ["The author's statement is deliberately ambiguous.", "This ambiguous phrase could mean several things.", "The results are ambiguous and need further study."],
    subjectAreas: ["english", "literature", "philosophy"],
    questionCount: 8,
    yearRange: { earliest: 2021, latest: 2024 },
    avgSentenceLength: 10.7
  },
  {
    word: "contemporary",
    definition: "Belonging to or occurring in the present time; modern",
    frequency: 19,
    difficulty: 4,
    rank: 9,
    pronunciation: "/kənˈtɛmpəˌrɛri/",
    synonyms: ["modern", "current", "present-day", "today's"],
    examples: ["Contemporary art often challenges traditional forms.", "This novel addresses contemporary social issues.", "Contemporary society faces many new challenges."],
    subjectAreas: ["arts", "history", "social"],
    questionCount: 5,
    yearRange: { earliest: 2020, latest: 2024 },
    avgSentenceLength: 9.5
  },
  {
    word: "diverse",
    definition: "Showing a great deal of variety; very different from each other",
    frequency: 18,
    difficulty: 3,
    rank: 10,
    pronunciation: "/daɪˈvɜrs/",
    synonyms: ["varied", "different", "assorted", "mixed"],
    examples: ["The university has a diverse student body.", "Korea has a diverse cultural heritage.", "The ecosystem contains diverse species of plants."],
    subjectAreas: ["social", "science", "history"],
    questionCount: 7,
    yearRange: { earliest: 2020, latest: 2024 },
    avgSentenceLength: 8.9
  },
  {
    word: "scrutinize",
    definition: "To examine something very carefully and thoroughly",
    frequency: 16,
    difficulty: 6,
    rank: 11,
    pronunciation: "/ˈskrutəˌnaɪz/",
    synonyms: ["examine", "inspect", "analyze", "study"],
    examples: ["The committee will scrutinize the proposal carefully.", "Scholars scrutinize historical documents for accuracy.", "We must scrutinize these results before publishing."],
    subjectAreas: ["english", "science", "history"],
    questionCount: 4,
    yearRange: { earliest: 2021, latest: 2024 },
    avgSentenceLength: 10.2
  },
  {
    word: "implications",
    definition: "The possible results, effects, or meanings of an action or decision",
    frequency: 15,
    difficulty: 5,
    rank: 12,
    pronunciation: "/ˌɪmpləˈkeɪʃənz/",
    synonyms: ["consequences", "effects", "results", "outcomes"],
    examples: ["What are the implications of this new policy?", "The study has important implications for education.", "Consider the long-term implications of your decision."],
    subjectAreas: ["social", "economics", "philosophy"],
    questionCount: 6,
    yearRange: { earliest: 2020, latest: 2024 },
    avgSentenceLength: 11.0
  }
];

async function initializeFirebase() {
  if (!admin.apps.length) {
    // For this demo, we'll use a simpler approach that works with your existing setup
    try {
      // Try to initialize with minimal config for testing
      admin.initializeApp({
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'your-project-id'
      });
    } catch (error) {
      console.log('⚠️ Firebase admin initialization failed, will create JSON file instead');
      return null;
    }
  }
  return admin.firestore();
}

async function createSampleData() {
  console.log('🔄 Creating sample vocabulary data...');
  
  const db = await initializeFirebase();
  
  if (!db) {
    // Create JSON file instead
    const fs = require('fs');
    const path = require('path');
    
    const sampleDataPath = path.join(__dirname, 'sample-vocabulary-data.json');
    const data = {
      vocabulary_words: SAMPLE_WORDS.reduce((acc, word) => {
        acc[word.word] = {
          ...word,
          extractedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        return acc;
      }, {}),
      extraction_metadata: {
        extractionId: `sample_${Date.now()}`,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'completed',
        statistics: {
          totalQuestions: 100,
          totalWords: 1500,
          uniqueWords: 500,
          storedWords: SAMPLE_WORDS.length,
          avgWordsPerQuestion: 15,
          topFrequency: 45
        }
      }
    };
    
    fs.writeFileSync(sampleDataPath, JSON.stringify(data, null, 2));
    console.log(`✅ Created sample data file: ${sampleDataPath}`);
    console.log('📋 To use this data:');
    console.log('1. Import this JSON into your Firebase Firestore');
    console.log('2. Or manually create a few vocabulary documents');
    console.log('3. Test your vocabulary component');
    return;
  }

  try {
    const batch = db.batch();
    
    // Add sample words to vocabulary collection (for backward compatibility)
    SAMPLE_WORDS.forEach(word => {
      const docRef = db.collection('vocabulary').doc(word.word);
      batch.set(docRef, {
        ...word,
        extractedAt: admin.firestore.Timestamp.now(),
        lastUpdated: admin.firestore.Timestamp.now()
      });
    });
    
    // Add sample words to new vocabulary_words collection
    SAMPLE_WORDS.forEach(word => {
      const docRef = db.collection('vocabulary_words').doc(word.word);
      batch.set(docRef, {
        ...word,
        extractedAt: admin.firestore.Timestamp.now(),
        lastUpdated: admin.firestore.Timestamp.now()
      });
    });
    
    // Add extraction metadata
    const metadataRef = db.collection('extraction_metadata').doc(`sample_${Date.now()}`);
    batch.set(metadataRef, {
      extractionId: `sample_${Date.now()}`,
      startTime: admin.firestore.Timestamp.now(),
      endTime: admin.firestore.Timestamp.now(),
      status: 'completed',
      statistics: {
        totalQuestions: 100,
        totalWords: 1500,
        uniqueWords: 500,
        storedWords: SAMPLE_WORDS.length,
        avgWordsPerQuestion: 15,
        topFrequency: 45
      },
      parameters: {
        minFrequency: 1,
        maxWords: 1000,
        excludeCommon: true,
        indexName: 'korean-english-question-pairs'
      }
    });
    
    await batch.commit();
    
    console.log(`✅ Successfully created ${SAMPLE_WORDS.length} sample vocabulary words`);
    console.log('📊 Sample words include:');
    SAMPLE_WORDS.slice(0, 5).forEach(word => {
      console.log(`   - "${word.word}" (frequency: ${word.frequency}, difficulty: ${word.difficulty})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    console.log('💡 Make sure your Firebase credentials are properly configured');
  }
}

async function main() {
  console.log('🧪 Sample Vocabulary Data Creator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await createSampleData();
  
  console.log('\n🎉 Sample data creation complete!');
  console.log('🔍 Next steps:');
  console.log('1. Test your vocabulary component');
  console.log('2. Check the vocabulary API endpoint');
  console.log('3. Run the app and navigate to vocabulary section');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createSampleData, SAMPLE_WORDS };