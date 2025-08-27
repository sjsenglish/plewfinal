// src/services/personalStatementService.js
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  limit 
} from 'firebase/firestore';

/**
 * Get user's personal statement grading history
 */
export const getUserStatements = async (userId) => {
  try {
    const statementsRef = collection(db, 'users', userId, 'personalStatements');
    const q = query(statementsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const statements = [];
    querySnapshot.forEach((doc) => {
      statements.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      statements
    };
  } catch (error) {
    console.error('Error getting personal statements:', error);
    return { 
      success: false, 
      error: error.message,
      statements: []
    };
  }
};

/**
 * Save a graded personal statement
 */
export const saveGradedStatement = async (userId, statementData) => {
  try {
    const { 
      statement, 
      gradingResults, 
      targetCourse,
      wordCount,
      version
    } = statementData;

    const statementsRef = collection(db, 'users', userId, 'personalStatements');
    
    const docData = {
      statement,
      gradingResults,
      targetCourse: targetCourse || '',
      wordCount: wordCount || statement.split(/\s+/).length,
      version: version || 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      overallScore: gradingResults?.overallScore || 0,
      grade: gradingResults?.grade || '',
      isActive: true // Mark the latest one as active
    };

    // Mark all previous statements as inactive if this is a new version
    if (version === 1) {
      const existingStatements = await getUserStatements(userId);
      if (existingStatements.success && existingStatements.statements.length > 0) {
        for (const stmt of existingStatements.statements) {
          await updateDoc(doc(db, 'users', userId, 'personalStatements', stmt.id), {
            isActive: false
          });
        }
      }
    }

    const docRef = await addDoc(statementsRef, docData);

    return {
      success: true,
      statementId: docRef.id,
      data: docData
    };
  } catch (error) {
    console.error('Error saving graded statement:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Check if user can grade a statement (free vs paid limits)
 */
export const checkGradingEligibility = async (userId) => {
  try {
    // Get user's subscription status
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // New user - allow one free grading
      return {
        success: true,
        canGrade: true,
        isPaid: false,
        remainingGrades: 1,
        message: 'You have 1 free personal statement grading available'
      };
    }

    const userData = userDoc.data();
    const subscription = userData.subscription || { status: 'free' };
    const isPaid = subscription.status === 'active' || subscription.status === 'trialing';

    if (isPaid) {
      // Paid users have unlimited grading
      return {
        success: true,
        canGrade: true,
        isPaid: true,
        remainingGrades: -1, // Unlimited
        message: 'Unlimited personal statement grading available'
      };
    }

    // Check free user's grading history
    const statementsRef = collection(db, 'users', userId, 'personalStatements');
    const q = query(statementsRef);
    const querySnapshot = await getDocs(q);
    
    const gradingCount = querySnapshot.size;

    if (gradingCount >= 1) {
      // Free user has already used their one grading
      return {
        success: true,
        canGrade: false,
        isPaid: false,
        remainingGrades: 0,
        message: 'You have used your free personal statement grading. Upgrade to premium for unlimited grading.',
        existingStatement: querySnapshot.docs[0].data()
      };
    }

    return {
      success: true,
      canGrade: true,
      isPaid: false,
      remainingGrades: 1,
      message: 'You have 1 free personal statement grading available'
    };

  } catch (error) {
    console.error('Error checking grading eligibility:', error);
    return { 
      success: false, 
      error: error.message,
      canGrade: false 
    };
  }
};

/**
 * Update grading usage for free users
 */
export const updateGradingUsage = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create user document with usage data
      await setDoc(userDocRef, {
        usage: {
          personalStatementGraded: 1,
          firstGradingDate: serverTimestamp()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing user's usage
      await updateDoc(userDocRef, {
        'usage.personalStatementGraded': 1,
        'usage.firstGradingDate': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating grading usage:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Get the active/latest personal statement for a user
 */
export const getActiveStatement = async (userId) => {
  try {
    const statementsRef = collection(db, 'users', userId, 'personalStatements');
    const q = query(
      statementsRef, 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Try to get the latest statement even if not marked as active
      const fallbackQuery = query(
        statementsRef,
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);
      
      if (!fallbackSnapshot.empty) {
        const doc = fallbackSnapshot.docs[0];
        return {
          success: true,
          statement: {
            id: doc.id,
            ...doc.data()
          }
        };
      }
      
      return {
        success: true,
        statement: null
      };
    }
    
    const doc = querySnapshot.docs[0];
    return {
      success: true,
      statement: {
        id: doc.id,
        ...doc.data()
      }
    };
  } catch (error) {
    console.error('Error getting active statement:', error);
    return { 
      success: false, 
      error: error.message,
      statement: null
    };
  }
};

/**
 * Delete a personal statement
 */
export const deleteStatement = async (userId, statementId) => {
  try {
    const statementRef = doc(db, 'users', userId, 'personalStatements', statementId);
    await updateDoc(statementRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting statement:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};