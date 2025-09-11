# CSAT Vocabulary Extraction System

A comprehensive system to extract meaningful vocabulary from Korean-English CSAT passages and display them with context.

## Overview

This system automatically extracts vocabulary words from your Algolia 'korean-english-question-pairs' index and creates a rich vocabulary database with:

- **Real CSAT context sentences** with highlighted target words
- **Question tracking** showing which specific questions each word appears in (e.g., "2025 Q40")
- **Frequency analysis** to identify important vocabulary
- **Subject area categorization** for focused study
- **Difficulty estimation** based on word characteristics and usage

## Components

### 1. Vocabulary Extraction Script
**File:** `scripts/vocabulary-extractor.js`

Extracts vocabulary from Algolia and stores in Firebase:
- Connects to Algolia 'korean-english-question-pairs' index
- Filters out common stop words and short words
- Tracks frequency, context sentences, and question sources
- Estimates difficulty levels (1-5) based on various factors
- Stores in Firebase 'vocabulary' collection

**Usage:**
```bash
npm run extract-vocab
```

**Requirements:**
- Firebase Admin credentials in `src/config/firebase-admin-key.json`
- Environment variables: `REACT_APP_ALGOLIA_APP_ID`, `REACT_APP_ALGOLIA_SEARCH_KEY`

### 2. Vocabulary Display Component
**File:** `src/components/VocabularyPinterest.js`

Enhanced vocabulary browser with:
- **Search functionality** - Find words by name or context
- **Subject filtering** - Browse by literature, science, history, etc.
- **Context highlighting** - Target words highlighted in yellow in original CSAT sentences
- **Question references** - Shows which questions each word appears in
- **Frequency badges** - Visual indication of word importance
- **Masonry layout** - Pinterest-style card display

### 3. Firebase Data Structure

Each vocabulary document contains:
```javascript
{
  word: "challenging",           // The vocabulary word
  frequency: 5,                  // How many times it appears
  questions: ["2024 Q12", "2025 Q8"], // Which questions it appears in
  contexts: ["This challenging problem requires..."], // Original sentences
  subjects: ["science", "mathematics"], // Subject areas
  difficulty: 4,                 // Estimated difficulty (1-5)
  definition: "",                // To be filled manually/API
  examples: [                    // Specific question examples
    {
      questionId: "2024 Q12",
      sentence: "The challenging nature of..."
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Features

### Word Extraction
- ✅ Extracts from Korean-English CSAT passages
- ✅ Filters stop words and short words (< 4 characters)
- ✅ Requires minimum frequency (2+ occurrences)
- ✅ Tracks source questions with year/number
- ✅ Captures context sentences
- ✅ Estimates difficulty automatically

### Display Features
- ✅ **Real-time search** across words and contexts
- ✅ **Subject filtering** for focused study
- ✅ **Word highlighting** in context sentences
- ✅ **Question tracking** showing specific CSAT questions
- ✅ **Difficulty indicators** with color coding
- ✅ **Frequency badges** showing word importance
- ✅ **Responsive masonry layout**

### User Features
- ✅ Save/unsave words to personal collection
- ✅ Subject-based quiz generation
- ✅ Mobile-responsive design
- ✅ Pagination for large vocabulary sets

## Installation & Setup

1. **Install dependencies:**
```bash
npm install firebase-admin algoliasearch
```

2. **Add Firebase Admin credentials:**
   - Download service account key from Firebase Console
   - Save as `src/config/firebase-admin-key.json`

3. **Set environment variables:**
```bash
REACT_APP_ALGOLIA_APP_ID=your_app_id
REACT_APP_ALGOLIA_SEARCH_KEY=your_search_key
```

4. **Run vocabulary extraction:**
```bash
npm run extract-vocab
```

5. **View vocabulary in app:**
   - Navigate to vocabulary tab in your app
   - Words will load from Firebase automatically

## File Cleanup

Removed redundant files:
- ❌ `src/components/VocabularySearch.js` - Integrated into main component
- ❌ `src/components/VocabularyFilters.js` - Integrated into main component  
- ❌ `src/services/vocabularyAPIService.js` - Replaced with Firebase
- ❌ `scripts/vocabularyExtractor.js` - Replaced with new extractor

## Usage Examples

### Extract Vocabulary
```bash
# Extract all vocabulary from Korean-English questions
npm run extract-vocab

# Expected output:
# 🚀 Starting vocabulary extraction from Algolia...
# Found 340 questions to process
# Processing 2024 Q1: Found 23 words
# ...
# ✅ Saved 856 vocabulary words to Firebase
```

### Search & Filter
- **Search:** Type "challenge" to find all words containing "challenge" or appearing in contexts with that word
- **Filter by subject:** Click "Science" to see only vocabulary from science passages
- **View contexts:** Each word shows original CSAT sentences with the word highlighted
- **Question tracking:** See which specific questions (e.g., "2024 Q15") each word appears in

## Benefits for Students

1. **Real CSAT Content** - Vocabulary comes from actual exam passages, not generic word lists
2. **Context Learning** - See words used in real sentences from CSAT questions
3. **Question Tracking** - Know exactly which past questions used each word
4. **Progressive Difficulty** - Words are automatically categorized by estimated difficulty
5. **Subject Focus** - Study vocabulary specific to literature, science, history, etc.
6. **Frequency Priority** - Focus on words that appear most often in CSAT passages

## Technical Architecture

```
Algolia Index (korean-english-question-pairs)
    ↓
Node.js Extraction Script
    ↓
Firebase Firestore (vocabulary collection)
    ↓
React Component (VocabularyPinterest)
    ↓
Student Interface (Search, Filter, Study)
```

This system transforms raw CSAT question data into a comprehensive, searchable vocabulary learning platform that helps students focus on the most important words with real context from actual exam passages.