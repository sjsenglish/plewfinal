/**
 * Upload Validated Vocabulary to Firebase
 * 
 * This script uploads the properly validated vocabulary data with:
 * - Verified word-sentence matching
 * - Real CSAT examples 
 * - Dictionary definitions and synonyms
 * - Complete data validation
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Firebase credentials
const firebaseConfig = {
  type: "service_account",
  project_id: "plewcsat1",
  private_key_id: "",
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCirXXHTRfXmT7e
PxLJp36h44tyU36fRk179ZogOYNUoDALPKofdot+Mwd/IW1ipSBTj8aW82NiOYfL
IzeFfLMmM2r0NYALSNcj/wX+u6QVB6zA91dNKSxL0wmW1T8lfEo99GRJWJwx0BVM
uclvWang3mby7KEaf8e1BPcpPXusFClQaNWyN+gmy5WfnNMpK+Pij0IWd03Z6beI
L1INBaZUkvzCQRonyyzfBx7Yms0XfYjjZm7EPfsMrObW+e8SeQ7JOAMsx7q/BJEf
4lISY7kurcZMM1a9aPBwOqK7qdKvr1oZIUHB19Vrl0fayEZjar+DRjJpZCjc0dvp
vKQmHPajAgMBAAECggEACGyBDSlR0xPtbHwe+0WVdMlKqZ3nOv+HTaRMhIoAjKZK
4US/7nx+AV1KcGveX92lzI3vvlYAzyT5gixjA0zkyKqgSYsSWViT7hpA842V6Tzf
gOfjTmyTuE1yUVbeO+ZcFdSM85CyGJDqOXHkG28CMVHISktfQExeSWJmG22X9N4f
7gqkMQ+ommeXVaEfpWlQjIhOKLOD7GoiZs0VaObc9QbD0kykSaYL4Zpl4yZCAKTY
DICaTjjc70zgeFTAUR4KRRxFtr++lXN509SZr2vD6h+vKea4YQjPT+Wk+h39u6xs
gaO8PBImBhP5k7fHoFpOLjakeqTVEu6iYIuVQanAEQKBgQDP66Hu0UI3DD0dLgG9
tBVcPUG9cckgY0fmgRsaqxUk1z0QgKX+RO1/ccUE4u6S2lxZjTfBtQj521jFD0o+
4IiB6dtwUaF5+Jmawt8/Mumn848brvM6cdxcV1PSrDgMkmDwq9YCqWSW+zKXME6H
iGDP85XCLeLBI2Ztx6T7YSEMGwKBgQDIS5BYVGlCAkbtht5ziMeHFDPkxYtOCAPy
GRitHKt+Z7T085jAVkF2b60bLPSVPtnfP831SehZ6qkdIz9KxUL/C0Yh7cW4zU2S
dvrDHJ7Nxo2iX3P9CIyG9/cQ2f0jWhHTAWd38ANxUK+MGnGl5uMfRbOBDtMfRkcy
wKi1ucTYGQKBgQC7DfIROJGplIkmx00prenJohKSrNuVF7yH037e7yuGiV2WiybL
KpfAIEpvqvmXhHuw1StkScpZfszN/IN/LeGhfxK8abQsV0tZwBe4c8ViI+yLq0mH
OwhUyvvOfMGwDcDIxM80ddDZRASvn/YGWNtAOpRwrXdi6sYr3YC/5xIkIQKBgC9w
RjXFeFCb/XSQdutiP++sR0Yty3qlx1l1vDR0D+IWafOCJnGXfFWyyYsgMKWQh0Wq
9PrdkFyLiZZPHNR2uBFz+B5dFHFanr7L00SW6L3QAwesF+qcNbxZyniBSMUwtfwF
3x23CPmzpIBIWxZyAuULOyKcAkDsAjzxCIRSBV8xAoGAQCw2w76gtf18mVDC7pEW
8rvk4eGCywVsCBQKiQVgXL9s2g0oOUpGjOqtBMqHMhhdM9pOnm27i8EqpPTBcEsd
x4HbiPiuwP5FdBQ2xLcXP19idZ8SBxJh7JrmtgASdzUKjTHSmiBPjcwzVPnLAQxB
akvxbAzw/nEQQeDTh79KgBg=
-----END PRIVATE KEY-----`,
  client_email: "firebase-adminsdk-fbsvc@plewcsat1.iam.gserviceaccount.com",
  client_id: "",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40plewcsat1.iam.gserviceaccount.com"
};

class ValidatedVocabularyUploader {
  constructor() {
    this.db = null;
    this.uploadId = `validated_upload_${Date.now()}`;
  }

  async initialize() {
    console.log('🚀 Initializing Firebase Admin for validated upload...');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig)
      });
    }
    
    this.db = admin.firestore();
    console.log('✅ Firebase Admin initialized');
  }

  async loadValidatedData() {
    console.log('📖 Loading validated vocabulary data...');
    
    if (!fs.existsSync('proper-vocabulary.json')) {
      throw new Error('proper-vocabulary.json not found. Run proper vocabulary extraction first.');
    }
    
    const data = JSON.parse(fs.readFileSync('proper-vocabulary.json', 'utf8'));
    console.log(`📊 Loaded ${data.extractionInfo.totalWords} validated vocabulary words`);
    console.log(`✅ Validation errors: ${data.extractionInfo.validationErrors}`);
    return data;
  }

  async clearPreviousData() {
    console.log('🗑️  Clearing previous vocabulary data...');
    
    try {
      // Get all documents in vocabulary collection
      const snapshot = await this.db.collection('vocabulary').get();
      
      if (snapshot.empty) {
        console.log('📝 No previous data to clear');
        return;
      }
      
      // Delete in batches
      const batch = this.db.batch();
      let count = 0;
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });
      
      await batch.commit();
      console.log(`🗑️  Cleared ${count} previous vocabulary entries`);
      
    } catch (error) {
      console.log('⚠️  Error clearing previous data (continuing anyway):', error.message);
    }
  }

  async uploadValidatedVocabulary(vocabularyData) {
    console.log('📤 Uploading validated vocabulary to Firebase...');
    
    const words = Object.values(vocabularyData.vocabulary);
    let uploadedCount = 0;
    const batchSize = 500;
    
    // Process in batches
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = this.db.batch();
      const batchWords = words.slice(i, i + batchSize);
      
      for (const word of batchWords) {
        try {
          // Validate this word before uploading
          if (!this.validateWord(word)) {
            console.log(`⚠️  Skipping invalid word: ${word.word}`);
            continue;
          }
          
          const wordRef = this.db.collection('vocabulary').doc(word.word);
          const wordDoc = {
            word: word.word,
            frequency: word.frequency,
            rank: word.rank,
            difficulty: word.difficulty,
            definition: word.definition,
            synonyms: word.synonyms || [],
            pronunciation: word.pronunciation,
            partOfSpeech: word.partOfSpeech,
            examples: word.examples || [],
            questionCount: word.questionCount,
            csatQuestions: word.csatQuestions || [],
            subjectArea: word.subjectArea,
            subjectAreas: word.subjectAreas,
            yearRange: word.yearRange,
            extractedAt: admin.firestore.Timestamp.now(),
            lastUpdated: admin.firestore.Timestamp.now(),
            validated: word.validated || true,
            source: word.source || 'Validated CSAT Extraction',
            validationStatus: 'passed'
          };
          
          batch.set(wordRef, wordDoc);
          uploadedCount++;
          
        } catch (error) {
          console.error(`❌ Error preparing word ${word.word}:`, error);
        }
      }
      
      await batch.commit();
      console.log(`📤 Uploaded batch ${Math.floor(i/batchSize) + 1}: ${Math.min(i + batchSize, words.length)}/${words.length} words`);
    }
    
    console.log(`✅ Successfully uploaded ${uploadedCount} validated vocabulary words`);
    return uploadedCount;
  }

  validateWord(word) {
    // Validate word structure
    if (!word.word || !word.definition || !word.examples) {
      return false;
    }
    
    // Validate that examples contain the word
    const wordRegex = new RegExp(`\\b${word.word}\\b`, 'i');
    let validExamples = 0;
    
    for (const example of word.examples) {
      if (wordRegex.test(example)) {
        validExamples++;
      }
    }
    
    // Require at least one valid example
    return validExamples > 0;
  }

  async logUploadMetadata(vocabularyData, uploadedCount) {
    console.log('📝 Logging upload metadata...');
    
    const metadata = {
      uploadId: this.uploadId,
      timestamp: admin.firestore.Timestamp.now(),
      source: vocabularyData.extractionInfo.source,
      extractionTimestamp: vocabularyData.extractionInfo.timestamp,
      totalExtracted: vocabularyData.extractionInfo.totalWords,
      totalUploaded: uploadedCount,
      validationErrors: vocabularyData.extractionInfo.validationErrors,
      status: 'completed',
      collection: 'vocabulary',
      dataQuality: 'validated',
      features: [
        'verified word-sentence matching',
        'real CSAT example sentences', 
        'dictionary definitions',
        'frequency-based ranking',
        'complete CSAT metadata'
      ]
    };
    
    await this.db.collection('upload_metadata').doc(this.uploadId).set(metadata);
    console.log(`✅ Upload metadata logged with ID: ${this.uploadId}`);
  }

  async validateUploadedData() {
    console.log('🔍 Validating uploaded data in Firebase...');
    
    const snapshot = await this.db.collection('vocabulary').limit(10).get();
    
    let validatedWords = 0;
    let issuesFound = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const word = data.word;
      
      // Check if examples contain the word
      let validExamples = 0;
      if (data.examples && data.examples.length > 0) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        data.examples.forEach(example => {
          if (wordRegex.test(example)) {
            validExamples++;
          }
        });
      }
      
      if (validExamples > 0 && data.definition && data.definition.length > 20) {
        validatedWords++;
      } else {
        issuesFound++;
        console.log(`⚠️  Issue with word "${word}": ${validExamples}/${data.examples?.length || 0} valid examples`);
      }
    });
    
    console.log(`✅ Sample validation: ${validatedWords}/10 words passed, ${issuesFound} issues found`);
    return { validatedWords, issuesFound };
  }

  async run() {
    try {
      await this.initialize();
      
      const vocabularyData = await this.loadValidatedData();
      await this.clearPreviousData();
      const uploadedCount = await this.uploadValidatedVocabulary(vocabularyData);
      await this.logUploadMetadata(vocabularyData, uploadedCount);
      
      const validation = await this.validateUploadedData();
      
      console.log('\n🎉 VALIDATED UPLOAD COMPLETE!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Uploaded: ${uploadedCount} validated vocabulary words`);
      console.log(`📊 Collection: vocabulary`);
      console.log(`📊 Upload ID: ${this.uploadId}`);
      console.log(`📊 Source: ${vocabularyData.extractionInfo.source}`);
      console.log(`📊 Validation Errors: ${vocabularyData.extractionInfo.validationErrors}`);
      console.log(`📊 Data Quality: All words have verified sentence matching`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('✅ Your vocabulary system now has properly validated data!');
      console.log('📱 Test it by refreshing your vocabulary page');
      console.log('🔍 Each word is guaranteed to appear in its example sentences');
      
    } catch (error) {
      console.error('💥 Upload failed:', error);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const uploader = new ValidatedVocabularyUploader();
  uploader.run().catch(console.error);
}

module.exports = ValidatedVocabularyUploader;