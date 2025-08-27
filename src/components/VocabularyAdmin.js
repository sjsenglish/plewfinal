// src/components/VocabularyAdmin.js - Admin component to populate and test vocabulary
import React, { useState } from 'react';
import { fetchVocabulary } from '../services/vocabularyAPIService';

const VocabularyAdmin = () => {
  const [populating, setPopulating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const populateVocabulary = async () => {
    setPopulating(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting vocabulary population...');
      
      const response = await fetch('/api/vocabulary/populate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        console.log('✅ Population successful:', data);
      } else {
        setError(data.error || 'Population failed');
        console.error('❌ Population failed:', data.error);
      }

    } catch (err) {
      setError(err.message);
      console.error('❌ Population error:', err);
    } finally {
      setPopulating(false);
    }
  };

  const testVocabularyAPI = async () => {
    setTesting(true);
    setError(null);
    
    try {
      console.log('Testing vocabulary API...');
      
      const result = await fetchVocabulary({
        limit: 5,
        sortBy: 'frequency'
      });

      if (result.success) {
        setResult({
          type: 'test',
          words: result.words,
          total: result.pagination.total
        });
        console.log('✅ API test successful:', result);
      } else {
        setError(result.error || 'API test failed');
        console.error('❌ API test failed:', result.error);
      }

    } catch (err) {
      setError(err.message);
      console.error('❌ API test error:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      background: '#f8f9fa', 
      borderRadius: '8px', 
      margin: '1rem',
      border: '2px solid #007bff'
    }}>
      <h2>Vocabulary Database Admin</h2>
      <p>Use these tools to populate and test the vocabulary database.</p>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={populateVocabulary}
          disabled={populating}
          style={{
            padding: '1rem 2rem',
            backgroundColor: populating ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: populating ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          {populating ? '🔄 Populating...' : '🚀 Populate Vocabulary Database'}
        </button>

        <button
          onClick={testVocabularyAPI}
          disabled={testing}
          style={{
            padding: '1rem 2rem',
            backgroundColor: testing ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          {testing ? '🔄 Testing...' : '🧪 Test Vocabulary API'}
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px', 
          padding: '1rem', 
          marginBottom: '1rem',
          color: '#721c24'
        }}>
          <h4>❌ Error:</h4>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ 
          background: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '4px', 
          padding: '1rem',
          color: '#155724'
        }}>
          <h4>✅ Success:</h4>
          
          {result.type === 'test' ? (
            <div>
              <p><strong>API Test Results:</strong></p>
              <p>Total vocabulary words in database: {result.total}</p>
              <p>Sample words retrieved:</p>
              <ul>
                {result.words.map((word, index) => (
                  <li key={index}>
                    <strong>{word.word}</strong> (frequency: {word.frequency})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <p><strong>Population Results:</strong></p>
              <p>Questions processed: {result.questionsProcessed}</p>
              <p>Vocabulary words extracted: {result.vocabularyWords}</p>
              <p>Database batches: {result.batches}</p>
              <p>Message: {result.message}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        fontSize: '0.9rem'
      }}>
        <h5>ℹ️ Instructions:</h5>
        <ol>
          <li><strong>Populate Database:</strong> Click "Populate Vocabulary Database" to extract vocabulary from your Algolia questions and store in Firestore.</li>
          <li><strong>Test API:</strong> Click "Test Vocabulary API" to verify the database has words and the API is working.</li>
          <li><strong>Check Vocabulary Tab:</strong> After population, go to the Vocabulary tab to see the results.</li>
        </ol>
      </div>
    </div>
  );
};

export default VocabularyAdmin;