// api/vocabulary/fetch.js - Fetch pre-computed vocabulary from database
const { db } = require('../../src/firebase-admin');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'frequency',
      subjectArea,
      minFrequency = 1,
      search
    } = req.query;

    console.log('📚 Fetching vocabulary with params:', { limit, offset, sortBy, subjectArea, minFrequency, search });

    // Try the new vocabulary_words collection first, fallback to old vocabulary collection
    let query;
    try {
      // Check if new collection exists by trying to get one document
      const testQuery = db.collection('vocabulary_words').limit(1);
      const testSnapshot = await testQuery.get();
      
      if (testSnapshot.empty) {
        console.log('📚 Using legacy vocabulary collection');
        query = db.collection('vocabulary');
      } else {
        console.log('📚 Using new vocabulary_words collection');
        query = db.collection('vocabulary_words');
      }
    } catch (error) {
      console.log('📚 Falling back to legacy vocabulary collection');
      query = db.collection('vocabulary');
    }

    // Apply filters
    if (subjectArea && subjectArea !== 'all') {
      // Handle both new schema (subjectAreas array) and old schema (subjectArea string)
      try {
        query = query.where('subjectAreas', 'array-contains', subjectArea);
      } catch (error) {
        query = query.where('subjectArea', '==', subjectArea);
      }
    }

    if (minFrequency > 1) {
      query = query.where('frequency', '>=', parseInt(minFrequency));
    }

    // Apply search filter
    let docs;
    if (search) {
      const searchLimit = Math.max(1000, parseInt(limit) * 10);
      const snapshot = await query.limit(searchLimit).get();
      docs = snapshot.docs.filter(doc => {
        const data = doc.data();
        const searchTerm = search.toLowerCase();
        return data.word.toLowerCase().includes(searchTerm) ||
               (data.definition && data.definition.toLowerCase().includes(searchTerm)) ||
               (data.synonyms && data.synonyms.some(syn => syn.toLowerCase().includes(searchTerm)));
      });
    } else {
      const fetchLimit = Math.min(parseInt(limit) + parseInt(offset), 1000);
      const snapshot = await query.limit(fetchLimit).get();
      docs = snapshot.docs;
    }

    // Process and sort the results
    let vocabularyWords = docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        word: data.word,
        definition: data.definition,
        frequency: data.frequency || 1,
        difficulty: data.difficulty || 5,
        rank: data.rank || null,
        pronunciation: data.pronunciation || null,
        synonyms: data.synonyms || [],
        examples: data.examples || [],
        subjectArea: data.subjectArea || (data.subjectAreas && data.subjectAreas[0]) || 'general',
        subjectAreas: data.subjectAreas || [data.subjectArea || 'general'],
        questionInfo: data.questionInfo || null,
        yearRange: data.yearRange || null,
        avgSentenceLength: data.avgSentenceLength || null,
        questionCount: data.questionCount || 1,
        extractedAt: data.extractedAt || data.createdAt || null,
        lastUpdated: data.lastUpdated || data.updatedAt || null
      };
    });

    // Apply sorting
    switch (sortBy) {
      case 'frequency':
        vocabularyWords.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
        break;
      case 'alphabetical':
        vocabularyWords.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'difficulty':
        vocabularyWords.sort((a, b) => (b.difficulty || 5) - (a.difficulty || 5));
        break;
      case 'rank':
        vocabularyWords.sort((a, b) => (a.rank || 999999) - (b.rank || 999999));
        break;
      case 'recent':
        vocabularyWords.sort((a, b) => {
          const dateB = new Date(b.lastUpdated || b.extractedAt || 0);
          const dateA = new Date(a.lastUpdated || a.extractedAt || 0);
          return dateB - dateA;
        });
        break;
      default:
        vocabularyWords.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
    }

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedWords = vocabularyWords.slice(startIndex, endIndex);

    // Get total count for pagination
    const totalCount = vocabularyWords.length;

    return res.status(200).json({
      success: true,
      data: paginatedWords,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < totalCount
      },
      filters: {
        sortBy,
        subjectArea: subjectArea || 'all',
        minFrequency: parseInt(minFrequency),
        search: search || null
      }
    });

  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return res.status(500).json({ 
      error: 'Server error fetching vocabulary',
      details: error.message 
    });
  }
}