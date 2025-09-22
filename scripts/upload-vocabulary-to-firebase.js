/**
 * Upload Extracted Vocabulary to Firebase
 * 
 * This script uploads the extracted vocabulary words to Firebase Firestore
 * using the client SDK (same as the app uses).
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, getDocs, deleteDoc } = require('firebase/firestore');
const fs = require('fs');

// Firebase config for plewfinal project
const firebaseConfig = {
  apiKey: "AIzaSyDu5HDNNp5CH_mGdXnbxO1lP0oGK2KoM2A",
  authDomain: "plewfinal.firebaseapp.com",
  projectId: "plewfinal",
  storageBucket: "plewfinal.firebasestorage.app",
  messagingSenderId: "1094652012866",
  appId: "1:1094652012866:web:dea8b7b22a96ed51cef5b3",
  measurementId: "G-SGCCB8JSKZ"
};

class VocabularyUploader {
  constructor() {
    this.app = null;
    this.db = null;
  }

  async initialize() {
    console.log('🚀 Initializing Firebase...');
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    console.log('✅ Firebase initialized');
  }

  async clearExistingVocabulary() {
    console.log('🗑️ Clearing existing vocabulary words...');
    
    try {
      const vocabularyRef = collection(this.db, 'vocabulary_words');
      const snapshot = await getDocs(vocabularyRef);
      
      console.log(`Found ${snapshot.size} existing vocabulary words to delete`);
      
      if (snapshot.size === 0) {
        console.log('No existing words to delete');
        return;
      }

      // Delete in batches of 500 (Firestore limit)
      const batchSize = 500;
      let deleted = 0;
      let batch = writeBatch(this.db);
      let batchCount = 0;

      for (const docSnapshot of snapshot.docs) {
        batch.delete(docSnapshot.ref);
        batchCount++;
        
        if (batchCount === batchSize) {
          await batch.commit();
          deleted += batchCount;
          console.log(`Deleted ${deleted} words so far...`);
          batch = writeBatch(this.db);
          batchCount = 0;
        }
      }

      // Commit remaining deletions
      if (batchCount > 0) {
        await batch.commit();
        deleted += batchCount;
      }

      console.log(`✅ Deleted ${deleted} existing vocabulary words`);
    } catch (error) {
      console.error('Error clearing existing vocabulary:', error);
      throw error;
    }
  }

  async uploadVocabulary(vocabularyList) {
    console.log(`📚 Uploading ${vocabularyList.length} vocabulary words to Firebase...`);
    
    try {
      const batchSize = 500; // Firestore batch limit
      let uploaded = 0;
      
      for (let i = 0; i < vocabularyList.length; i += batchSize) {
        const batch = writeBatch(this.db);
        const batchWords = vocabularyList.slice(i, i + batchSize);
        
        batchWords.forEach(word => {
          const docRef = doc(collection(this.db, 'vocabulary_words'), word.word);
          
          // Prepare word data for Firebase
          const wordData = {
            word: word.word,
            frequency: word.frequency || 1,
            difficulty: word.difficulty || 5,
            contexts: word.contexts || [],
            questions: word.questions || [],
            years: word.years || [],
            subjects: word.subjects || ['general'],
            definition: word.definition || '',
            examples: word.examples || [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          batch.set(docRef, wordData);
        });
        
        await batch.commit();
        uploaded += batchWords.length;
        console.log(`Uploaded ${uploaded}/${vocabularyList.length} words (${Math.round(uploaded/vocabularyList.length*100)}%)`);
      }
      
      console.log(`✅ Successfully uploaded all ${uploaded} vocabulary words!`);
    } catch (error) {
      console.error('Error uploading vocabulary:', error);
      throw error;
    }
  }

  async run() {
    try {
      await this.initialize();
      
      // Load the extracted vocabulary
      console.log('📖 Loading extracted vocabulary...');
      const vocabularyData = JSON.parse(fs.readFileSync('enhanced-vocabulary-output.json', 'utf8'));
      console.log(`Loaded ${vocabularyData.length} words from extraction`);
      
      // Clear existing vocabulary
      await this.clearExistingVocabulary();
      
      // Upload new vocabulary
      await this.uploadVocabulary(vocabularyData);
      
      console.log('🎉 Vocabulary upload completed successfully!');
      console.log('\nNext steps:');
      console.log('1. The vocabulary page should now show intermediate/advanced words');
      console.log('2. Search functionality will work with all extracted words');
      console.log('3. No more basic words like "people", "many", "often"');
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      process.exit(1);
    }
  }
}

// Run the uploader
const uploader = new VocabularyUploader();
uploader.run().then(() => {
  console.log('✅ Upload process completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});