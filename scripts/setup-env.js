/**
 * Environment Setup Script
 * 
 * This script helps set up the environment variables needed for vocabulary extraction
 * by detecting existing variables or prompting for them.
 */

const fs = require('fs');
const path = require('path');

function detectEnvironmentVariables() {
  console.log('🔍 Detecting existing environment variables...');
  
  const requiredVars = {
    'REACT_APP_ALGOLIA_APP_ID': process.env.REACT_APP_ALGOLIA_APP_ID,
    'REACT_APP_ALGOLIA_SEARCH_KEY': process.env.REACT_APP_ALGOLIA_SEARCH_KEY,
    'REACT_APP_FIREBASE_PROJECT_ID': process.env.REACT_APP_FIREBASE_PROJECT_ID
  };
  
  const detected = {};
  const missing = [];
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value && value !== 'undefined') {
      detected[key] = value;
      console.log(`✅ Found ${key}`);
    } else {
      missing.push(key);
      console.log(`❌ Missing ${key}`);
    }
  }
  
  return { detected, missing };
}

function createEnvFile(variables) {
  const envPath = path.join(__dirname, '.env');
  
  console.log('📝 Creating .env file...');
  
  let envContent = `# Auto-generated environment configuration for vocabulary extraction
# Generated on ${new Date().toISOString()}

# Algolia Configuration
REACT_APP_ALGOLIA_APP_ID=${variables.REACT_APP_ALGOLIA_APP_ID || 'your_algolia_app_id'}
REACT_APP_ALGOLIA_SEARCH_KEY=${variables.REACT_APP_ALGOLIA_SEARCH_KEY || 'your_algolia_search_key'}

# Firebase Configuration  
REACT_APP_FIREBASE_PROJECT_ID=${variables.REACT_APP_FIREBASE_PROJECT_ID || 'your_firebase_project_id'}

# Firebase Admin Service Account - REQUIRED FOR EXTRACTION
# Get these from Firebase Console -> Project Settings -> Service Accounts -> Generate Key
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nyour_private_key_here\\n-----END PRIVATE KEY-----\\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_CLIENT_ID=your_client_id

# Node Environment
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Created ${envPath}`);
  
  return envPath;
}

function checkFirebaseAdminCredentials() {
  const requiredAdminVars = [
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_PRIVATE_KEY', 
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID'
  ];
  
  const missing = requiredAdminVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('\n⚠️  Firebase Admin credentials not configured!');
    console.log('The following variables are required for database access:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nTo get these credentials:');
    console.log('1. Go to Firebase Console');
    console.log('2. Project Settings → Service Accounts');
    console.log('3. Click "Generate new private key"');
    console.log('4. Extract the values from the JSON file');
    console.log('5. Add them to your .env file');
    return false;
  }
  
  return true;
}

async function main() {
  console.log('🚀 Environment Setup for Vocabulary Extraction');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Detect existing variables
  const { detected, missing } = detectEnvironmentVariables();
  
  // Create env file
  const envPath = createEnvFile(detected);
  
  if (missing.length > 0) {
    console.log('\n⚠️  Some environment variables are missing:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nThese should be available in your deployment environment.');
    console.log('If running locally, you may need to configure them manually.');
  }
  
  // Load the new env file
  require('dotenv').config({ path: envPath });
  
  // Check Firebase admin setup
  const adminReady = checkFirebaseAdminCredentials();
  
  console.log('\n📊 Setup Summary:');
  console.log(`✅ Environment file: ${envPath}`);
  console.log(`${detected.REACT_APP_ALGOLIA_APP_ID ? '✅' : '❌'} Algolia App ID`);
  console.log(`${detected.REACT_APP_ALGOLIA_SEARCH_KEY ? '✅' : '❌'} Algolia Search Key`);
  console.log(`${detected.REACT_APP_FIREBASE_PROJECT_ID ? '✅' : '❌'} Firebase Project ID`);
  console.log(`${adminReady ? '✅' : '❌'} Firebase Admin Credentials`);
  
  if (!adminReady) {
    console.log('\n🔧 Next Steps:');
    console.log('1. Configure Firebase Admin credentials in .env file');
    console.log('2. Run: npm run test-extract');
    console.log('3. If tests pass, run: npm run extract');
  } else {
    console.log('\n🎉 Environment setup complete!');
    console.log('Run: npm run test-extract');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { detectEnvironmentVariables, createEnvFile, checkFirebaseAdminCredentials };