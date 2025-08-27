// src/services/quizService.js
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

// Create a new quiz
export const createQuiz = async (quizData) => {
  console.log('🔧 Starting quiz creation with data:', quizData);
  console.log('🔧 User authenticated?', !!quizData); // Basic check

  try {
    const quizId = doc(collection(db, 'temp')).id; // Generate random ID
    console.log('🔧 Generated quiz ID:', quizId);

    const quizRef = doc(db, 'quizzes', quizId);
    console.log('🔧 Quiz reference path:', quizRef.path);

    const newQuiz = {
      ...quizData,
      quizId,
      createdAt: serverTimestamp(),
      status: 'scheduled',
    };

    console.log('🔧 About to save quiz data:', {
      ...newQuiz,
      createdAt: '[ServerTimestamp]', // Don't log the actual timestamp object
    });

    // Try to write to Firestore
    await setDoc(quizRef, newQuiz);

    console.log('✅ Quiz saved successfully to Firestore!');
    console.log('✅ Quiz should be visible at path: quizzes/' + quizId);

    return { success: true, quizId, data: newQuiz };
  } catch (error) {
    console.error('❌ Error creating quiz:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error:', error);
    return { success: false, error: error.message };
  }
};

// Get current quiz for a subject
export const getCurrentQuiz = async (subject) => {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const q = query(
      quizzesRef,
      where('subject', '==', subject),
      where('status', 'in', ['scheduled', 'active']),
      orderBy('scheduledStart', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const quiz = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      return { success: true, data: quiz };
    } else {
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('Error getting current quiz:', error);
    return { success: false, error: error.message };
  }
};

// Get all quizzes for a subject (for admin)
export const getQuizzesBySubject = async (subject) => {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const q = query(quizzesRef, where('subject', '==', subject), orderBy('scheduledStart', 'desc'));

    const snapshot = await getDocs(q);
    const quizzes = [];

    snapshot.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: quizzes };
  } catch (error) {
    console.error('Error getting quizzes:', error);
    return { success: false, error: error.message };
  }
};

// Submit quiz attempt
export const submitQuizAttempt = async (attemptData) => {
  try {
    const attemptId = doc(collection(db, 'temp')).id;
    const attemptRef = doc(db, 'quiz-attempts', attemptId);

    // Calculate score
    const correctAnswers = attemptData.answers.filter(
      (answer, index) => answer === attemptData.correctAnswers[index]
    ).length;

    const percentageScore = Math.round((correctAnswers / attemptData.totalQuestions) * 100);

    const newAttempt = {
      ...attemptData,
      attemptId,
      correctAnswers,
      percentageScore,
      completedAt: serverTimestamp(),
      isComplete: true,
    };

    await setDoc(attemptRef, newAttempt);

    // Update leaderboard
    await updateLeaderboard(attemptData.quizId, {
      userId: attemptData.userId,
      displayName: attemptData.displayName,
      percentageScore,
      completionTimeSeconds: attemptData.completionTimeSeconds,
    });

    return { success: true, attemptId, data: newAttempt };
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return { success: false, error: error.message };
  }
};

// Check if user has already attempted a quiz
export const hasUserAttempted = async (userId, quizId) => {
  try {
    const attemptsRef = collection(db, 'quiz-attempts');
    const q = query(
      attemptsRef,
      where('userId', '==', userId),
      where('quizId', '==', quizId),
      where('isComplete', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return { success: true, hasAttempted: !snapshot.empty };
  } catch (error) {
    console.error('Error checking user attempt:', error);
    return { success: false, error: error.message };
  }
};

// Get user's attempt for a quiz
export const getUserAttempt = async (userId, quizId) => {
  try {
    const attemptsRef = collection(db, 'quiz-attempts');
    const q = query(
      attemptsRef,
      where('userId', '==', userId),
      where('quizId', '==', quizId),
      where('isComplete', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const attempt = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      return { success: true, data: attempt };
    } else {
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('Error getting user attempt:', error);
    return { success: false, error: error.message };
  }
};

// Update leaderboard
const updateLeaderboard = async (quizId, userScore) => {
  try {
    const leaderboardRef = doc(db, 'quiz-leaderboards', quizId);
    const leaderboardDoc = await getDoc(leaderboardRef);

    let leaderboardData = {
      topTen: [],
      totalParticipants: 0,
      averageScore: 0,
      lastUpdated: serverTimestamp(),
    };

    if (leaderboardDoc.exists()) {
      leaderboardData = leaderboardDoc.data();
    }

    // Add new score
    const allScores = [...(leaderboardData.allScores || []), userScore];

    // Sort by percentage (desc), then by time (asc) for perfect scores
    allScores.sort((a, b) => {
      if (a.percentageScore !== b.percentageScore) {
        return b.percentageScore - a.percentageScore;
      }
      // If both have same percentage, sort by completion time
      return a.completionTimeSeconds - b.completionTimeSeconds;
    });

    // Update rankings
    allScores.forEach((score, index) => {
      score.rank = index + 1;
    });

    // Calculate stats
    const totalParticipants = allScores.length;
    const averageScore =
      allScores.reduce((sum, score) => sum + score.percentageScore, 0) / totalParticipants;

    const updatedLeaderboard = {
      topTen: allScores.slice(0, 10),
      allScores, // Store all for ranking purposes
      totalParticipants,
      averageScore: Math.round(averageScore),
      lastUpdated: serverTimestamp(),
    };

    await setDoc(leaderboardRef, updatedLeaderboard);
    return { success: true };
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard for a quiz
export const getLeaderboard = async (quizId) => {
  try {
    const leaderboardRef = doc(db, 'quiz-leaderboards', quizId);
    const leaderboardDoc = await getDoc(leaderboardRef);

    if (leaderboardDoc.exists()) {
      return { success: true, data: leaderboardDoc.data() };
    } else {
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { success: false, error: error.message };
  }
};

// Get user's rank in a quiz
export const getUserRank = async (quizId, userId) => {
  try {
    const leaderboardResult = await getLeaderboard(quizId);

    if (!leaderboardResult.success || !leaderboardResult.data) {
      return { success: false, error: 'Leaderboard not found' };
    }

    const allScores = leaderboardResult.data.allScores || [];
    const userScore = allScores.find((score) => score.userId === userId);

    if (userScore) {
      return {
        success: true,
        data: {
          rank: userScore.rank,
          totalParticipants: leaderboardResult.data.totalParticipants,
          percentageScore: userScore.percentageScore,
          completionTime: userScore.completionTimeSeconds,
        },
      };
    } else {
      return { success: false, error: 'User not found in leaderboard' };
    }
  } catch (error) {
    console.error('Error getting user rank:', error);
    return { success: false, error: error.message };
  }
};

// Update quiz status (for admin/cron)
export const updateQuizStatus = async (quizId, status) => {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    await updateDoc(quizRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating quiz status:', error);
    return { success: false, error: error.message };
  }
};

// Get quiz prize pool information
export const getQuizPrizePool = async (quizId) => {
  try {
    // First check if there's a custom prize pool in Firestore
    const prizePoolRef = doc(db, 'prizePools', quizId);
    const prizePoolDoc = await getDoc(prizePoolRef);
    
    if (prizePoolDoc.exists()) {
      return {
        success: true,
        data: prizePoolDoc.data()
      };
    }

    // Return default prize pool if none exists
    const defaultPrizePool = {
      quizId,
      totalAmount: 500,
      firstPlace: 250,
      secondPlace: 150,
      thirdPlace: 100,
      currency: 'USD',
      lastUpdated: serverTimestamp()
    };

    return {
      success: true,
      data: defaultPrizePool
    };
  } catch (error) {
    console.error('Error getting quiz prize pool:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get top players for a quiz (using existing quiz-attempts collection)
export const getTopPlayers = async (quizId, limitCount = 10) => {
  try {
    const attemptsRef = collection(db, 'quiz-attempts');
    const q = query(
      attemptsRef,
      where('quizId', '==', quizId),
      where('isComplete', '==', true),
      orderBy('percentageScore', 'desc'),
      orderBy('completionTimeSeconds', 'asc'), // Secondary sort by time (faster is better)
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const topPlayers = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      topPlayers.push({
        userId: data.userId,
        displayName: data.displayName,
        percentageScore: data.percentageScore,
        completionTimeSeconds: data.completionTimeSeconds,
        completedAt: data.completedAt
      });
    });

    return {
      success: true,
      data: topPlayers
    };
  } catch (error) {
    console.error('Error getting top players:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Optional: Create or update prize pool (admin function)
export const updateQuizPrizePool = async (quizId, prizeData) => {
  try {
    const prizePoolRef = doc(db, 'prizePools', quizId);
    const prizePoolData = {
      ...prizeData,
      quizId,
      lastUpdated: serverTimestamp()
    };

    await setDoc(prizePoolRef, prizePoolData);

    return {
      success: true,
      data: prizePoolData
    };
  } catch (error) {
    console.error('Error updating quiz prize pool:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get quiz statistics (bonus function for enhanced displays)
export const getQuizStats = async (quizId) => {
  try {
    const attemptsRef = collection(db, 'quiz-attempts');
    const q = query(
      attemptsRef, 
      where('quizId', '==', quizId),
      where('isComplete', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const attempts = [];
    
    querySnapshot.forEach((doc) => {
      attempts.push(doc.data());
    });

    if (attempts.length === 0) {
      return {
        success: true,
        data: {
          totalParticipants: 0,
          averageScore: 0,
          averageTime: 0,
          highestScore: 0,
          fastestTime: 0
        }
      };
    }

    const totalParticipants = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.percentageScore, 0);
    const totalTime = attempts.reduce((sum, attempt) => sum + attempt.completionTimeSeconds, 0);
    const highestScore = Math.max(...attempts.map(a => a.percentageScore));
    const fastestTime = Math.min(...attempts.map(a => a.completionTimeSeconds));

    return {
      success: true,
      data: {
        totalParticipants,
        averageScore: Math.round(totalScore / totalParticipants),
        averageTime: Math.round(totalTime / totalParticipants),
        highestScore,
        fastestTime
      }
    };
  } catch (error) {
    console.error('Error getting quiz stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
// Add these functions to the bottom of your existing quizService.js file

// Get recent quizzes (completed or current)
export const getRecentQuizzes = async (subject, limit = 5) => {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const q = query(
      quizzesRef,
      where('subject', '==', subject),
      orderBy('scheduledStart', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    
    querySnapshot.forEach((doc) => {
      quizzes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: quizzes
    };
  } catch (error) {
    console.error('Error getting recent quizzes:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all-time leaderboard (across all quizzes for a subject)
export const getAllTimeLeaderboard = async (subject, limit = 10) => {
  try {
    const attemptsRef = collection(db, 'quiz-attempts');
    const q = query(
      attemptsRef,
      where('subject', '==', subject),
      orderBy('percentageScore', 'desc'),
      orderBy('completionTimeSeconds', 'asc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const attempts = [];
    
    querySnapshot.forEach((doc) => {
      attempts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: attempts
    };
  } catch (error) {
    console.error('Error getting all-time leaderboard:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get user's quiz history
export const getUserQuizHistory = async (userId, subject = null, limit = 10) => {
  try {
    const attemptsRef = collection(db, 'quiz-attempts');
    let q;
    
    if (subject) {
      q = query(
        attemptsRef,
        where('userId', '==', userId),
        where('subject', '==', subject),
        orderBy('startedAt', 'desc'),
        limit(limit)
      );
    } else {
      q = query(
        attemptsRef,
        where('userId', '==', userId),
        orderBy('startedAt', 'desc'),
        limit(limit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const attempts = [];
    
    querySnapshot.forEach((doc) => {
      attempts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: attempts
    };
  } catch (error) {
    console.error('Error getting user quiz history:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check if any quizzes exist for a subject (for initial setup)
export const hasAnyQuizzes = async (subject) => {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const q = query(
      quizzesRef,
      where('subject', '==', subject),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    return {
      success: true,
      hasQuizzes: !querySnapshot.empty,
      count: querySnapshot.size
    };
  } catch (error) {
    console.error('Error checking for quizzes:', error);
    return {
      success: false,
      error: error.message,
      hasQuizzes: false
    };
  }
};