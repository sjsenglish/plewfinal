/**
 * Client-Side Vocabulary Extractor - Focus on Intermediate & Advanced Words
 * 
 * This script extracts vocabulary using the Firebase client SDK (no admin required)
 */

const { liteClient: algoliasearch } = require('algoliasearch/lite');
const fetch = require('node-fetch');
const fs = require('fs');

// Initialize using environment variables (same as the app)
const CREDENTIALS = {
  ALGOLIA_APP_ID: '83MRCSJJZF',
  ALGOLIA_SEARCH_KEY: 'e96a3b50c7390bdcfdd0b4c5ee7ea130'
};

// Extended list of common words to exclude - focusing on keeping only intermediate/advanced
const COMMON_WORDS_EXTENDED = new Set([
  // Articles, pronouns, prepositions
  'the', 'be', 'to', 'of', 'and', 'a', 'an', 'in', 'that', 'have', 'i', 'it', 'for',
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by',
  'from', 'they', 'she', 'or', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  
  // Basic verbs
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'into',
  'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after',
  'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
  'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were',
  'said', 'each', 'did', 'very', 'may', 'let', 'put', 'say', 'set', 'run', 'move',
  'try', 'ask', 'need', 'feel', 'become', 'leave', 'call', 'tell', 'keep', 'help',
  'talk', 'turn', 'start', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe',
  'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet',
  'include', 'continue', 'learn', 'change', 'lead', 'watch', 'follow', 'stop', 'create',
  'speak', 'read', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'appear',
  
  // Common adjectives and adverbs
  'where', 'much', 'too', 'very', 'still', 'being', 'more', 'here', 'such', 'through',
  'same', 'both', 'few', 'those', 'every', 'own', 'during', 'before', 'above', 'between',
  'under', 'again', 'further', 'once', 'without', 'although', 'against', 'within',
  'across', 'behind', 'beyond', 'upon', 'among', 'throughout', 'despite', 'towards',
  'upon', 'off', 'always', 'often', 'however', 'almost', 'enough', 'since', 'until',
  'while', 'yet', 'early', 'never', 'always', 'sometimes', 'together', 'already',
  'several', 'himself', 'herself', 'itself', 'myself', 'themselves', 'someone', 'nothing',
  'anything', 'everything', 'somewhat', 'somewhere', 'none', 'nor', 'another', 'either',
  'neither', 'many', 'must', 'should', 'would', 'might', 'shall', 'ought', 'cannot',
  
  // Basic nouns
  'people', 'person', 'man', 'woman', 'child', 'children', 'boy', 'girl', 'year',
  'day', 'week', 'month', 'time', 'hour', 'minute', 'second', 'thing', 'world',
  'life', 'hand', 'part', 'place', 'case', 'point', 'government', 'company', 'group',
  'problem', 'fact', 'money', 'lot', 'right', 'left', 'water', 'room', 'mother',
  'father', 'area', 'money', 'story', 'fact', 'month', 'book', 'eye', 'job', 'word',
  'family', 'student', 'country', 'school', 'state', 'member', 'system', 'home', 'house',
  'service', 'friend', 'parent', 'power', 'health', 'question', 'business', 'program',
  'question', 'work', 'number', 'night', 'point', 'home', 'water', 'room', 'side',
  'office', 'door', 'body', 'face', 'others', 'level', 'order', 'sense', 'report',
  'mind', 'end', 'line', 'city', 'community', 'name', 'president', 'team', 'minute',
  'idea', 'information', 'back', 'nothing', 'right', 'phone', 'thanks', 'data',
  
  // Days, months, basic time
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'today', 'tomorrow', 'yesterday', 'morning',
  'afternoon', 'evening', 'night', 'week', 'weekend', 'month', 'year',
  
  // Numbers as words
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
  'eighty', 'ninety', 'hundred', 'thousand', 'million', 'billion', 'first', 'second',
  'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  
  // Additional basic words
  'yes', 'yeah', 'okay', 'ok', 'maybe', 'perhaps', 'probably', 'especially', 'particularly',
  'generally', 'usually', 'simply', 'actually', 'finally', 'really', 'quite', 'rather',
  'pretty', 'fairly', 'truly', 'certainly', 'definitely', 'absolutely',
  
  // Common CSAT basic words
  'answer', 'question', 'example', 'passage', 'text', 'author', 'reader', 'writer',
  'paragraph', 'sentence', 'word', 'letter', 'page', 'article', 'story', 'essay',
  'paper', 'test', 'exam', 'study'
]);

class ClientVocabularyExtractor {
  constructor() {
    this.searchClient = null;
    this.wordFrequency = new Map();
    this.extractedWords = [];
  }

  async initialize() {
    console.log('🚀 Initializing Client Vocabulary Extractor...');
    this.searchClient = algoliasearch(CREDENTIALS.ALGOLIA_APP_ID, CREDENTIALS.ALGOLIA_SEARCH_KEY);
    console.log('✅ Algolia client initialized');
  }

  // Calculate word difficulty based on various factors
  calculateDifficulty(word, frequency) {
    let difficulty = 5; // Start with medium difficulty
    
    // Length factor - longer words are typically more difficult
    if (word.length > 12) difficulty += 3;
    else if (word.length > 10) difficulty += 2;
    else if (word.length > 7) difficulty += 1;
    else if (word.length < 5) difficulty -= 1;
    
    // Frequency factor (inverse relationship)
    if (frequency === 1) difficulty += 3; // Very rare words get highest boost
    else if (frequency <= 2) difficulty += 2;
    else if (frequency <= 5) difficulty += 1;
    else if (frequency >= 20) difficulty -= 2;
    else if (frequency >= 10) difficulty -= 1;
    
    // Advanced prefixes/suffixes that indicate academic/difficult words
    const advancedPatterns = [
      'tion', 'sion', 'ment', 'ence', 'ance', 'ology', 'ism', 'ize', 'ify',
      'dis', 'un', 'pre', 'post', 'anti', 'inter', 'trans', 'super', 'sub',
      'micro', 'macro', 'pseudo', 'quasi', 'semi', 'multi', 'poly', 'mono',
      'hyper', 'ultra', 'meta', 'proto', 'para', 'neo', 'auto', 'homo', 'hetero'
    ];
    
    if (advancedPatterns.some(pattern => word.includes(pattern))) {
      difficulty += 1;
    }
    
    // Scientific/academic roots that indicate high difficulty
    const academicRoots = [
      'anthropo', 'astro', 'bio', 'chrono', 'demo', 'geo', 'graph', 'hydro',
      'meter', 'morph', 'path', 'phil', 'phobia', 'photo', 'psych', 'scope',
      'tele', 'therm', 'crypto', 'neuro', 'cardio', 'gastro', 'dermato'
    ];
    
    if (academicRoots.some(root => word.includes(root))) {
      difficulty += 2; // Academic words get extra difficulty points
    }
    
    // Rare letter combinations that indicate difficult words
    const rarePatterns = ['x', 'z', 'qu', 'ph', 'gh', 'ough', 'augh'];
    const rarePatternCount = rarePatterns.filter(pattern => word.includes(pattern)).length;
    if (rarePatternCount > 0) {
      difficulty += rarePatternCount;
    }
    
    // Words ending in difficult suffixes
    const difficultSuffixes = [
      'ous', 'eous', 'ious', 'aceous', 'aneous', 'ary', 'ery', 'ory',
      'ful', 'less', 'ward', 'wise', 'like', 'able', 'ible'
    ];
    
    if (difficultSuffixes.some(suffix => word.endsWith(suffix))) {
      difficulty += 0.5;
    }
    
    // Ensure difficulty is between 1 and 10
    return Math.max(1, Math.min(10, Math.round(difficulty)));
  }

  // Check if word is intermediate or advanced (not basic)
  isIntermediateOrAdvanced(word) {
    // Skip if in extended common words list
    if (COMMON_WORDS_EXTENDED.has(word.toLowerCase())) {
      return false;
    }
    
    // Skip very short words
    if (word.length < 4) {
      return false;
    }
    
    // Skip words that are all caps (likely acronyms)
    if (word === word.toUpperCase() && word.length > 1) {
      return false;
    }
    
    // Skip words with numbers
    if (/\d/.test(word)) {
      return false;
    }
    
    // Accept words with certain academic/advanced indicators
    const academicIndicators = [
      'tion', 'sion', 'ment', 'ology', 'graphy', 'cracy', 'archy',
      'thesis', 'phobia', 'phil', 'morph', 'path', 'chron', 'bio'
    ];
    
    for (const indicator of academicIndicators) {
      if (word.toLowerCase().includes(indicator)) {
        return true;
      }
    }
    
    // Accept if word is long enough and not common
    return word.length >= 5;
  }

  // Extract words from text with better filtering
  extractWordsFromText(text, questionData) {
    if (!text || typeof text !== 'string') return [];
    
    // Clean text
    const cleanText = text
      .replace(/[가-힣]/g, ' ')  // Remove Korean characters
      .replace(/\([A-E]\)/g, ' ') // Remove answer choices
      .replace(/[^\w\s.!?'-]/g, ' ') // Keep words, spaces, sentence endings, hyphens, apostrophes
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split into sentences
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30); // Only substantial sentences
    
    const wordSentencePairs = [];
    const processedWords = new Set(); // Avoid duplicates within same text
    
    sentences.forEach(sentence => {
      // Extract words from sentence
      const words = sentence
        .split(/\s+/)
        .map(word => {
          // Clean word but preserve case for checking
          return word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
        })
        .filter(word => word && this.isIntermediateOrAdvanced(word));
      
      words.forEach(word => {
        const wordLower = word.toLowerCase();
        
        // Skip if already processed in this text
        if (processedWords.has(wordLower)) return;
        processedWords.add(wordLower);
        
        // Verify word appears in sentence
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(sentence)) {
          wordSentencePairs.push({
            word: wordLower,
            originalWord: word, // Preserve original case
            sentence: sentence,
            questionId: questionData.objectID,
            questionNumber: questionData.questionNumber,
            year: questionData.year,
            questionType: questionData.questionType,
            passage: questionData.passage || questionData.questionText
          });
        }
      });
    });
    
    return wordSentencePairs;
  }

  async fetchAllCSATData() {
    console.log('📊 Fetching all CSAT data from Algolia...');
    
    let allQuestions = [];
    let page = 0;
    
    while (true) {
      try {
        const response = await this.searchClient.search([{
          indexName: 'korean-english-question-pairs',
          params: {
            query: '',
            hitsPerPage: 1000,
            page: page,
            attributesToRetrieve: [
              'objectID', 
              'questionText', 
              'answerText',
              'passage',
              'year',
              'questionType',
              'questionNumber',
              'theoryArea'
            ]
          }
        }]);
        
        if (!response.results || !response.results[0]) break;
        
        const hits = response.results[0].hits;
        if (hits.length === 0) break;
        
        allQuestions = allQuestions.concat(hits);
        console.log(`📄 Fetched page ${page + 1}: ${hits.length} questions (Total: ${allQuestions.length})`);
        
        page++;
        if (page >= 20) break; // Safety limit
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }
    
    console.log(`✅ Total questions fetched: ${allQuestions.length}`);
    return allQuestions;
  }

  async processQuestions(questions) {
    console.log('🔍 Processing questions and extracting vocabulary...');
    
    questions.forEach((question, index) => {
      if (index % 100 === 0) {
        console.log(`Processing question ${index + 1}/${questions.length}...`);
      }
      
      // Extract from passage (main source)
      if (question.passage) {
        const wordsFromPassage = this.extractWordsFromText(question.passage, question);
        this.addToWordFrequency(wordsFromPassage);
      }
      
      // Also extract from question text
      if (question.questionText) {
        const wordsFromQuestion = this.extractWordsFromText(question.questionText, question);
        this.addToWordFrequency(wordsFromQuestion);
      }
      
      // Extract from answer text
      if (question.answerText) {
        const wordsFromAnswer = this.extractWordsFromText(question.answerText, question);
        this.addToWordFrequency(wordsFromAnswer);
      }
    });
    
    console.log(`✅ Extracted ${this.wordFrequency.size} unique words`);
  }

  addToWordFrequency(wordSentencePairs) {
    wordSentencePairs.forEach(pair => {
      const { word } = pair;
      
      if (!this.wordFrequency.has(word)) {
        this.wordFrequency.set(word, {
          count: 0,
          sentences: [],
          questions: new Set(),
          years: new Set()
        });
      }
      
      const wordData = this.wordFrequency.get(word);
      wordData.count++;
      wordData.questions.add(pair.questionId);
      wordData.years.add(pair.year);
      
      // Keep best examples (shortest and clearest sentences)
      if (wordData.sentences.length < 5) {
        wordData.sentences.push({
          sentence: pair.sentence,
          questionId: pair.questionId,
          year: pair.year,
          questionType: pair.questionType
        });
      }
    });
  }

  async buildVocabularyList() {
    console.log('📝 Building final vocabulary list...');
    
    const vocabularyList = [];
    
    for (const [word, data] of this.wordFrequency.entries()) {
      const difficulty = this.calculateDifficulty(word, data.count);
      
      // Include rare words if they are difficult (difficulty >= 7)
      const isRareButDifficult = data.count === 1 && difficulty >= 7;
      
      // Skip if frequency is too low (likely errors) unless it's a rare difficult word
      // Skip if frequency is too high (too common)
      if (!isRareButDifficult && (data.count < 2 || data.count > 100)) continue;
      
      // Only include intermediate and advanced words (difficulty >= 4)
      // OR rare difficult words (frequency = 1, difficulty >= 7)
      if (difficulty < 4 && !isRareButDifficult) continue;
      
      vocabularyList.push({
        word: word,
        frequency: data.count,
        difficulty: difficulty,
        contexts: data.sentences.map(s => s.sentence),
        questions: Array.from(data.questions),
        years: Array.from(data.years),
        subjects: this.categorizeWord(word),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        definition: '', // Will be filled later if needed
        examples: data.sentences.map(s => s.sentence).slice(0, 3)
      });
    }
    
    // Sort by frequency (most frequent first)
    vocabularyList.sort((a, b) => b.frequency - a.frequency);
    
    console.log(`✅ Final vocabulary list: ${vocabularyList.length} words`);
    return vocabularyList;
  }

  categorizeWord(word) {
    // Categorize based on word patterns and known academic domains
    const categories = [];
    
    const sciencePatterns = ['bio', 'chem', 'phys', 'gene', 'cell', 'atom', 'molec', 'species'];
    const socialPatterns = ['socio', 'cultur', 'politic', 'econom', 'demograph', 'civili'];
    const techPatterns = ['comput', 'digit', 'cyber', 'tech', 'data', 'algorith'];
    const artPatterns = ['artist', 'paint', 'sculpt', 'music', 'poet', 'liter'];
    
    if (sciencePatterns.some(p => word.includes(p))) categories.push('science');
    if (socialPatterns.some(p => word.includes(p))) categories.push('social');
    if (techPatterns.some(p => word.includes(p))) categories.push('technology');
    if (artPatterns.some(p => word.includes(p))) categories.push('arts');
    
    if (categories.length === 0) categories.push('general');
    
    return categories;
  }

  async saveToJSON(vocabularyList) {
    console.log('💾 Saving vocabulary to JSON file...');
    
    // Save full list
    fs.writeFileSync(
      'enhanced-vocabulary-output.json',
      JSON.stringify(vocabularyList, null, 2)
    );
    
    // Save sample for preview
    fs.writeFileSync(
      'vocabulary-sample.json',
      JSON.stringify(vocabularyList.slice(0, 100), null, 2)
    );
    
    console.log(`✅ Successfully saved ${vocabularyList.length} words to JSON files`);
  }

  async run() {
    try {
      await this.initialize();
      
      // Fetch all CSAT data
      const questions = await this.fetchAllCSATData();
      
      // Process and extract vocabulary
      await this.processQuestions(questions);
      
      // Build final vocabulary list
      const vocabularyList = await this.buildVocabularyList();
      
      // Save to JSON files
      await this.saveToJSON(vocabularyList);
      
      console.log('✨ Extraction complete!');
      console.log(`📊 Statistics:`);
      console.log(`  - Total unique words: ${vocabularyList.length}`);
      console.log(`  - Average frequency: ${(vocabularyList.reduce((sum, w) => sum + w.frequency, 0) / vocabularyList.length).toFixed(2)}`);
      console.log(`  - Difficulty distribution:`);
      
      const difficultyDist = {};
      vocabularyList.forEach(w => {
        difficultyDist[w.difficulty] = (difficultyDist[w.difficulty] || 0) + 1;
      });
      console.log(difficultyDist);
      
      // Show some examples
      console.log('\n📝 Sample words extracted:');
      vocabularyList.slice(0, 20).forEach(word => {
        console.log(`  - ${word.word} (freq: ${word.frequency}, diff: ${word.difficulty})`);
      });
      
    } catch (error) {
      console.error('❌ Fatal error:', error);
    }
  }
}

// Run the extractor
const extractor = new ClientVocabularyExtractor();
extractor.run().then(() => {
  console.log('✅ Extraction process completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});