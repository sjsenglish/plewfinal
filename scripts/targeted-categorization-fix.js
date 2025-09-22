/**
 * Targeted Categorization Fix Script
 * Fixes specific issues in CSAT question categorization
 */

const { algoliasearch } = require('algoliasearch');
const fs = require('fs');

const CREDENTIALS = {
  ALGOLIA_APP_ID: '83MRCSJJZF',
  ALGOLIA_ADMIN_KEY: process.env.ALGOLIA_ADMIN_KEY || 'b86e2a01b3a8cfea08087452bacbed89'
};

// CRITICAL: Comprehension questions are ONLY these question numbers
const COMPREHENSION_QUESTION_NUMBERS = [18, 19, 26, 27, 28, 41, 42, 43, 44, 45];

// ============================================================================
// ADVANCED VOCABULARY ANALYSIS FUNCTIONS
// ============================================================================

const ACADEMIC_WORDS = [
  'therefore', 'consequently', 'furthermore', 'moreover', 'nevertheless', 'however',
  'nonetheless', 'additionally', 'subsequently', 'alternatively', 'specifically',
  'particularly', 'essentially', 'fundamentally', 'significantly', 'considerably',
  'ultimately', 'primarily', 'initially', 'subsequently', 'simultaneously',
  'predominantly', 'extensively', 'comprehensively', 'systematically', 'theoretically'
];

const LOW_FREQUENCY_WORDS = [
  'ubiquitous', 'paradigm', 'phenomenon', 'synthesis', 'hypothesis', 'methodology',
  'empirical', 'theoretical', 'substantial', 'comprehensive', 'prevalent', 'inherent',
  'intrinsic', 'conducive', 'derivative', 'prerequisite', 'subsequent', 'preliminary',
  'tentative', 'arbitrary', 'inevitable', 'compatible', 'feasible', 'sustainable',
  'ambiguous', 'explicit', 'implicit', 'coherent', 'comprehensive', 'sophisticated'
];

const TECHNICAL_TERMS = [
  'algorithm', 'mechanism', 'structure', 'function', 'process', 'system', 'method',
  'technique', 'approach', 'strategy', 'framework', 'model', 'theory', 'concept',
  'principle', 'criterion', 'parameter', 'variable', 'factor', 'component', 'element',
  'analysis', 'synthesis', 'evaluation', 'assessment', 'measurement', 'calculation',
  'experiment', 'research', 'investigation', 'observation', 'examination'
];

const ABSTRACT_WORDS = [
  'concept', 'idea', 'notion', 'principle', 'theory', 'philosophy', 'ideology',
  'perspective', 'viewpoint', 'attitude', 'belief', 'value', 'assumption', 'premise',
  'conclusion', 'inference', 'implication', 'consequence', 'significance', 'importance',
  'relevance', 'relationship', 'correlation', 'connection', 'association', 'pattern',
  'trend', 'tendency', 'characteristic', 'feature', 'attribute', 'quality', 'property'
];

function countWordMatches(words, targetWords) {
  const lowercaseWords = words.map(w => w.toLowerCase().replace(/[^\w]/g, ''));
  return targetWords.filter(target => 
    lowercaseWords.some(word => word.includes(target.toLowerCase()))
  ).length;
}

function calculateAverageWordLength(words) {
  const cleanWords = words.filter(w => w.length > 0);
  return cleanWords.reduce((sum, word) => sum + word.length, 0) / cleanWords.length;
}

function calculateVocabularyDemand(questionText, passageType) {
  const words = questionText.split(/\s+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')));
  
  // Core complexity factors
  const academicWords = countWordMatches(words, ACADEMIC_WORDS);
  const lowFrequencyWords = countWordMatches(words, LOW_FREQUENCY_WORDS);
  const technicalTerms = countWordMatches(words, TECHNICAL_TERMS);
  const abstractConcepts = countWordMatches(words, ABSTRACT_WORDS);
  const averageWordLength = calculateAverageWordLength(words);
  
  // Text length factors
  const wordCount = words.length;
  const uniqueWordRatio = uniqueWords.size / wordCount;
  
  // Sentence complexity
  const sentences = questionText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = wordCount / sentences.length;
  
  // Base score calculation
  let complexityScore = 
    (academicWords * 50) + 
    (lowFrequencyWords * 40) + 
    (technicalTerms * 60) +
    (abstractConcepts * 35) +
    (averageWordLength * 25) +
    (uniqueWordRatio * 100) +
    (avgWordsPerSentence > 20 ? 30 : 0) +
    (wordCount > 1000 ? 50 : wordCount > 500 ? 25 : 0);
  
  // Passage type modifiers (creates variation between types)
  const typeModifiers = {
    comprehension: 0.85,    // Narrative vocabulary, simpler
    analytical: 1.15,       // Technical/process vocabulary
    argumentative: 1.20,    // Academic/persuasive vocabulary  
    discursive: 1.05        // Balanced vocabulary
  };
  
  complexityScore *= typeModifiers[passageType] || 1.0;
  
  const finalVocab = Math.round(5000 + complexityScore);
  
  // Ensure realistic range: 5000-7500
  return Math.min(Math.max(finalVocab, 5000), 7500);
}

function createVocabBrackets(allScores) {
  const sorted = allScores.sort((a, b) => a - b);
  return {
    basic: sorted[Math.floor(sorted.length * 0.33)],      // Bottom 33%
    intermediate_max: sorted[Math.floor(sorted.length * 0.67)], // Top of middle 33%
    advanced_min: sorted[Math.floor(sorted.length * 0.67)]      // Top 33%
  };
}

// ============================================================================
// PASSAGE TYPE ANALYSIS
// ============================================================================

const PASSAGE_TYPE_KEYWORDS = {
  argumentative: [
    'argues that', 'claims', 'supports the view', 'advocates', 'position', 
    'strongly suggests', 'evidence shows', 'therefore', 'thus', 'consequently',
    'maintains', 'contends', 'asserts', 'persuade', 'convincing', 'compelling',
    'demonstrates', 'proves', 'establishes', 'confirms', 'validates'
  ],
  discursive: [
    'however', 'on the other hand', 'conversely', 'while some', 'others argue',
    'different perspectives', 'debate', 'controversy', 'both sides', 'alternatively',
    'nevertheless', 'in contrast', 'whereas', 'although', 'despite', 'yet',
    'conflicting views', 'opposing viewpoints', 'mixed opinions'
  ],
  analytical: [
    'process', 'analysis', 'examine', 'breakdown', 'systematic', 'step by step',
    'mechanism', 'how it works', 'causes', 'effects', 'method', 'procedure',
    'approach', 'technique', 'methodology', 'framework', 'structure', 'components',
    'elements', 'factors', 'variables', 'characteristics', 'features'
  ]
};

function analyzePassageType(questionText) {
  const text = questionText.toLowerCase();
  const results = {};
  let maxScore = 0;
  let bestMatch = 'comprehension'; // default fallback
  
  Object.entries(PASSAGE_TYPE_KEYWORDS).forEach(([type, keywords]) => {
    const score = countWordMatches([text], keywords);
    results[type] = score;
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = type;
    }
  });
  
  const confidence = maxScore > 1 ? 0.8 : maxScore > 0 ? 0.6 : 0.3;
  
  return {
    passageType: bestMatch,
    confidence,
    scores: results
  };
}

// ============================================================================
// MAIN PROCESSING FUNCTIONS
// ============================================================================

async function fetchAllRecords() {
  console.log('🔍 Fetching all records from Algolia index...');
  
  const client = algoliasearch(CREDENTIALS.ALGOLIA_APP_ID, CREDENTIALS.ALGOLIA_ADMIN_KEY);
  const allRecords = [];
  let page = 0;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const response = await client.search([{
        indexName: 'korean-english-question-pairs',
        params: {
          query: '',
          hitsPerPage: 100,
          page: page,
          attributesToRetrieve: ['*']
        }
      }]);
      
      const hits = response.results[0].hits;
      allRecords.push(...hits);
      
      console.log(`📄 Fetched page ${page + 1}, got ${hits.length} records (total: ${allRecords.length})`);
      
      if (hits.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
      
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`✅ Fetched total of ${allRecords.length} records`);
  return allRecords;
}

function processTargetedCorrections(records) {
  console.log('🔧 Processing targeted corrections...');
  
  const correctedRecords = [];
  const changes = {
    comprehensionFixed: [],
    passageTypeChanged: [],
    vocabularyUpdated: []
  };
  
  // Step 1: First pass - calculate all vocabulary scores for bracket creation
  console.log('📊 Calculating vocabulary complexity scores...');
  const allVocabScores = [];
  
  records.forEach(record => {
    // Determine correct passage type first
    let passageType;
    if (COMPREHENSION_QUESTION_NUMBERS.includes(parseInt(record.questionNumber))) {
      passageType = 'comprehension';
    } else {
      const analysis = analyzePassageType(record.questionText);
      passageType = analysis.passageType;
    }
    
    const vocabScore = calculateVocabularyDemand(record.questionText, passageType);
    allVocabScores.push(vocabScore);
  });
  
  const vocabBrackets = createVocabBrackets(allVocabScores);
  console.log('📊 Vocabulary brackets:', vocabBrackets);
  
  // Step 2: Process each record with corrections
  records.forEach(record => {
    const originalRecord = { ...record };
    let wasChanged = false;
    
    const questionNum = parseInt(record.questionNumber);
    
    // Fix comprehension questions by question number
    if (COMPREHENSION_QUESTION_NUMBERS.includes(questionNum)) {
      if (record.passageType !== 'comprehension' || 
          record.primarySubjectArea !== 'literature_arts' || 
          record.secondarySubjectArea !== 'fiction') {
        
        record.passageType = 'comprehension';
        record.primarySubjectArea = 'literature_arts';
        record.secondarySubjectArea = 'fiction';
        wasChanged = true;
        
        changes.comprehensionFixed.push({
          questionNumber: questionNum,
          before: {
            passageType: originalRecord.passageType,
            primarySubjectArea: originalRecord.primarySubjectArea,
            secondarySubjectArea: originalRecord.secondarySubjectArea
          },
          after: {
            passageType: 'comprehension',
            primarySubjectArea: 'literature_arts',
            secondarySubjectArea: 'fiction'
          }
        });
      }
    } else {
      // Re-analyze passage type for non-comprehension questions
      const analysis = analyzePassageType(record.questionText);
      if (record.passageType !== analysis.passageType) {
        record.passageType = analysis.passageType;
        wasChanged = true;
        
        changes.passageTypeChanged.push({
          questionNumber: questionNum,
          before: originalRecord.passageType,
          after: analysis.passageType,
          confidence: analysis.confidence,
          scores: analysis.scores
        });
      }
    }
    
    // Recalculate vocabulary demand
    const newVocabDemand = calculateVocabularyDemand(record.questionText, record.passageType);
    if (record.vocabularyDemand !== newVocabDemand) {
      const oldVocab = record.vocabularyDemand;
      record.vocabularyDemand = newVocabDemand;
      wasChanged = true;
      
      changes.vocabularyUpdated.push({
        questionNumber: questionNum,
        before: oldVocab,
        after: newVocabDemand,
        passageType: record.passageType
      });
    }
    
    if (wasChanged) {
      // Clean up for upload
      const { _highlightResult, _confidence, _classification_details, ...cleanRecord } = record;
      correctedRecords.push(cleanRecord);
    }
  });
  
  return { correctedRecords, changes, vocabBrackets };
}

function generateDetailedAnalysis(originalRecords, changes, vocabBrackets) {
  console.log('\n📊 DETAILED BEFORE/AFTER ANALYSIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Passage type distribution changes
  const originalDistribution = {};
  const newDistribution = {};
  
  originalRecords.forEach(record => {
    const type = record.passageType;
    originalDistribution[type] = (originalDistribution[type] || 0) + 1;
  });
  
  // Calculate new distribution after changes
  originalRecords.forEach(record => {
    let newType = record.passageType;
    
    // Apply comprehension fixes
    if (COMPREHENSION_QUESTION_NUMBERS.includes(parseInt(record.questionNumber))) {
      newType = 'comprehension';
    } else {
      // Apply passage type changes
      const change = changes.passageTypeChanged.find(c => c.questionNumber === parseInt(record.questionNumber));
      if (change) {
        newType = change.after;
      }
    }
    
    newDistribution[newType] = (newDistribution[newType] || 0) + 1;
  });
  
  console.log('\n🔄 PASSAGE TYPE DISTRIBUTION CHANGES:');
  Object.keys({...originalDistribution, ...newDistribution}).forEach(type => {
    const before = originalDistribution[type] || 0;
    const after = newDistribution[type] || 0;
    const change = after - before;
    const changeStr = change > 0 ? `+${change}` : change.toString();
    console.log(`  ${type}: ${before} → ${after} (${changeStr})`);
  });
  
  // Vocabulary score ranges by passage type
  console.log('\n📚 VOCABULARY SCORE RANGES BY PASSAGE TYPE:');
  const vocabByType = {};
  
  changes.vocabularyUpdated.forEach(change => {
    const type = change.passageType;
    if (!vocabByType[type]) vocabByType[type] = [];
    vocabByType[type].push(change.after);
  });
  
  Object.entries(vocabByType).forEach(([type, scores]) => {
    const sorted = scores.sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
    console.log(`  ${type}: ${min}-${max} (avg: ${avg})`);
  });
  
  console.log('\n📊 DYNAMIC VOCABULARY BRACKETS:');
  console.log(`  Basic (bottom 33%): ≤${vocabBrackets.basic}`);
  console.log(`  Intermediate (middle 33%): ${vocabBrackets.basic + 1}-${vocabBrackets.intermediate_max}`);
  console.log(`  Advanced (top 33%): ≥${vocabBrackets.advanced_min}`);
  
  // Question numbers that changed categories
  console.log('\n📝 COMPREHENSION QUESTIONS FIXED:');
  changes.comprehensionFixed.forEach(change => {
    console.log(`  Q${change.questionNumber}: ${change.before.passageType} → comprehension`);
  });
  
  if (changes.passageTypeChanged.length > 0) {
    console.log('\n🔄 PASSAGE TYPE CHANGES (Top 10):');
    changes.passageTypeChanged.slice(0, 10).forEach(change => {
      console.log(`  Q${change.questionNumber}: ${change.before} → ${change.after} (confidence: ${change.confidence})`);
    });
    if (changes.passageTypeChanged.length > 10) {
      console.log(`  ... and ${changes.passageTypeChanged.length - 10} more`);
    }
  }
  
  return {
    totalRecordsProcessed: originalRecords.length,
    recordsChanged: changes.comprehensionFixed.length + changes.passageTypeChanged.length,
    comprehensionFixed: changes.comprehensionFixed.length,
    passageTypeChanged: changes.passageTypeChanged.length,
    vocabularyUpdated: changes.vocabularyUpdated.length
  };
}

async function uploadCorrectedRecords(correctedRecords) {
  if (correctedRecords.length === 0) {
    console.log('ℹ️  No records need updating');
    return;
  }
  
  console.log(`\n🚀 Uploading ${correctedRecords.length} corrected records...`);
  
  const client = algoliasearch(CREDENTIALS.ALGOLIA_APP_ID, CREDENTIALS.ALGOLIA_ADMIN_KEY);
  
  // Upload in batches of 100
  const batchSize = 100;
  let uploaded = 0;
  
  for (let i = 0; i < correctedRecords.length; i += batchSize) {
    const batch = correctedRecords.slice(i, i + batchSize);
    
    try {
      await client.saveObjects({
        indexName: 'korean-english-question-pairs',
        objects: batch
      });
      
      uploaded += batch.length;
      console.log(`  Uploaded batch ${Math.floor(i / batchSize) + 1}: ${uploaded}/${correctedRecords.length} records`);
      
    } catch (error) {
      console.error(`❌ Error uploading batch ${Math.floor(i / batchSize) + 1}:`, error);
      throw error;
    }
  }
  
  console.log(`✅ Successfully uploaded ${uploaded} corrected records!`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🎯 Starting Targeted CSAT Categorization Correction...\n');
  
  try {
    // 1. Fetch all records
    const originalRecords = await fetchAllRecords();
    
    if (originalRecords.length === 0) {
      console.log('❌ No records found to process');
      return;
    }
    
    // 2. Process corrections
    const { correctedRecords, changes, vocabBrackets } = processTargetedCorrections(originalRecords);
    
    // 3. Generate detailed analysis
    const summary = generateDetailedAnalysis(originalRecords, changes, vocabBrackets);
    
    // 4. Save analysis report
    const reportData = {
      summary,
      changes,
      vocabBrackets,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      '/Users/sj/Desktop/plew/scripts/categorization-fix-report.json',
      JSON.stringify(reportData, null, 2)
    );
    
    // 5. Upload corrected records
    await uploadCorrectedRecords(correctedRecords);
    
    console.log('\n✅ CORRECTION COMPLETE!');
    console.log(`📊 Summary: ${summary.recordsChanged}/${summary.totalRecordsProcessed} records updated`);
    console.log(`   - Comprehension questions fixed: ${summary.comprehensionFixed}`);
    console.log(`   - Passage types changed: ${summary.passageTypeChanged}`);
    console.log(`   - Vocabulary scores updated: ${summary.vocabularyUpdated}`);
    console.log('📁 Report saved to: categorization-fix-report.json');
    
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  }
}

// Run the correction
if (require.main === module) {
  main();
}

module.exports = {
  calculateVocabularyDemand,
  analyzePassageType,
  createVocabBrackets,
  COMPREHENSION_QUESTION_NUMBERS
};