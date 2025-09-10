/**
 * Add Test Vocabulary Data
 * 
 * This script adds sample vocabulary data directly to your Firebase 
 * using the existing vocabulary collection structure.
 */

// Since we can't access Firebase admin directly, let's create the data in a format
// that can be manually added to Firestore or help you understand the structure

const TEST_VOCABULARY = [
  {
    word: "analyze",
    definition: "To examine something in detail to understand it better or discover more about it",
    frequency: 45,
    difficulty: 4,
    pronunciation: "/ˈænəlaɪz/",
    synonyms: ["examine", "study", "investigate", "scrutinize"],
    examples: [
      "Students must analyze the given passage carefully.",
      "The data shows an interesting pattern when we analyze it.",
      "Please analyze the author's argument in paragraph three."
    ],
    subjectArea: "english",
    subjectAreas: ["english", "literature", "science"],
    questionCount: 15,
    yearRange: { earliest: 2020, latest: 2024 },
    avgSentenceLength: 12.5,
    questionInfo: { number: "15", year: "2023" },
    koreanTranslation: "분석하다",
    collocations: ["analyze data", "analyze results", "analyze information"],
    etymology: "From Greek 'analusis' meaning 'a breaking up'",
    audioUrl: null,
    rank: 1,
    extractedAt: new Date(),
    lastUpdated: new Date()
  },
  {
    word: "interpret",
    definition: "To explain the meaning of something or to understand something in a particular way",
    frequency: 38,
    difficulty: 5,
    pronunciation: "/ɪnˈtɜrprɪt/",
    synonyms: ["explain", "clarify", "decode", "understand"],
    examples: [
      "How do you interpret this graph?",
      "The critic interpreted the poem differently.",
      "Students should interpret the data objectively."
    ],
    subjectArea: "english",
    subjectAreas: ["english", "literature", "arts"],
    questionCount: 12,
    yearRange: { earliest: 2021, latest: 2024 },
    avgSentenceLength: 11.8,
    questionInfo: { number: "8", year: "2023" },
    koreanTranslation: "해석하다",
    collocations: ["interpret results", "interpret meaning", "interpret correctly"],
    etymology: "From Latin 'interpretari' meaning 'to explain'",
    audioUrl: null,
    rank: 2,
    extractedAt: new Date(),
    lastUpdated: new Date()
  },
  {
    word: "synthesis",
    definition: "The combination of different ideas, styles, or things to create something new",
    frequency: 32,
    difficulty: 7,
    pronunciation: "/ˈsɪnθəsɪs/",
    synonyms: ["combination", "fusion", "integration", "merger"],
    examples: [
      "The essay requires synthesis of multiple sources.",
      "Her research represents a synthesis of Eastern and Western philosophy.",
      "The synthesis of these elements creates a unique compound."
    ],
    subjectArea: "science",
    subjectAreas: ["science", "philosophy", "english"],
    questionCount: 10,
    yearRange: { earliest: 2020, latest: 2024 },
    avgSentenceLength: 13.2,
    questionInfo: { number: "12", year: "2022" },
    koreanTranslation: "종합, 합성",
    collocations: ["synthesis process", "chemical synthesis", "data synthesis"],
    etymology: "From Greek 'synthesis' meaning 'putting together'",
    audioUrl: null,
    rank: 3,
    extractedAt: new Date(),
    lastUpdated: new Date()
  },
  {
    word: "hypothesis",
    definition: "A proposed explanation for a phenomenon, used as a starting point for investigation",
    frequency: 28,
    difficulty: 6,
    pronunciation: "/haɪˈpɑθəsɪs/",
    synonyms: ["theory", "assumption", "supposition", "conjecture"],
    examples: [
      "The scientist tested her hypothesis through experiments.",
      "What hypothesis can you form based on this evidence?",
      "The data supports our initial hypothesis."
    ],
    subjectArea: "science",
    subjectAreas: ["science", "psychology"],
    questionCount: 8,
    yearRange: { earliest: 2021, latest: 2024 },
    avgSentenceLength: 10.5,
    questionInfo: { number: "5", year: "2023" },
    koreanTranslation: "가설",
    collocations: ["test hypothesis", "null hypothesis", "alternative hypothesis"],
    etymology: "From Greek 'hypothesis' meaning 'foundation'",
    audioUrl: null,
    rank: 4,
    extractedAt: new Date(),
    lastUpdated: new Date()
  },
  {
    word: "paradigm",
    definition: "A typical example or pattern of something; a model or framework for understanding",
    frequency: 25,
    difficulty: 8,
    pronunciation: "/ˈpærədaɪm/",
    synonyms: ["model", "framework", "pattern", "example"],
    examples: [
      "This discovery represents a new paradigm in physics.",
      "The old paradigm of learning is being challenged.",
      "We need to shift our paradigm to solve this problem."
    ],
    subjectArea: "philosophy",
    subjectAreas: ["science", "philosophy", "social"],
    questionCount: 7,
    yearRange: { earliest: 2020, latest: 2023 },
    avgSentenceLength: 12.0,
    questionInfo: { number: "18", year: "2022" },
    koreanTranslation: "패러다임",
    collocations: ["paradigm shift", "new paradigm", "scientific paradigm"],
    etymology: "From Greek 'paradeigma' meaning 'pattern'",
    audioUrl: null,
    rank: 5,
    extractedAt: new Date(),
    lastUpdated: new Date()
  }
];

function generateFirestoreCommands() {
  console.log('🔥 Firestore Commands to Add Test Vocabulary Data');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Copy and paste these commands in your Firebase Console:');
  console.log('');
  
  TEST_VOCABULARY.forEach((word, index) => {
    console.log(`// Add word ${index + 1}: "${word.word}"`);
    console.log(`db.collection('vocabulary').doc('${word.word}').set({`);
    console.log(`  word: "${word.word}",`);
    console.log(`  definition: "${word.definition}",`);
    console.log(`  frequency: ${word.frequency},`);
    console.log(`  difficulty: ${word.difficulty},`);
    console.log(`  pronunciation: "${word.pronunciation}",`);
    console.log(`  synonyms: ${JSON.stringify(word.synonyms)},`);
    console.log(`  examples: ${JSON.stringify(word.examples)},`);
    console.log(`  subjectArea: "${word.subjectArea}",`);
    console.log(`  subjectAreas: ${JSON.stringify(word.subjectAreas)},`);
    console.log(`  questionCount: ${word.questionCount},`);
    console.log(`  yearRange: ${JSON.stringify(word.yearRange)},`);
    console.log(`  avgSentenceLength: ${word.avgSentenceLength},`);
    console.log(`  questionInfo: ${JSON.stringify(word.questionInfo)},`);
    console.log(`  koreanTranslation: "${word.koreanTranslation}",`);
    console.log(`  rank: ${word.rank},`);
    console.log(`  extractedAt: new Date(),`);
    console.log(`  lastUpdated: new Date()`);
    console.log(`});`);
    console.log('');
  });
}

function generateJSONForImport() {
  console.log('📋 JSON Data for Firebase Import');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const firestoreData = {
    vocabulary: {}
  };
  
  TEST_VOCABULARY.forEach(word => {
    firestoreData.vocabulary[word.word] = {
      ...word,
      extractedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  });
  
  console.log(JSON.stringify(firestoreData, null, 2));
}

function main() {
  console.log('🧪 Test Vocabulary Data Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('This script generates test vocabulary data for your Firebase collection.');
  console.log('Choose one of the following methods:');
  console.log('');
  console.log('Method 1: Firebase Console Commands');
  console.log('Method 2: JSON Import Data');
  console.log('');
  
  const method = process.argv[2] || 'commands';
  
  if (method === 'json') {
    generateJSONForImport();
  } else {
    generateFirestoreCommands();
  }
  
  console.log('');
  console.log('📝 Instructions:');
  console.log('1. Go to Firebase Console → Firestore Database');
  console.log('2. Run the commands above OR import the JSON data');
  console.log('3. Refresh your vocabulary page');
  console.log('4. You should see the test words with definitions and examples');
  console.log('');
  console.log('🎯 Expected Result:');
  console.log('- 5 test vocabulary words with full data');
  console.log('- Definitions, synonyms, examples all populated');
  console.log('- Korean translations included');
  console.log('- CSAT example sentences with question info');
}

if (require.main === module) {
  main();
}

module.exports = { TEST_VOCABULARY };