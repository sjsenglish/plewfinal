// api/vocabulary/extract.js - Server-side vocabulary extraction
const { db } = require('../../src/firebase-admin');

// Move vocabulary extraction logic to server-side
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

const extractVocabularyFromQuestion = (questionData) => {
  const vocabularyWords = new Map();
  
  // Extract text from multiple fields
  const questionText = questionData.question || questionData.question_text || questionData.questionText || 
                      questionData.english_text || questionData.english || questionData.text || 
                      questionData.korean_text || questionData.korean || '';
  
  const additionalText = [
    questionData.answer || questionData.answer_text || '',
    questionData.explanation || questionData.explanation_text || '',
    questionData.translation || '',
    questionData.romanization || ''
  ].filter(text => text && typeof text === 'string').join(' ');
  
  const fullText = [questionText, additionalText].filter(t => t).join(' ');
  
  if (fullText && fullText.trim().length > 0) {
    const words = extractMeaningfulWords(fullText);
    
    words.forEach(word => {
      const key = word.toLowerCase();
      if (!vocabularyWords.has(key)) {
        vocabularyWords.set(key, {
          word: word,
          frequency: 1,
          contexts: [fullText.substring(0, 200)],
          sourceQuestions: [questionData.objectID || questionData.id],
          lastUpdated: new Date().toISOString(),
          subjectArea: questionData.subject || 'general'
        });
      } else {
        const existing = vocabularyWords.get(key);
        existing.frequency += 1;
        if (existing.contexts.length < 3) {
          existing.contexts.push(fullText.substring(0, 200));
        }
        existing.sourceQuestions.push(questionData.objectID || questionData.id);
        existing.lastUpdated = new Date().toISOString();
      }
    });
  }
  
  return Array.from(vocabularyWords.values());
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { questionData, batchProcess = false } = req.body;

    if (batchProcess) {
      // Process multiple questions for initial setup
      console.log('Processing batch vocabulary extraction...');
      
      // This would be called during initial setup or migration
      // In a real scenario, you'd fetch from Algolia here
      if (!questionData || !Array.isArray(questionData)) {
        return res.status(400).json({ error: 'Question data array required for batch processing' });
      }

      const allVocabulary = new Map();
      
      questionData.forEach(question => {
        const extractedWords = extractVocabularyFromQuestion(question);
        
        extractedWords.forEach(wordData => {
          const key = wordData.word.toLowerCase();
          if (!allVocabulary.has(key)) {
            allVocabulary.set(key, wordData);
          } else {
            const existing = allVocabulary.get(key);
            existing.frequency += wordData.frequency;
            existing.contexts = [...new Set([...existing.contexts, ...wordData.contexts])].slice(0, 3);
            existing.sourceQuestions = [...new Set([...existing.sourceQuestions, ...wordData.sourceQuestions])];
            existing.lastUpdated = new Date().toISOString();
          }
        });
      });

      // Store in Firestore
      const batch = db.batch();
      const vocabularyRef = db.collection('vocabulary');
      
      Array.from(allVocabulary.values()).forEach(wordData => {
        const docRef = vocabularyRef.doc(wordData.word.toLowerCase());
        batch.set(docRef, wordData, { merge: true });
      });

      await batch.commit();
      
      return res.status(200).json({
        success: true,
        processed: questionData.length,
        vocabularyWords: allVocabulary.size,
        message: 'Batch vocabulary extraction completed'
      });

    } else {
      // Process single question (for new questions)
      if (!questionData) {
        return res.status(400).json({ error: 'Question data required' });
      }

      const extractedWords = extractVocabularyFromQuestion(questionData);
      
      // Update Firestore with new/updated vocabulary
      const batch = db.batch();
      const vocabularyRef = db.collection('vocabulary');
      
      for (const wordData of extractedWords) {
        const docRef = vocabularyRef.doc(wordData.word.toLowerCase());
        const existingDoc = await docRef.get();
        
        if (existingDoc.exists) {
          // Merge with existing data
          const existing = existingDoc.data();
          const updated = {
            ...existing,
            frequency: (existing.frequency || 0) + wordData.frequency,
            contexts: [...new Set([...(existing.contexts || []), ...wordData.contexts])].slice(0, 3),
            sourceQuestions: [...new Set([...(existing.sourceQuestions || []), ...wordData.sourceQuestions])],
            lastUpdated: new Date().toISOString()
          };
          batch.set(docRef, updated);
        } else {
          // New word
          batch.set(docRef, wordData);
        }
      }

      await batch.commit();
      
      return res.status(200).json({
        success: true,
        extractedWords: extractedWords.length,
        message: 'Vocabulary extraction completed for question'
      });
    }

  } catch (error) {
    console.error('Vocabulary extraction error:', error);
    return res.status(500).json({ 
      error: 'Server error during vocabulary extraction',
      details: error.message 
    });
  }
}