// src/utils/pineconeClient.js
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Pinecone operations are now handled server-side for security

// Generate embeddings using secure server-side API
const generateEmbedding = async (text) => {
  try {
    const response = await fetch('/api/generate-embedding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate embedding');
    }
    
    return data.embedding;
    
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

// Search community questions using Pinecone + Firebase
export const searchCommunityQuestions = async (query, limit = 100) => {
  try {
    if (!query.trim()) {
      return [];
    }


    // Generate embedding for search query
    const embedding = await generateEmbedding(query);
    
    // Search Pinecone via secure server-side API
    const response = await fetch('/api/pinecone-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embedding: embedding,
        limit: limit
      })
    });

    if (!response.ok) {
      throw new Error(`Pinecone search API error: ${response.status}`);
    }

    const searchResult = await response.json();
    if (!searchResult.success) {
      throw new Error(searchResult.error || 'Pinecone search failed');
    }
    
    const pineconeData = { matches: searchResult.matches };
    
    if (!pineconeData.matches || pineconeData.matches.length === 0) {
      return [];
    }

    // Get question IDs from Pinecone results
    const questionIds = pineconeData.matches.map(match => match.id);
    
    // Fetch full question data from Firebase
    const questions = [];
    for (const questionId of questionIds) {
      try {
        const questionDoc = await getDoc(doc(db, 'plewcommunity', questionId));
        if (questionDoc.exists()) {
          const questionData = questionDoc.data();
          const matchData = pineconeData.matches.find(m => m.id === questionId);
          
          questions.push({
            objectID: questionId,
            score: matchData.score,
            ...questionData
          });
        }
      } catch (error) {
        console.error(`Error fetching question ${questionId}:`, error);
      }
    }
    
    return questions;
    
  } catch (error) {
    console.error('Error searching community questions:', error);
    return [];
  }
};

// Add a new question to both Pinecone and Firebase
export const addCommunityQuestion = async (questionData) => {
  try {

    // Generate embedding for the question
    const embedding = await generateEmbedding(questionData.question);
    
    // Create unique ID
    const questionId = Date.now().toString();
    
    // Add to Firebase first
    const { addDoc, doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'plewcommunity', questionId), {
      ...questionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add to Pinecone via secure server-side API
    const pineconeResponse = await fetch('/api/pinecone-upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId: questionId,
        embedding: embedding,
        metadata: {
          question_id: questionId,
          question_preview: questionData.question.substring(0, 100)
        }
      })
    });

    if (!pineconeResponse.ok) {
      throw new Error(`Pinecone upsert API error: ${pineconeResponse.status}`);
    }
    
    const upsertResult = await pineconeResponse.json();
    if (!upsertResult.success) {
      throw new Error(upsertResult.error || 'Pinecone upsert failed');
    }
    
    console.log('Question added successfully:', questionId);
    return questionId;
    
  } catch (error) {
    console.error('Error adding question:', error);
    throw error;
  }
};