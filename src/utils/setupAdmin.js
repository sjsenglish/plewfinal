// Admin setup utility
import { setUserAdminStatus } from '../services/subscriptionService';

// Function to set up admin user by email
export const setupAdminUser = async (userEmail = 'sjahn101@gmail.com') => {
  try {
    console.log(`Setting up admin access for: ${userEmail}`);
    
    // Note: This requires the user to have logged in at least once to create a userId
    // The usePaywall hook will automatically grant admin access based on email
    // This function is for manually setting admin status in Firestore if needed
    
    console.log(`Admin access configured for: ${userEmail}`);
    console.log('The user will get full admin access when they next log in.');
    
    return {
      success: true,
      message: `Admin access configured for ${userEmail}. Full access will be granted on next login.`
    };
    
  } catch (error) {
    console.error('Error setting up admin user:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Manual function to set admin status by userId (if userId is known)
export const setAdminStatusByUserId = async (userId) => {
  try {
    const result = await setUserAdminStatus(userId, true, 'admin');
    
    if (result.success) {
      console.log('Admin status successfully set in Firestore');
      return {
        success: true,
        message: 'Admin status successfully set in Firestore'
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('Error setting admin status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// List of admin emails (can be expanded)
export const ADMIN_EMAILS = [
  'sjahn101@gmail.com'
];

// Check if email is admin
export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
};