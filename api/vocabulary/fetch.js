// api/vocabulary/fetch.js - Fetch pre-computed vocabulary from database
const { db } = require('../../src/firebase-admin');

export default async function handler(req, res) {
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

    console.log('Fetching vocabulary with params:', { limit, offset, sortBy, subjectArea, minFrequency, search });

    let query = db.collection('vocabulary');

    // Apply filters
    if (subjectArea && subjectArea !== 'all') {
      query = query.where('subjectArea', '==', subjectArea);
    }

    if (minFrequency > 1) {
      query = query.where('frequency', '>=', parseInt(minFrequency));
    }

    // Apply search filter (this is less efficient, consider using Algolia for search)
    let docs;
    if (search) {
      // For now, get all and filter client-side (not ideal for large datasets)
      const snapshot = await query.limit(1000).get();
      docs = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.word.toLowerCase().includes(search.toLowerCase());
      });
    } else {
      const snapshot = await query.limit(parseInt(limit) + parseInt(offset)).get();
      docs = snapshot.docs;
    }

    // Sort the results
    let vocabularyWords = docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply sorting
    switch (sortBy) {
      case 'frequency':
        vocabularyWords.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
        break;
      case 'alphabetical':
        vocabularyWords.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'recent':
        vocabularyWords.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
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