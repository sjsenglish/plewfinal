// components/FirestoreTest.js
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FirestoreTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testFirestore = async () => {
    setLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setTestResult('Error: No user is logged in');
        setLoading(false);
        return;
      }

      // Try to create or update the user document
      const userDocRef = doc(db, 'users', user.uid);

      await setDoc(
        userDocRef,
        {
          testField: 'This is a test',
          timestamp: new Date().toISOString(),
        },
        { merge: true }
      );

      setTestResult('Success! Firestore is working correctly.');
      console.log('Firestore test successful!');
    } catch (error) {
      console.error('Firestore test error:', error);
      setTestResult(`Error: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div style={{ margin: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Firestore Connection Test</h3>
      <button
        onClick={testFirestore}
        disabled={loading}
        style={{ padding: '8px 16px', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Testing...' : 'Test Firestore Connection'}
      </button>

      {testResult && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: testResult.includes('Error') ? '#ffebee' : '#e8f5e9',
            borderRadius: '4px',
          }}
        >
          {testResult}
        </div>
      )}
    </div>
  );
};

export default FirestoreTest;