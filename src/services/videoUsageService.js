// services/videoUsageService.js
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get user's video usage data
 */
export const getUserVideoUsage = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create new user document with default video usage
      const defaultUsage = {
        videoUsage: {
          count: 0,
          lastResetDate: getTodayDateString(),
          totalVideosWatched: 0
        }
      };
      
      await setDoc(userDocRef, defaultUsage);
      return { success: true, data: defaultUsage.videoUsage };
    }
    
    const userData = userDoc.data();
    const videoUsage = userData.videoUsage || {
      count: 0,
      lastResetDate: getTodayDateString(),
      totalVideosWatched: 0
    };
    
    // Check if we need to reset the daily count
    const today = getTodayDateString();
    if (videoUsage.lastResetDate !== today) {
      // Reset daily count
      const resetUsage = {
        ...videoUsage,
        count: 0,
        lastResetDate: today
      };
      
      await updateDoc(userDocRef, { videoUsage: resetUsage });
      return { success: true, data: resetUsage };
    }
    
    return { success: true, data: videoUsage };
  } catch (error) {
    console.error('Error getting video usage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Increment user's video usage count
 */
export const incrementVideoUsage = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const usageResult = await getUserVideoUsage(userId);
    
    if (!usageResult.success) {
      return usageResult;
    }
    
    const currentUsage = usageResult.data;
    const newUsage = {
      ...currentUsage,
      count: currentUsage.count + 1,
      totalVideosWatched: (currentUsage.totalVideosWatched || 0) + 1
    };
    
    await updateDoc(userDocRef, { videoUsage: newUsage });
    return { success: true, data: newUsage };
  } catch (error) {
    console.error('Error incrementing video usage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user can watch another video
 */
export const checkVideoAccess = async (userId, isPaidUser = false) => {
  // Paid users have unlimited access
  if (isPaidUser) {
    return { 
      success: true, 
      canWatch: true, 
      usage: { count: 0, limit: 'unlimited' } 
    };
  }
  
  try {
    const usageResult = await getUserVideoUsage(userId);
    
    if (!usageResult.success) {
      return usageResult;
    }
    
    const usage = usageResult.data;
    const dailyLimit = 1;
    const canWatch = usage.count < dailyLimit;
    
    return {
      success: true,
      canWatch,
      usage: {
        count: usage.count,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - usage.count),
        nextResetTime: getNextMidnight()
      }
    };
  } catch (error) {
    console.error('Error checking video access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get today's date as a string (YYYY-MM-DD) in local timezone
 */
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get next midnight timestamp in local timezone
 */
const getNextMidnight = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
};

/**
 * Format time until next reset (for display purposes)
 */
export const getTimeUntilReset = () => {
  const now = new Date().getTime();
  const nextMidnight = getNextMidnight();
  const diff = nextMidnight - now;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};