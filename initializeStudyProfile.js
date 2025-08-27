// In your Node.js backend, create a new file: initializeStudyProfile.js

const admin = require('firebase-admin');

async function initializeStudyProfile(userId) {
  const userRef = admin.firestore().collection('users').doc(userId);
  
  const studyProfileStructure = {
    studyProfile: {
      currentSubjects: [],
      supercurricular: {
        highLevel: [],
        mediumLevel: [],
        lowLevel: {
          books: [],
          lectures: [],
          moocs: [],
          currentAffairs: {
            weeklyReading: []
          }
        }
      },
      preferences: {
        studyStyle: "",
        reminderFrequency: "weekly",
        focusAreas: [],
        goalTimeframe: "weekly"
      },
      weeklyGoals: []
    },
    conversations: []
  };

  try {
    await userRef.update(studyProfileStructure);
    console.log(`Study profile initialized for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error initializing study profile:', error);
    return false;
  }
}

module.exports = { initializeStudyProfile };