// src/services/personalStatementGenerator.js

/**
 * Personal statement generation service using backend API
 */

/**
 * Generate personal statement using backend API
 */
export const generatePersonalStatement = async (refinedInsights) => {
  if (!refinedInsights || refinedInsights.length === 0) {
    throw new Error('At least one refined insight is required');
  }

  try {
    const response = await fetch('/api/generate-statement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refinedInsights
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate statement');
    }

    return {
      success: true,
      statement: data.statement,
      metadata: data.metadata
    };

  } catch (error) {
    console.error('Error generating personal statement:', error);
    return {
      success: false,
      error: error.message,
      statement: null
    };
  }
};

const personalStatementGenerator = {
  generatePersonalStatement
};

export default personalStatementGenerator;