// api/wordnik/word.js - Server-side Wordnik API integration
const BASE_URL = 'https://api.wordnik.com/v4/word.json';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { word, action = 'all' } = req.query;

  if (!word) {
    return res.status(400).json({ error: 'Word parameter is required' });
  }

  const apiKey = process.env.WORDNIK_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Wordnik API key not configured on server',
      fallback: true 
    });
  }

  try {
    console.log(`Server-side Wordnik API call for word: ${word}, action: ${action}`);

    // Prepare API calls based on action
    const promises = [];
    const results = {};

    if (action === 'all' || action === 'definitions') {
      const definitionsUrl = `${BASE_URL}/${encodeURIComponent(word)}/definitions?limit=5&includeRelated=false&sourceDictionaries=all&useCanonical=true&includeTags=false&api_key=${apiKey}`;
      promises.push(
        fetch(definitionsUrl)
          .then(res => res.ok ? res.json() : [])
          .then(data => { results.definitions = data; })
          .catch(() => { results.definitions = []; })
      );
    }

    if (action === 'all' || action === 'related') {
      const relatedUrl = `${BASE_URL}/${encodeURIComponent(word)}/relatedWords?useCanonical=true&limitPerRelationshipType=10&api_key=${apiKey}`;
      promises.push(
        fetch(relatedUrl)
          .then(res => res.ok ? res.json() : [])
          .then(data => { results.related = data; })
          .catch(() => { results.related = []; })
      );
    }

    if (action === 'all' || action === 'examples') {
      const examplesUrl = `${BASE_URL}/${encodeURIComponent(word)}/examples?includeDuplicates=false&useCanonical=true&skip=0&limit=5&api_key=${apiKey}`;
      promises.push(
        fetch(examplesUrl)
          .then(res => res.ok ? res.json() : { examples: [] })
          .then(data => { results.examples = data.examples || []; })
          .catch(() => { results.examples = []; })
      );
    }

    if (action === 'all' || action === 'pronunciations') {
      const pronunciationUrl = `${BASE_URL}/${encodeURIComponent(word)}/pronunciations?useCanonical=true&limit=3&api_key=${apiKey}`;
      promises.push(
        fetch(pronunciationUrl)
          .then(res => res.ok ? res.json() : [])
          .then(data => { results.pronunciations = data; })
          .catch(() => { results.pronunciations = []; })
      );
    }

    if (action === 'all' || action === 'frequency') {
      const frequencyUrl = `${BASE_URL}/${encodeURIComponent(word)}/frequency?useCanonical=true&startYear=2019&endYear=2023&api_key=${apiKey}`;
      promises.push(
        fetch(frequencyUrl)
          .then(res => res.ok ? res.json() : null)
          .then(data => { results.frequency = data; })
          .catch(() => { results.frequency = null; })
      );
    }

    // Wait for all API calls to complete
    await Promise.all(promises);

    console.log(`Successfully retrieved Wordnik data for: ${word}`);
    
    return res.status(200).json({
      success: true,
      word: word,
      data: results
    });

  } catch (error) {
    console.error('Wordnik API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch word data from Wordnik',
      details: error.message,
      fallback: true 
    });
  }
};