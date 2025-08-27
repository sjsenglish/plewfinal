import { getAuth } from 'firebase/auth';

export const performSearch = async (indexName, query = '', filters = '', hitsPerPage = 20) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Must be logged in to search');
    }

    // Get Firebase ID token for authentication
    const token = await user.getIdToken();

    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        indexName,
        query,
        filters,
        hitsPerPage
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Search failed');
    }

    const data = await response.json();
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const countQuestions = async (indexName, filters = '') => {
  try {
    const result = await performSearch(indexName, '', filters, 0);
    return {
      success: result.success,
      count: result.success ? result.data.nbHits : 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      count: 0
    };
  }
};