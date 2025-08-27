import React, { useEffect } from 'react';

const DebugTest = () => {
  useEffect(() => {
    console.log('DebugTest component mounted!');
    console.log('React is working properly');
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      location: window.location.href
    });
  }, []);

  const testPersonalStatementAPI = async () => {
    try {
      console.log('Testing personal statement API...');
      
      const testStatement = "I have always been passionate about economics and its impact on society. Through my studies, I have developed a deep understanding of microeconomic principles and macroeconomic theory. Reading works by renowned economists like Paul Krugman and Joseph Stiglitz has broadened my perspective on global economic issues. I am particularly interested in behavioral economics and how psychological factors influence economic decision-making.";
      
      const response = await fetch('/api/analyze-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statement: testStatement,
          targetCourse: 'economics',
          wordCount: testStatement.split(' ').length
        })
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        alert('API test successful! Check console for details.');
      } else {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        alert(`API test failed: ${response.status} - Check console for details`);
      }
      
    } catch (error) {
      console.error('API Test Error:', error);
      alert(`API test failed: ${error.message}`);
    }
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '2px solid #00ced1',
      borderRadius: '10px',
      backgroundColor: '#f0f8ff'
    }}>
      <h2 style={{ color: '#00ced1' }}>🔧 Debug Test Component</h2>
      <p><strong>✅ React is working!</strong></p>
      <p><strong>✅ JavaScript is loading!</strong></p>
      <p><strong>Current URL:</strong> {window.location.href}</p>
      <p><strong>User Agent:</strong> {navigator.userAgent}</p>
      
      <button 
        onClick={testPersonalStatementAPI}
        style={{
          padding: '10px 20px',
          backgroundColor: '#00ced1',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '10px'
        }}
      >
        🧪 Test Personal Statement API
      </button>
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Open browser console (F12) to see detailed logs
      </div>
    </div>
  );
};

export default DebugTest;