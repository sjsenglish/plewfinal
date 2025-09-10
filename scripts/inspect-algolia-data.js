/**
 * Inspect Algolia Data Structure
 * This script examines the actual structure of your CSAT questions
 */

const { liteClient: algoliasearch } = require('algoliasearch/lite');

const CREDENTIALS = {
  ALGOLIA_APP_ID: '83MRCSJJZF',
  ALGOLIA_SEARCH_KEY: 'e96a3b50c7390bdcfdd0b4c5ee7ea130'
};

async function inspectData() {
  console.log('🔍 Inspecting Algolia Data Structure...');
  
  const searchClient = algoliasearch(CREDENTIALS.ALGOLIA_APP_ID, CREDENTIALS.ALGOLIA_SEARCH_KEY);
  
  try {
    // Get first 10 records with all attributes
    const response = await searchClient.search([{
      indexName: 'korean-english-question-pairs',
      params: {
        query: '',
        hitsPerPage: 10,
        attributesToRetrieve: ['*'] // Get all attributes
      }
    }]);
    
    const hits = response.results[0].hits;
    console.log(`📊 Total records in index: ${response.results[0].nbHits}`);
    console.log(`📋 Sample records: ${hits.length}`);
    console.log('');
    
    if (hits.length > 0) {
      console.log('🔍 FIRST RECORD STRUCTURE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const firstRecord = hits[0];
      
      // Show all fields and their content
      Object.keys(firstRecord).forEach(key => {
        const value = firstRecord[key];
        const valueStr = typeof value === 'string' ? 
          value.substring(0, 200) + (value.length > 200 ? '...' : '') : 
          JSON.stringify(value);
        console.log(`${key}: ${valueStr}`);
      });
      
      console.log('');
      console.log('🔍 ALL RECORD STRUCTURES (first 5):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      hits.slice(0, 5).forEach((record, index) => {
        console.log(`\nRecord ${index + 1} (ID: ${record.objectID}):`);
        console.log(`Fields: ${Object.keys(record).join(', ')}`);
        
        // Check for text content in each field
        Object.keys(record).forEach(key => {
          const value = record[key];
          if (typeof value === 'string' && value.length > 50) {
            console.log(`  ${key} (${value.length} chars): ${value.substring(0, 100)}...`);
          } else if (typeof value === 'string' && value.length > 0) {
            console.log(`  ${key}: ${value}`);
          }
        });
      });
      
      // Check for specific field patterns
      console.log('');
      console.log('🔍 FIELD ANALYSIS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const fieldStats = {};
      hits.forEach(record => {
        Object.keys(record).forEach(key => {
          if (!fieldStats[key]) {
            fieldStats[key] = { 
              count: 0, 
              hasText: 0, 
              avgLength: 0, 
              totalLength: 0,
              examples: []
            };
          }
          fieldStats[key].count++;
          const value = record[key];
          if (typeof value === 'string' && value.length > 0) {
            fieldStats[key].hasText++;
            fieldStats[key].totalLength += value.length;
            if (fieldStats[key].examples.length < 2) {
              fieldStats[key].examples.push(value.substring(0, 100));
            }
          }
        });
      });
      
      Object.keys(fieldStats).forEach(field => {
        const stats = fieldStats[field];
        if (stats.hasText > 0) {
          const avgLength = Math.round(stats.totalLength / stats.hasText);
          console.log(`${field}:`);
          console.log(`  - Present in ${stats.hasText}/${stats.count} records`);
          console.log(`  - Average length: ${avgLength} characters`);
          if (stats.examples.length > 0) {
            console.log(`  - Example: "${stats.examples[0]}"`);
          }
        }
      });
      
    } else {
      console.log('❌ No records found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

inspectData();