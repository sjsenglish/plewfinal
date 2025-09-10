-- Vocabulary Extraction Database Schema
-- This schema is designed for Firebase Firestore but can be adapted for SQL databases

-- Collection: vocabulary_words
-- Document structure for each word
{
  "word": "string",              -- The extracted word (lowercase, normalized)
  "originalWord": "string",      -- Original case word
  "frequency": "number",         -- Number of times word appears across all questions
  "rank": "number",             -- Frequency rank (1 = most frequent)
  "difficulty": "number",        -- Calculated difficulty (1-10 based on frequency and context)
  "partOfSpeech": "string",      -- Detected part of speech
  "isCommon": "boolean",         -- Whether this is a common English word to potentially filter
  "extractedAt": "timestamp",    -- When this word was extracted
  "lastUpdated": "timestamp",    -- Last time this record was updated
  "questionCount": "number",     -- Number of unique questions containing this word
  "yearRange": {                 -- Range of years this word appears in
    "earliest": "number",
    "latest": "number"
  },
  "subjectAreas": ["string"],    -- Subject areas where this word appears
  "avgSentenceLength": "number", -- Average length of sentences containing this word
  "definition": "string",        -- Optional: definition from dictionary API
  "synonyms": ["string"],        -- Optional: synonyms from dictionary API
  "examples": ["string"]         -- Top 3 example sentences
}

-- Collection: vocabulary_examples  
-- Document structure for each word's examples
{
  "wordId": "string",           -- Reference to vocabulary_words document
  "word": "string",             -- The word (for easier querying)
  "examples": [                 -- Array of example objects
    {
      "sentence": "string",     -- Full sentence containing the word
      "questionId": "string",   -- Algolia objectID of source question
      "questionNumber": "string", -- Question number if available
      "year": "number",         -- Year of the question
      "context": "string",      -- Surrounding context (paragraph)
      "subjectArea": "string",  -- Subject area of the question
      "wordPosition": "number", -- Position of word in sentence
      "sentenceLength": "number", -- Length of the sentence
      "isHighlighted": "boolean", -- Whether this is a featured example
      "complexity": "number"    -- Calculated sentence complexity score
    }
  ],
  "totalExamples": "number",    -- Total number of examples for this word
  "extractedAt": "timestamp",   -- When examples were extracted
  "lastUpdated": "timestamp"    -- Last update time
}

-- Collection: extraction_metadata
-- Document to track extraction runs and statistics
{
  "extractionId": "string",     -- Unique ID for this extraction run
  "startTime": "timestamp",     -- When extraction started
  "endTime": "timestamp",       -- When extraction completed
  "status": "string",           -- "running", "completed", "failed"
  "statistics": {
    "totalQuestions": "number",     -- Total questions processed
    "totalWords": "number",         -- Total words extracted (including duplicates)
    "uniqueWords": "number",        -- Number of unique words
    "filteredWords": "number",      -- Words filtered out as too common
    "storedWords": "number",        -- Words actually stored in database
    "avgWordsPerQuestion": "number", -- Average words per question
    "topFrequency": "number",       -- Highest word frequency
    "processingTimeMs": "number",   -- Total processing time
    "errorsEncountered": "number"   -- Number of errors during processing
  },
  "parameters": {
    "minFrequency": "number",       -- Minimum frequency to store word
    "maxWords": "number",           -- Maximum number of words to store
    "excludeCommon": "boolean",     -- Whether common words were excluded
    "minWordLength": "number",      -- Minimum word length processed
    "maxWordLength": "number",      -- Maximum word length processed
    "indexName": "string",          -- Algolia index used
    "fieldsProcessed": ["string"]   -- Fields that were processed for words
  },
  "errors": [                     -- Array of error objects if any occurred
    {
      "questionId": "string",
      "error": "string",
      "timestamp": "timestamp"
    }
  ]
}

-- Indexes needed for optimal querying:
-- vocabulary_words: word, frequency (desc), rank, difficulty, partOfSpeech
-- vocabulary_examples: wordId, word, year, subjectArea
-- extraction_metadata: extractionId, startTime (desc), status

-- Sample Firestore collection structure:
-- /vocabulary_words/{wordId}
-- /vocabulary_examples/{wordId}  
-- /extraction_metadata/{extractionId}

-- For SQL databases, use these table structures:

CREATE TABLE vocabulary_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL UNIQUE,
    original_word VARCHAR(100) NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    difficulty INTEGER DEFAULT 5,
    part_of_speech VARCHAR(50),
    is_common BOOLEAN DEFAULT FALSE,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    question_count INTEGER DEFAULT 0,
    year_earliest INTEGER,
    year_latest INTEGER,
    subject_areas TEXT[], -- PostgreSQL array, use JSON for other DBs
    avg_sentence_length DECIMAL(5,2),
    definition TEXT,
    synonyms TEXT[], -- PostgreSQL array, use JSON for other DBs
    examples TEXT[] -- Top 3 examples as JSON array
);

CREATE TABLE vocabulary_examples (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES vocabulary_words(id),
    word VARCHAR(100) NOT NULL,
    sentence TEXT NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    question_number VARCHAR(20),
    year INTEGER,
    context TEXT,
    subject_area VARCHAR(100),
    word_position INTEGER,
    sentence_length INTEGER,
    is_highlighted BOOLEAN DEFAULT FALSE,
    complexity INTEGER DEFAULT 5,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE extraction_metadata (
    id SERIAL PRIMARY KEY,
    extraction_id VARCHAR(100) UNIQUE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running',
    total_questions INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    unique_words INTEGER DEFAULT 0,
    filtered_words INTEGER DEFAULT 0,
    stored_words INTEGER DEFAULT 0,
    avg_words_per_question DECIMAL(5,2),
    top_frequency INTEGER DEFAULT 0,
    processing_time_ms BIGINT,
    errors_encountered INTEGER DEFAULT 0,
    min_frequency INTEGER DEFAULT 1,
    max_words INTEGER DEFAULT 1000,
    exclude_common BOOLEAN DEFAULT TRUE,
    min_word_length INTEGER DEFAULT 3,
    max_word_length INTEGER DEFAULT 20,
    index_name VARCHAR(100),
    fields_processed TEXT[]
);

-- Indexes for performance
CREATE INDEX idx_vocabulary_words_frequency ON vocabulary_words(frequency DESC);
CREATE INDEX idx_vocabulary_words_rank ON vocabulary_words(rank);
CREATE INDEX idx_vocabulary_words_word ON vocabulary_words(word);
CREATE INDEX idx_vocabulary_examples_word_id ON vocabulary_examples(word_id);
CREATE INDEX idx_vocabulary_examples_word ON vocabulary_examples(word);
CREATE INDEX idx_vocabulary_examples_year ON vocabulary_examples(year);
CREATE INDEX idx_extraction_metadata_extraction_id ON extraction_metadata(extraction_id);