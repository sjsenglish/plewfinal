import algoliasearch from 'algoliasearch';
import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Initialize Algolia with server-side keys
const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check user subscription/limits
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isSubscribed = userData?.subscription?.status === 'active';
    
    // Enforce limits for free users
    if (!isSubscribed && userData?.usage?.questionsViewedToday >= 5) {
      return res.status(429).json({ error: 'Daily limit reached' });
    }

    const { indexName, query, filters, hitsPerPage = 20 } = req.body;
    
    // Validate index name
    const allowedIndexes = ['tsa_questions', 'korean-english-question-pairs', 'maths_alevel'];
    if (!allowedIndexes.includes(indexName)) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    // Perform search
    const index = client.initIndex(indexName);
    const searchResults = await index.search(query, {
      filters: filters || '',
      hitsPerPage: Math.min(hitsPerPage, 100),
    });

    // Update usage for free users
    if (!isSubscribed) {
      await admin.firestore().collection('users').doc(userId).update({
        'usage.questionsViewedToday': admin.firestore.FieldValue.increment(searchResults.hits.length)
      });
    }

    return res.status(200).json({
      hits: searchResults.hits,
      nbHits: searchResults.nbHits,
      page: searchResults.page,
      nbPages: searchResults.nbPages
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}