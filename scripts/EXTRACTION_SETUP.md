# Vocabulary Extraction Setup Guide

This guide will help you set up and run the vocabulary extraction script to process all CSAT questions and build a comprehensive vocabulary database.

## 📋 Prerequisites

1. **Node.js** (version 16 or higher)
2. **Firebase Admin credentials**
3. **Algolia search credentials**
4. **Environment variables configured**

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd scripts
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `scripts` directory with these variables:

```env
# Algolia Configuration
REACT_APP_ALGOLIA_APP_ID=your_algolia_app_id
REACT_APP_ALGOLIA_SEARCH_KEY=your_algolia_search_key

# Firebase Configuration
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_CLIENT_ID=your_client_id
```

### 3. Firebase Service Account Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Extract the credentials and add them to your `.env` file
4. Ensure your service account has Firestore read/write permissions

### 4. Test the Setup

Before running the full extraction, test your configuration:

```bash
npm run test-extract
```

This will:
- ✅ Test Algolia connection
- ✅ Test Firebase connection  
- ✅ Test word extraction logic
- ✅ Run a small-scale extraction test

### 5. Run Full Extraction

Once tests pass, run the complete extraction:

```bash
npm run extract
```

## 📊 What the Script Does

### Data Extraction Process

1. **Fetches ALL records** from your Algolia index `korean-english-question-pairs`
2. **Extracts words** from `question`, `english_text`, and `korean_text` fields
3. **Filters words** by:
   - Length (3-20 characters)
   - Common English words (optional filtering)
   - Letter-only validation
4. **Counts frequency** across all questions
5. **Stores top N words** (configurable, default 2000) with metadata

### Database Collections Created

#### `vocabulary_words`
```javascript
{
  word: "example",
  originalWord: "Example", 
  frequency: 45,
  rank: 123,
  difficulty: 6,
  questionCount: 15,
  yearRange: { earliest: 2020, latest: 2023 },
  subjectAreas: ["english", "literature"],
  avgSentenceLength: 12.5,
  examples: ["Top 3 example sentences..."]
}
```

#### `vocabulary_examples`
```javascript
{
  wordId: "example",
  word: "example",
  examples: [
    {
      sentence: "This is an example sentence.",
      questionId: "2023-english-q15",
      questionNumber: "15",
      year: 2023,
      subject: "english",
      complexity: 5
    }
  ]
}
```

#### `extraction_metadata`
```javascript
{
  extractionId: "extraction_1673123456789",
  startTime: "2023-01-08T10:30:00Z",
  endTime: "2023-01-08T11:45:00Z", 
  status: "completed",
  statistics: {
    totalQuestions: 5000,
    totalWords: 150000,
    uniqueWords: 8000,
    storedWords: 2000
  }
}
```

## ⚙️ Configuration Options

Edit the `CONFIG` object in `vocabularyExtractor.js`:

```javascript
const CONFIG = {
  ALGOLIA_INDEX: 'korean-english-question-pairs',
  BATCH_SIZE: 1000,           // Records per Algolia batch
  MAX_WORDS_TO_STORE: 2000,   // Top N words to store
  MIN_FREQUENCY: 2,           // Minimum frequency threshold
  MIN_WORD_LENGTH: 3,         // Minimum word length
  MAX_WORD_LENGTH: 20,        // Maximum word length
  EXCLUDE_COMMON_WORDS: true, // Filter common English words
  MAX_EXAMPLES_PER_WORD: 10,  // Max examples per word
  PROGRESS_INTERVAL: 100      // Progress update frequency
};
```

## 🔍 Monitoring Progress

The script provides detailed progress logging:

```
🚀 Initializing Vocabulary Extractor...
✅ Initialized. Extraction ID: extraction_1673123456789
📊 Starting question extraction from Algolia...
📄 Fetching page 1...
📄 Retrieved 1000 questions (Total: 1000)
📄 Fetching page 2...
...
✅ Extracted 5000 total questions
🔍 Processing questions for vocabulary extraction...
📈 Processed 100/5000 questions (2%)
📊 Current unique words: 1250
...
📋 Preparing words for storage...
📊 Words after filtering: 2000
💾 Storing words in Firebase...
💾 Committed batch of 500 operations
✅ Stored 2000 words and their examples in Firebase
```

## 📈 Expected Results

After extraction, you'll have:
- **~2000 most frequent vocabulary words** from CSAT questions
- **Detailed examples** with question references
- **Frequency rankings** and difficulty scores
- **Subject area categorization**
- **Year range tracking**

## 🚨 Troubleshooting

### Common Issues

1. **Algolia Connection Error**
   ```
   ❌ Error: Missing Algolia environment variables
   ```
   - Verify `REACT_APP_ALGOLIA_APP_ID` and `REACT_APP_ALGOLIA_SEARCH_KEY`

2. **Firebase Permission Error**
   ```
   ❌ Error: Permission denied
   ```
   - Check service account permissions
   - Verify Firestore rules allow admin access

3. **Memory Issues**
   ```
   ❌ Error: JavaScript heap out of memory
   ```
   - Reduce `BATCH_SIZE` or `MAX_WORDS_TO_STORE`
   - Run with: `node --max-old-space-size=4096 vocabularyExtractor.js`

4. **Rate Limiting**
   ```
   ❌ Error: Too many requests
   ```
   - The script includes delays between requests
   - Increase delays if needed

### Performance Tips

1. **Run during off-peak hours** to minimize API impact
2. **Monitor database costs** - this creates substantial write operations
3. **Consider running in stages** by adjusting `MAX_WORDS_TO_STORE`

## 🔄 Updating Your App

After extraction completes, update your vocabulary components:

1. **Replace imports** in `VocabularyPinterest.js`:
   ```javascript
   // Old approach
   import { fetchVocabulary } from '../services/vocabularyAPIService';
   
   // New approach  
   import { fetchVocabulary } from '../services/vocabularyServiceV2';
   ```

2. **Remove Algolia real-time search** code
3. **Update API calls** to use new service methods

## 📊 Monitoring Usage

Check extraction status and statistics:

```javascript
import { getVocabularyStats } from '../services/vocabularyServiceV2';

const stats = await getVocabularyStats();
console.log('Last extraction:', stats.lastExtraction);
console.log('Total words:', stats.totalWords);
```

## 🔧 Re-running Extraction

To update vocabulary data:

1. **Full re-extraction**: Run the script again (overwrites existing data)
2. **Incremental updates**: Modify script to process only new questions
3. **Scheduled runs**: Set up cron job for regular updates

## 📞 Support

If you encounter issues:

1. Run the test suite first: `npm run test-extract`
2. Check the console logs for detailed error messages
3. Verify all environment variables are correctly set
4. Ensure sufficient Firebase/Algolia quotas

---

**Estimated Runtime**: 30-60 minutes for ~5000 questions
**Database Impact**: ~4000 document writes (2000 words + 2000 examples + metadata)
**Memory Usage**: ~500MB-1GB peak