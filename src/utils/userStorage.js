// src/utils/userStorage.js
import { getAuth } from 'firebase/auth';

/**
 * User-specific localStorage utility to prevent cross-user data sharing
 * All localStorage keys are prefixed with the user's UID
 */

const getUserId = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? user.uid : null;
};

const getUserKey = (key) => {
  const userId = getUserId();
  if (!userId) {
    console.warn('No authenticated user found for localStorage key:', key);
    return null;
  }
  return `user_${userId}_${key}`;
};

export const userStorage = {
  /**
   * Set item in localStorage with user-specific key
   */
  setItem: (key, value) => {
    const userKey = getUserKey(key);
    if (userKey) {
      try {
        localStorage.setItem(userKey, typeof value === 'string' ? value : JSON.stringify(value));
      } catch (error) {
        console.error('Error saving to user storage:', error);
      }
    }
  },

  /**
   * Get item from localStorage with user-specific key
   */
  getItem: (key, defaultValue = null) => {
    const userKey = getUserKey(key);
    if (!userKey) return defaultValue;
    
    try {
      const item = localStorage.getItem(userKey);
      if (item === null) return defaultValue;
      
      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error('Error reading from user storage:', error);
      return defaultValue;
    }
  },

  // Add convenience aliases for compatibility
  get: function(key, defaultValue = null) {
    return this.getItem(key, defaultValue);
  },

  set: function(key, value) {
    return this.setItem(key, value);
  },

  /**
   * Remove item from localStorage with user-specific key
   */
  removeItem: (key) => {
    const userKey = getUserKey(key);
    if (userKey) {
      try {
        localStorage.removeItem(userKey);
      } catch (error) {
        console.error('Error removing from user storage:', error);
      }
    }
  },

  /**
   * Clear all user-specific data
   */
  clearUserData: () => {
    const userId = getUserId();
    if (!userId) return;
    
    const prefix = `user_${userId}_`;
    const keysToRemove = [];
    
    // Find all keys for this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all user-specific keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing user data:', error);
      }
    });
  },

  /**
   * Migrate existing data to user-specific keys (one-time migration)
   */
  migrateExistingData: (keysToMigrate) => {
    const userId = getUserId();
    if (!userId) return;

    keysToMigrate.forEach(key => {
      const existingData = localStorage.getItem(key);
      if (existingData) {
        const userKey = `user_${userId}_${key}`;
        // Only migrate if user-specific key doesn't already exist
        if (!localStorage.getItem(userKey)) {
          localStorage.setItem(userKey, existingData);
        }
        // Remove the old non-user-specific key
        localStorage.removeItem(key);
      }
    });
  }
};

export default userStorage;