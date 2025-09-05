// services/learnService.js
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const db = getFirestore();

// Get current week number for content rotation
export const getCurrentWeek = () => {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const today = new Date();
  const daysSinceStart = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
  return Math.floor(daysSinceStart / 7) + 1;
};

// Admin function to set weekly content for a level
export const setWeeklyContent = async (level, weekNumber, content) => {
  try {
    const docRef = doc(db, 'weeklyContent', `${level}_week${weekNumber}`);
    await setDoc(docRef, {
      level,
      weekNumber,
      questionPacks: content.questionPacks || [],
      videos: content.videos || [],
      vocabulary: content.vocabulary || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error setting weekly content:', error);
    return { success: false, error: error.message };
  }
};

// Get weekly content for a specific level
export const getWeeklyContent = async (level, weekNumber) => {
  try {
    const docRef = doc(db, 'weeklyContent', `${level}_week${weekNumber}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      // Return default content if not found
      return { success: true, data: getDefaultContent(level) };
    }
  } catch (error) {
    console.error('Error getting weekly content:', error);
    return { success: false, error: error.message };
  }
};

// Get user's learning progress
export const getUserProgress = async (userId) => {
  try {
    const docRef = doc(db, 'userProgress', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: true, data: {} };
    }
  } catch (error) {
    console.error('Error getting user progress:', error);
    return { success: false, error: error.message };
  }
};

// Update user's progress
export const updateUserProgress = async (userId, progressUpdate) => {
  try {
    const docRef = doc(db, 'userProgress', userId);
    await setDoc(docRef, {
      ...progressUpdate,
      updatedAt: Timestamp.now()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating user progress:', error);
    return { success: false, error: error.message };
  }
};

// Mark question pack progress
export const updatePackProgress = async (userId, level, packId, completedQuestions) => {
  try {
    const docRef = doc(db, 'userProgress', userId);
    await updateDoc(docRef, {
      [`${level}.completedPacks.${packId}`]: completedQuestions,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating pack progress:', error);
    return { success: false, error: error.message };
  }
};

// Mark video as completed
export const markVideoCompleted = async (userId, level, videoId) => {
  try {
    const docRef = doc(db, 'userProgress', userId);
    const docSnap = await getDoc(docRef);
    
    let completedVideos = [];
    if (docSnap.exists() && docSnap.data()[level]?.completedVideos) {
      completedVideos = docSnap.data()[level].completedVideos;
    }
    
    if (!completedVideos.includes(videoId)) {
      completedVideos.push(videoId);
    }
    
    await updateDoc(docRef, {
      [`${level}.completedVideos`]: completedVideos,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking video completed:', error);
    return { success: false, error: error.message };
  }
};

// Update learned vocabulary
export const updateLearnedVocabulary = async (userId, learnedWords) => {
  try {
    const docRef = doc(db, 'userProgress', userId);
    await updateDoc(docRef, {
      learnedWords: learnedWords,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating learned vocabulary:', error);
    return { success: false, error: error.message };
  }
};

// Extract vocabulary from question packs
export const extractVocabularyFromPacks = async (packIds) => {
  try {
    const vocabulary = [];
    
    for (const packId of packIds) {
      const questionsQuery = query(
        collection(db, 'questions'),
        where('packId', '==', packId)
      );
      
      const querySnapshot = await getDocs(questionsQuery);
      querySnapshot.forEach((doc) => {
        const question = doc.data();
        // Extract vocabulary from question content
        // This is a simplified version - you'd want more sophisticated extraction
        if (question.vocabularyWords) {
          vocabulary.push(...question.vocabularyWords);
        }
      });
    }
    
    // Remove duplicates
    const uniqueVocab = Array.from(new Map(vocabulary.map(v => [v.word, v])).values());
    
    return { success: true, data: uniqueVocab };
  } catch (error) {
    console.error('Error extracting vocabulary:', error);
    return { success: false, error: error.message };
  }
};

// Default content structure
const getDefaultContent = (level) => {
  const defaults = {
    beginner: {
      questionPacks: [
        { id: 'default-pack-1', title: 'Basic Vocabulary', questionCount: 25, difficulty: 'Easy' },
        { id: 'default-pack-2', title: 'Simple Grammar', questionCount: 20, difficulty: 'Easy' },
        { id: 'default-pack-3', title: 'Daily Phrases', questionCount: 30, difficulty: 'Easy' },
      ],
      videos: [
        { id: 'default-vid-1', title: 'Introduction to Korean', duration: '15:30', thumbnail: 'https://via.placeholder.com/320x180' },
        { id: 'default-vid-2', title: 'Basic Pronunciation Guide', duration: '12:45', thumbnail: 'https://via.placeholder.com/320x180' },
        { id: 'default-vid-3', title: 'Essential Grammar Patterns', duration: '20:15', thumbnail: 'https://via.placeholder.com/320x180' },
      ],
      vocabulary: [
        { word: '안녕하세요', definition: 'Hello (formal)', synonym: 'greeting' },
        { word: '감사합니다', definition: 'Thank you', synonym: 'gratitude' },
        { word: '미안합니다', definition: 'Sorry', synonym: 'apology' },
      ]
    },
    intermediate: {
      questionPacks: [
        { id: 'default-pack-4', title: 'Complex Sentences', questionCount: 35, difficulty: 'Medium' },
        { id: 'default-pack-5', title: 'Business Korean', questionCount: 40, difficulty: 'Medium' },
        { id: 'default-pack-6', title: 'Reading Comprehension', questionCount: 25, difficulty: 'Medium' },
      ],
      videos: [
        { id: 'default-vid-4', title: 'Intermediate Conversation', duration: '25:00', thumbnail: 'https://via.placeholder.com/320x180' },
        { id: 'default-vid-5', title: 'Korean Culture & Context', duration: '18:30', thumbnail: 'https://via.placeholder.com/320x180' },
        { id: 'default-vid-6', title: 'Advanced Grammar Structures', duration: '30:00', thumbnail: 'https://via.placeholder.com/320x180' },
      ],
      vocabulary: [
        { word: '회사', definition: 'Company', synonym: 'business' },
        { word: '계약', definition: 'Contract', synonym: 'agreement' },
        { word: '회의', definition: 'Meeting', synonym: 'conference' },
      ]
    },
    advanced: {
      questionPacks: [
        { id: 'default-pack-7', title: 'Academic Writing', questionCount: 45, difficulty: 'Hard' },
        { id: 'default-pack-8', title: 'Literature Analysis', questionCount: 50, difficulty: 'Hard' },
        { id: 'default-pack-9', title: 'TOPIK II Preparation', questionCount: 60, difficulty: 'Hard' },
      ],
      videos: [
        { id: 'default-vid-7', title: 'Academic Korean', duration: '35:00', thumbnail: 'https://via.placeholder.com/320x180' },
        { id: 'default-vid-8', title: 'Korean Literature Overview', duration: '40:00', thumbnail: 'https://via.placeholder.com/320x180' },
        { id: 'default-vid-9', title: 'Advanced Writing Techniques', duration: '28:00', thumbnail: 'https://via.placeholder.com/320x180' },
      ],
      vocabulary: [
        { word: '논문', definition: 'Thesis/Paper', synonym: 'dissertation' },
        { word: '연구', definition: 'Research', synonym: 'study' },
        { word: '분석', definition: 'Analysis', synonym: 'examination' },
      ]
    }
  };
  
  return defaults[level] || defaults.beginner;
};