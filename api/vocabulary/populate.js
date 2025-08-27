// api/vocabulary/populate.js - API endpoint to populate vocabulary from Algolia
const { liteClient: algoliasearch } = require('algoliasearch/lite');
const { db } = require('../../src/firebase-admin');

const extractMeaningfulWords = (text) => {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
    'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i',
    'me', 'him', 'her', 'them', 'us', 'my', 'your', 'his', 'her', 'their', 'our',
    'what', 'when', 'where', 'why', 'how', 'which', 'who', 'whom', 'whose',
    'not', 'no', 'yes', 'so', 'very', 'much', 'many', 'more', 'most', 'some', 'any', 'all',
    'from', 'into', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'any',
    'as', 'because', 'before', 'below', 'between', 'both', 'down', 'during', 'each', 'few',
    'further', 'here', 'how', 'if', 'into', 'just', 'now', 'once', 'only', 'other', 'our',
    'out', 'over', 'own', 'same', 'such', 'than', 'then', 'there', 'through', 'too', 'under',
    'until', 'up', 'while', 'with'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= 3 && 
      word.length <= 20 && 
      !stopWords.has(word) && 
      !/^\d+$/.test(word) && 
      /^[a-z]+$/.test(word) &&
      !word.includes('http') && 
      !word.includes('www')
    );

  return [...new Set(words)];
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting vocabulary population from Algolia...');

    // Initialize Algolia client
    const searchClient = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
    );

    const index = searchClient.initIndex('korean-english-question-pairs');
    
    // Fetch questions from Algolia
    console.log('Fetching questions from Algolia...');
    
    let allQuestions = [];
    let page = 0;
    const hitsPerPage = 100;
    
    // Fetch all questions (or limit for testing)
    while (page < 5) { // Limit to 500 questions for initial population
      const searchResult = await index.search('', {
        page,
        hitsPerPage,
        attributesToRetrieve: ['objectID', 'question', 'question_text', 'questionText', 'english_text', 'english', 'text', 'korean_text', 'korean', 'answer', 'answer_text', 'explanation', 'explanation_text', 'translation', 'romanization']
      });

      if (searchResult.hits.length === 0) break;
      
      allQuestions = allQuestions.concat(searchResult.hits);
      console.log(`Fetched page ${page + 1}, total questions: ${allQuestions.length}`);
      
      if (searchResult.hits.length < hitsPerPage) break;
      page++;
    }

    console.log(`Total questions fetched: ${allQuestions.length}`);

    // Process vocabulary extraction
    const allVocabulary = new Map();
    
    allQuestions.forEach((question, index) => {
      if (index % 50 === 0) {
        console.log(`Processing question ${index + 1}/${allQuestions.length}`);
      }

      // Extract text from multiple fields
      const questionText = question.question || question.question_text || question.questionText || 
                          question.english_text || question.english || question.text || 
                          question.korean_text || question.korean || '';
      
      const additionalText = [
        question.answer || question.answer_text || '',
        question.explanation || question.explanation_text || '',
        question.translation || '',
        question.romanization || ''
      ].filter(text => text && typeof text === 'string').join(' ');
      
      const fullText = [questionText, additionalText].filter(t => t).join(' ');
      
      if (fullText && fullText.trim().length > 0) {
        const words = extractMeaningfulWords(fullText);
        
        words.forEach(word => {
          const key = word.toLowerCase();
          if (!allVocabulary.has(key)) {
            allVocabulary.set(key, {
              word: word,
              frequency: 1,
              contexts: [fullText.substring(0, 200)],
              sourceQuestions: [question.objectID],
              lastUpdated: new Date().toISOString(),
              subjectArea: 'korean-english'
            });
          } else {
            const existing = allVocabulary.get(key);
            existing.frequency += 1;
            if (existing.contexts.length < 3) {
              existing.contexts.push(fullText.substring(0, 200));
            }
            existing.sourceQuestions.push(question.objectID);
            existing.lastUpdated = new Date().toISOString();
          }
        });
      }
    });

    console.log(`Extracted ${allVocabulary.size} unique vocabulary words`);

    // Store in Firestore in batches
    const vocabularyArray = Array.from(allVocabulary.values());
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    
    for (let i = 0; i < vocabularyArray.length; i += batchSize) {
      const batch = db.batch();
      const batchItems = vocabularyArray.slice(i, i + batchSize);
      
      batchItems.forEach(wordData => {
        const docRef = db.collection('vocabulary').doc(wordData.word.toLowerCase());
        batch.set(docRef, wordData, { merge: true });
      });
      
      batches.push(batch);
    }

    console.log(`Committing ${batches.length} batches to Firestore...`);
    
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`Committed batch ${i + 1}/${batches.length}`);
    }

    console.log('✅ Vocabulary population completed successfully!');
    
    return res.status(200).json({
      success: true,
      questionsProcessed: allQuestions.length,
      vocabularyWords: allVocabulary.size,
      batches: batches.length,
      message: 'Vocabulary database populated successfully'
    });

  } catch (error) {
    console.error('❌ Vocabulary population failed:', error);
    return res.status(500).json({ 
      error: 'Server error during vocabulary population',
      details: error.message 
    });
  }
}