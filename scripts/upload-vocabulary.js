/**
 * Upload Extracted Vocabulary to Firebase
 * 
 * This script uploads the extracted vocabulary data to Firebase using the new structure
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Firebase credentials from .env.local
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

class VocabularyUploader {
  constructor() {
    this.db = null;
    this.uploadId = `upload_${Date.now()}`;
  }

  async initialize() {
    console.log('🚀 Initializing Firebase Admin...');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig)
      });
    }
    
    this.db = admin.firestore();
    console.log('✅ Firebase Admin initialized');
  }

  async loadVocabularyData() {
    console.log('📖 Loading vocabulary data...');
    
    if (!fs.existsSync('extracted-vocabulary.json')) {
      throw new Error('extracted-vocabulary.json not found. Run vocabulary extraction first.');
    }
    
    const data = JSON.parse(fs.readFileSync('extracted-vocabulary.json', 'utf8'));
    console.log(`📊 Loaded ${data.extractionInfo.totalWords} vocabulary words`);
    return data;
  }

  async uploadVocabulary(vocabularyData) {
    console.log('📤 Uploading vocabulary to Firebase...');
    
    const batch = this.db.batch();
    const words = Object.values(vocabularyData.vocabulary);
    let count = 0;
    const BATCH_SIZE = 500;
    
    // Select top 500 words for now (to avoid hitting Firebase limits)
    const topWords = words
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 500);
    
    console.log(`📤 Uploading top ${topWords.length} words...`);
    
    for (const word of topWords) {
      try {
        // Store in vocabulary collection (main words)
        const wordRef = this.db.collection('vocabulary').doc(word.word);
        const wordDoc = {
          word: word.word,
          frequency: word.frequency,
          rank: word.rank,
          difficulty: word.difficulty,
          definition: word.definition,
          examples: word.examples.slice(0, 3), // First 3 examples
          synonyms: word.synonyms,
          subjectArea: word.subjectArea,
          subjectAreas: word.subjectAreas,
          extractedAt: admin.firestore.Timestamp.now(),
          lastUpdated: admin.firestore.Timestamp.now(),
          questionCount: word.questionCount,
          yearRange: word.yearRange,
          source: 'Algolia CSAT Extraction'
        };
        
        batch.set(wordRef, wordDoc);
        count++;
        
        // Commit batch when it gets large
        if (count % BATCH_SIZE === 0) {
          await batch.commit();
          console.log(`📤 Uploaded batch: ${count}/${topWords.length} words`);
        }
        
      } catch (error) {
        console.error(`❌ Error preparing word ${word.word}:`, error);
      }
    }
    
    // Commit remaining items
    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
      console.log(`📤 Uploaded final batch: ${count} words total`);
    }
    
    console.log(`✅ Successfully uploaded ${count} vocabulary words`);
    return count;
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
      status: 'completed',
      collection: 'vocabulary'
    };
    
    await this.db.collection('upload_metadata').doc(this.uploadId).set(metadata);
    console.log(`✅ Upload metadata logged with ID: ${this.uploadId}`);
  }

  async run() {
    try {
      await this.initialize();
      const vocabularyData = await this.loadVocabularyData();
      const uploadedCount = await this.uploadVocabulary(vocabularyData);
      await this.logUploadMetadata(vocabularyData, uploadedCount);
      
      console.log('\n🎉 UPLOAD COMPLETE!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Uploaded: ${uploadedCount} vocabulary words`);
      console.log(`📊 Collection: vocabulary`);
      console.log(`📊 Upload ID: ${this.uploadId}`);
      console.log('📊 Source: Algolia CSAT Questions');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('✅ Your vocabulary system is now ready!');
      console.log('📱 Test it by refreshing your vocabulary page');
      
    } catch (error) {
      console.error('💥 Upload failed:', error);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const uploader = new VocabularyUploader();
  uploader.run().catch(console.error);
}

module.exports = VocabularyUploader;