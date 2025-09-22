/**
 * Korean-English Question Categorization Script
 * Analyzes existing Algolia index and adds new categorization fields
 */

const { liteClient: algoliasearch } = require('algoliasearch/lite');
const fs = require('fs');

const CREDENTIALS = {
  ALGOLIA_APP_ID: '83MRCSJJZF',
  ALGOLIA_SEARCH_KEY: 'e96a3b50c7390bdcfdd0b4c5ee7ea130'
};

// ============================================================================
// CLASSIFICATION KEYWORDS AND RULES
// ============================================================================

const SUBJECT_KEYWORDS = {
  natural_sciences: {
    primary: ['evolution', 'species', 'organisms', 'cells', 'DNA', 'molecules', 'atoms', 'reactions', 'energy', 'force', 'motion', 'climate', 'ecosystem', 'biological', 'chemical', 'physical', 'scientific study', 'research shows', 'experiments', 'laboratory', 'hypothesis', 'data', 'analysis'],
    secondary: {
      biology: ['evolution', 'species', 'organisms', 'cells', 'genes', 'DNA', 'ecosystem', 'habitat', 'adaptation', 'natural selection', 'protein', 'enzymes', 'genetics', 'reproduction', 'photosynthesis'],
      chemistry: ['molecules', 'atoms', 'compounds', 'reactions', 'elements', 'chemical bonds', 'laboratory', 'solution', 'acid', 'base', 'organic', 'inorganic', 'periodic table'],
      physics: ['energy', 'force', 'motion', 'gravity', 'electromagnetic', 'quantum', 'mechanics', 'waves', 'electricity', 'magnetism', 'thermodynamics', 'optics'],
      environmental_science: ['climate', 'ecosystem', 'environment', 'pollution', 'sustainability', 'renewable', 'conservation', 'global warming', 'biodiversity']
    }
  },
  
  social_sciences: {
    primary: ['behavior', 'society', 'economic', 'market', 'government', 'policy', 'psychological', 'social', 'cultural', 'political', 'democracy', 'business', 'financial', 'human behavior', 'social interaction', 'community', 'population', 'statistics'],
    secondary: {
      psychology: ['behavior', 'cognitive', 'mental', 'brain', 'emotions', 'personality', 'mind', 'consciousness', 'learning', 'memory', 'perception', 'development'],
      economics: ['economic', 'market', 'business', 'financial', 'money', 'trade', 'investment', 'profit', 'cost', 'supply', 'demand', 'employment'],
      politics: ['government', 'policy', 'political', 'democracy', 'election', 'vote', 'law', 'constitution', 'parliament', 'minister', 'citizen'],
      current_affairs: ['news', 'recent', 'contemporary', 'modern', 'today', 'current events', 'media', 'journalism', 'report']
    }
  },
  
  literature_arts: {
    primary: ['story', 'character', 'narrative', 'artistic', 'creative', 'aesthetic', 'painting', 'music', 'literary', 'author', 'novel', 'poem', 'performance', 'entertainment', 'cultural expression', 'drama', 'fiction'],
    secondary: {
      literature: ['story', 'character', 'narrative', 'author', 'novel', 'poem', 'fiction', 'plot', 'dialogue', 'protagonist', 'theme', 'metaphor'],
      art: ['artistic', 'creative', 'aesthetic', 'painting', 'visual', 'design', 'sculpture', 'gallery', 'exhibition', 'canvas'],
      music: ['music', 'song', 'musical', 'instrument', 'melody', 'rhythm', 'concert', 'performance', 'composer', 'orchestra'],
      media: ['entertainment', 'media', 'film', 'movie', 'television', 'broadcast', 'show', 'performance', 'actor'],
      fiction: ['fiction', 'fantasy', 'science fiction', 'novel', 'story', 'tale', 'imaginary', 'fictional']
    }
  },
  
  humanities: {
    primary: ['history', 'historical', 'ancient', 'civilization', 'philosophical', 'ethics', 'moral', 'wisdom', 'geography', 'geographical', 'cultural heritage', 'tradition', 'values', 'human experience', 'culture', 'religion'],
    secondary: {
      history: ['history', 'historical', 'ancient', 'civilization', 'past', 'century', 'war', 'empire', 'dynasty', 'revolution'],
      philosophy: ['philosophical', 'ethics', 'moral', 'wisdom', 'values', 'belief', 'truth', 'knowledge', 'existence', 'consciousness'],
      geography: ['geography', 'geographical', 'location', 'region', 'country', 'continent', 'mountain', 'river', 'climate', 'territory'],
      technology: ['technology', 'technological', 'innovation', 'digital', 'computer', 'internet', 'artificial intelligence', 'automation']
    }
  }
};

const PASSAGE_TYPE_KEYWORDS = {
  argumentative: ['argues that', 'claims', 'supports the view', 'advocates', 'position', 'strongly suggests', 'evidence shows', 'therefore', 'thus', 'consequently', 'maintains', 'contends', 'asserts', 'persuade'],
  discursive: ['however', 'on the other hand', 'conversely', 'while some', 'others argue', 'different perspectives', 'debate', 'controversy', 'both sides', 'alternatively', 'nevertheless', 'in contrast'],
  analytical: ['process', 'analysis', 'examine', 'breakdown', 'systematic', 'step by step', 'mechanism', 'how it works', 'causes', 'effects', 'method', 'procedure', 'approach', 'technique'],
  comprehension: ['dialogue', 'he said', 'she replied', 'character', 'story', 'narrative', 'once upon', 'fictional', 'tale', 'plot', 'scene']
};

const TEXT_SOURCE_INDICATORS = {
  academic_journal: ['abstract', 'methodology', 'peer review', 'citation', 'bibliography', 'research findings', 'study', 'journal', 'academic', 'scholarly'],
  university_textbook: ['chapter', 'section', 'textbook', 'educational', 'learning objectives', 'course', 'curriculum', 'syllabus'],
  popular_media: ['magazine', 'newspaper', 'blog', 'article', 'accessible', 'general public', 'popular', 'mainstream'],
  news_article: ['according to', 'reported', 'sources say', 'news', 'breaking', 'correspondent', 'journalist'],
  scientific_publication: ['study conducted', 'results indicate', 'research', 'experiment', 'hypothesis', 'data analysis', 'findings'],
  literary_work: ['creative', 'artistic', 'metaphor', 'symbolism', 'literary', 'prose', 'poetry', 'fiction']
};

// Question type mappings
const QUESTION_TYPE_MAPPING = {
  'Title Selection': 'title_selection',
  'Main Idea': 'main_idea',
  'Fill in the Blank': 'fill_blank',
  'Factual Comprehension': 'factual_comprehension',
  'Reference': 'reference_understanding',
  'Paragraph Order': 'paragraph_ordering',
  'Vocabulary in Context': 'vocabulary_context',
  'Inference': 'inference',
  'Tone and Attitude': 'tone_attitude',
  'Logical Structure': 'logical_structure'
};

// ============================================================================
// CLASSIFICATION FUNCTIONS
// ============================================================================

/**
 * Score text against keyword sets
 */
function scoreKeywords(text, keywords, weights = {}) {
  const normalizedText = text.toLowerCase();
  let score = 0;
  let matchedKeywords = [];
  
  keywords.forEach(keyword => {
    const weight = weights[keyword] || 1;
    if (normalizedText.includes(keyword.toLowerCase())) {
      score += weight;
      matchedKeywords.push(keyword);
    }
  });
  
  return { score, matchedKeywords };
}

/**
 * Determine source classification (기출 vs 유사)
 */
function classifySource(record) {
  const year = parseInt(record.year);
  
  // 기출 if real exam years (2020-2025)
  if (year >= 2020 && year <= 2025) {
    return {
      source: 'past-paper',
      confidence: 0.95
    };
  }
  
  // 유사 for other cases
  return {
    source: 'similar',
    confidence: 0.8
  };
}

/**
 * Determine primary and secondary subject areas
 */
function classifySubject(record) {
  const text = `${record.questionText} ${record.theoryArea}`.toLowerCase();
  const results = {};
  let maxScore = 0;
  let bestMatch = null;
  
  // Score each primary subject
  Object.entries(SUBJECT_KEYWORDS).forEach(([subject, data]) => {
    const { score, matchedKeywords } = scoreKeywords(text, data.primary);
    results[subject] = { score, matchedKeywords };
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = subject;
    }
  });
  
  if (!bestMatch || maxScore === 0) {
    // Fallback: use theoryArea mapping
    const theoryArea = record.theoryArea.toLowerCase();
    if (theoryArea.includes('evolution') || theoryArea.includes('science')) {
      bestMatch = 'natural_sciences';
    } else if (theoryArea.includes('relationship') || theoryArea.includes('social')) {
      bestMatch = 'social_sciences';
    } else if (theoryArea.includes('literature') || theoryArea.includes('story')) {
      bestMatch = 'literature_arts';
    } else {
      bestMatch = 'humanities';
    }
  }
  
  // Determine secondary subject
  let secondarySubject = 'general';
  let secondaryMaxScore = 0;
  
  if (bestMatch && SUBJECT_KEYWORDS[bestMatch].secondary) {
    Object.entries(SUBJECT_KEYWORDS[bestMatch].secondary).forEach(([subSubject, keywords]) => {
      const { score } = scoreKeywords(text, keywords);
      if (score > secondaryMaxScore) {
        secondaryMaxScore = score;
        secondarySubject = subSubject;
      }
    });
  }
  
  const confidence = maxScore > 2 ? 0.8 : maxScore > 0 ? 0.6 : 0.3;
  
  return {
    primarySubject: bestMatch,
    secondarySubject,
    confidence,
    details: results
  };
}

/**
 * Determine passage type
 */
function classifyPassageType(record) {
  const text = record.questionText.toLowerCase();
  const results = {};
  let maxScore = 0;
  let bestMatch = 'comprehension'; // default
  
  Object.entries(PASSAGE_TYPE_KEYWORDS).forEach(([type, keywords]) => {
    const { score, matchedKeywords } = scoreKeywords(text, keywords);
    results[type] = { score, matchedKeywords };
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = type;
    }
  });
  
  const confidence = maxScore > 1 ? 0.8 : maxScore > 0 ? 0.6 : 0.4;
  
  return {
    passageType: bestMatch,
    confidence,
    details: results
  };
}

/**
 * Determine text source
 */
function classifyTextSource(record) {
  const text = record.questionText.toLowerCase();
  const results = {};
  let maxScore = 0;
  let bestMatch = 'university_textbook'; // default for educational content
  
  Object.entries(TEXT_SOURCE_INDICATORS).forEach(([source, keywords]) => {
    const { score, matchedKeywords } = scoreKeywords(text, keywords);
    results[source] = { score, matchedKeywords };
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = source;
    }
  });
  
  const confidence = maxScore > 1 ? 0.8 : maxScore > 0 ? 0.6 : 0.4;
  
  return {
    textSource: bestMatch,
    confidence,
    details: results
  };
}

/**
 * Calculate difficulty metrics
 */
function calculateDifficulty(record) {
  const text = record.questionText;
  const questionType = record.questionType;
  
  // Question type difficulty weights
  const typeWeights = {
    'Title Selection': 0.6,
    'Main Idea': 0.7,
    'Factual Comprehension': 0.4,
    'Reference': 0.5,
    'Vocabulary in Context': 0.8,
    'Inference': 0.9,
    'Paragraph Order': 0.7,
    'Tone and Attitude': 0.8,
    'Logical Structure': 0.9
  };
  
  // Text complexity factors
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).length;
  const avgWordsPerSentence = wordCount / sentenceCount;
  
  // Base difficulty from question type
  const baseScore = typeWeights[questionType] || 0.6;
  
  // Complexity adjustments
  let complexityScore = 0;
  if (wordCount > 800) complexityScore += 0.2;
  if (avgWordsPerSentence > 20) complexityScore += 0.1;
  if (text.includes('however') || text.includes('nevertheless')) complexityScore += 0.1;
  
  const finalScore = Math.min(1.0, baseScore + complexityScore);
  
  // Convert to categories
  let level;
  if (finalScore < 0.4) level = 'low';
  else if (finalScore < 0.6) level = 'medium';
  else if (finalScore < 0.8) level = 'high';
  else level = 'very_high';
  
  // Expected correct rate (inverse of difficulty)
  const expectedCorrectRate = Math.max(0.2, Math.min(0.8, 1.0 - finalScore + 0.2));
  
  // Vocabulary demand estimation
  const vocabularyDemand = Math.min(9000, 5000 + (wordCount * 2) + (complexityScore * 2000));
  
  return {
    level,
    expectedCorrectRate: Math.round(expectedCorrectRate * 100) / 100,
    vocabularyDemand: Math.round(vocabularyDemand),
    difficultyScore: Math.round(finalScore * 100) / 100
  };
}

/**
 * Create enhanced record with all new categorizations
 */
function enhanceRecord(record) {
  const sourceClass = classifySource(record);
  const subjectClass = classifySubject(record);
  const passageClass = classifyPassageType(record);
  const textSourceClass = classifyTextSource(record);
  const difficulty = calculateDifficulty(record);
  
  // Map question skill
  const questionSkill = QUESTION_TYPE_MAPPING[record.questionType] || 'other';
  
  return {
    ...record,
    // New categorization fields
    source: sourceClass.source,
    primarySubjectArea: subjectClass.primarySubject,
    secondarySubjectArea: subjectClass.secondarySubject,
    passageType: passageClass.passageType,
    questionSkill,
    difficultyLevel: difficulty.level,
    expectedCorrectRate: difficulty.expectedCorrectRate,
    vocabularyDemand: difficulty.vocabularyDemand,
    textSource: textSourceClass.textSource,
    
    // Confidence scores for manual review
    _confidence: {
      source: sourceClass.confidence,
      subject: subjectClass.confidence,
      passage: passageClass.confidence,
      textSource: textSourceClass.confidence
    },
    
    // Classification details for debugging
    _classification_details: {
      subject: subjectClass.details,
      passage: passageClass.details,
      textSource: textSourceClass.details,
      difficulty: difficulty
    }
  };
}

// ============================================================================
// MAIN PROCESSING FUNCTIONS
// ============================================================================

async function fetchAllRecords() {
  console.log('🔍 Fetching all records from Algolia index...');
  
  const searchClient = algoliasearch(CREDENTIALS.ALGOLIA_APP_ID, CREDENTIALS.ALGOLIA_SEARCH_KEY);
  const allRecords = [];
  let page = 0;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const response = await searchClient.search([{
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

async function processRecords() {
  console.log('🚀 Starting Korean-English Question Categorization...\n');
  
  try {
    // Fetch all records
    const records = await fetchAllRecords();
    
    if (records.length === 0) {
      console.log('❌ No records found to process');
      return;
    }
    
    console.log('\n📊 Processing records with new categorizations...');
    
    // Process each record
    const enhancedRecords = [];
    const lowConfidenceRecords = [];
    
    records.forEach((record, index) => {
      try {
        const enhanced = enhanceRecord(record);
        enhancedRecords.push(enhanced);
        
        // Check for low confidence classifications
        const confidence = enhanced._confidence;
        if (confidence.subject < 0.6 || confidence.passage < 0.6) {
          lowConfidenceRecords.push({
            objectID: enhanced.objectID,
            questionType: enhanced.questionType,
            theoryArea: enhanced.theoryArea,
            confidence: confidence,
            classifications: {
              primary: enhanced.primarySubjectArea,
              secondary: enhanced.secondarySubjectArea,
              passage: enhanced.passageType
            }
          });
        }
        
        if ((index + 1) % 50 === 0) {
          console.log(`  Processed ${index + 1}/${records.length} records...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing record ${record.objectID}:`, error);
      }
    });
    
    console.log(`\n✅ Successfully processed ${enhancedRecords.length} records`);
    
    // Generate statistics
    generateStatistics(enhancedRecords);
    
    // Flag low confidence records
    if (lowConfidenceRecords.length > 0) {
      console.log(`\n⚠️  Found ${lowConfidenceRecords.length} low-confidence classifications for manual review`);
      fs.writeFileSync(
        '/Users/sj/Desktop/plew/scripts/low-confidence-classifications.json',
        JSON.stringify(lowConfidenceRecords, null, 2)
      );
    }
    
    // Export enhanced records
    console.log('\n💾 Exporting enhanced records...');
    
    // Full export for Algolia upload
    fs.writeFileSync(
      '/Users/sj/Desktop/plew/scripts/enhanced-korean-english-questions.json',
      JSON.stringify(enhancedRecords, null, 2)
    );
    
    // Sample export (first 10 records) for review
    fs.writeFileSync(
      '/Users/sj/Desktop/plew/scripts/sample-enhanced-questions.json',
      JSON.stringify(enhancedRecords.slice(0, 10), null, 2)
    );
    
    console.log('✅ Export completed!');
    console.log('📁 Files created:');
    console.log('   - enhanced-korean-english-questions.json (full dataset)');
    console.log('   - sample-enhanced-questions.json (first 10 records)');
    if (lowConfidenceRecords.length > 0) {
      console.log('   - low-confidence-classifications.json (manual review needed)');
    }
    
  } catch (error) {
    console.error('❌ Error in main processing:', error);
  }
}

function generateStatistics(records) {
  console.log('\n📊 CLASSIFICATION STATISTICS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Source distribution
  const sourceStats = {};
  const primarySubjectStats = {};
  const secondarySubjectStats = {};
  const passageTypeStats = {};
  const difficultyStats = {};
  const questionSkillStats = {};
  
  records.forEach(record => {
    // Count distributions
    sourceStats[record.source] = (sourceStats[record.source] || 0) + 1;
    primarySubjectStats[record.primarySubjectArea] = (primarySubjectStats[record.primarySubjectArea] || 0) + 1;
    secondarySubjectStats[record.secondarySubjectArea] = (secondarySubjectStats[record.secondarySubjectArea] || 0) + 1;
    passageTypeStats[record.passageType] = (passageTypeStats[record.passageType] || 0) + 1;
    difficultyStats[record.difficultyLevel] = (difficultyStats[record.difficultyLevel] || 0) + 1;
    questionSkillStats[record.questionSkill] = (questionSkillStats[record.questionSkill] || 0) + 1;
  });
  
  console.log('\n🎯 Source Distribution:');
  Object.entries(sourceStats).forEach(([key, count]) => {
    const percentage = ((count / records.length) * 100).toFixed(1);
    console.log(`  ${key}: ${count} (${percentage}%)`);
  });
  
  console.log('\n🔬 Primary Subject Distribution:');
  Object.entries(primarySubjectStats).forEach(([key, count]) => {
    const percentage = ((count / records.length) * 100).toFixed(1);
    console.log(`  ${key}: ${count} (${percentage}%)`);
  });
  
  console.log('\n📚 Passage Type Distribution:');
  Object.entries(passageTypeStats).forEach(([key, count]) => {
    const percentage = ((count / records.length) * 100).toFixed(1);
    console.log(`  ${key}: ${count} (${percentage}%)`);
  });
  
  console.log('\n🎚️  Difficulty Distribution:');
  Object.entries(difficultyStats).forEach(([key, count]) => {
    const percentage = ((count / records.length) * 100).toFixed(1);
    console.log(`  ${key}: ${count} (${percentage}%)`);
  });
}

// Run the main process
if (require.main === module) {
  processRecords();
}

module.exports = {
  enhanceRecord,
  classifySource,
  classifySubject,
  classifyPassageType,
  calculateDifficulty
};