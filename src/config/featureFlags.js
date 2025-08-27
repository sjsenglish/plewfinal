// Feature Flags Configuration
// This file manages feature flags for safely testing new features without affecting live users

// Main feature flags - set these to true to enable features globally
const ENABLE_APPLICATION_BUILDER = true;
const ENABLE_STUDY_BUDDY = true;
const ENABLE_GRADE_PERSONAL_STATEMENT = true;

// Test user emails - add emails here to give specific users access to features
const TEST_USER_EMAILS = [
  'sjahn103@gmail.com',
  'team@examrizz.com',
  'suk.ahn10@gmail.com'
  // Add more test user emails here
];

// Helper function to check if a user should have access to a feature
export const checkFeatureAccess = (featureName, user) => {
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  // Map feature names to URL parameters
  const urlParamMap = {
    'APPLICATION_BUILDER': 'testAppBuilder',
    'STUDY_BUDDY': 'testStudyBuddy',
    'GRADE_PERSONAL_STATEMENT': 'testGradePS'
  };
  
  const urlParam = urlParamMap[featureName];
  const hasUrlOverride = urlParam && urlParams.get(urlParam) === 'true';
  
  // Check if user is a test user
  const isTestUser = user?.email && TEST_USER_EMAILS.includes(user.email);
  
  // Check the main feature flag
  const mainFlags = {
    'APPLICATION_BUILDER': ENABLE_APPLICATION_BUILDER,
    'STUDY_BUDDY': ENABLE_STUDY_BUDDY,
    'GRADE_PERSONAL_STATEMENT': ENABLE_GRADE_PERSONAL_STATEMENT
  };
  
  const isGloballyEnabled = mainFlags[featureName];
  
  // Return true if any condition is met
  return isGloballyEnabled || isTestUser || hasUrlOverride;
};

// Export individual feature check functions for convenience
export const shouldShowApplicationBuilder = (user) => {
  return checkFeatureAccess('APPLICATION_BUILDER', user);
};

export const shouldShowStudyBuddy = (user) => {
  return checkFeatureAccess('STUDY_BUDDY', user);
};

export const shouldShowGradePersonalStatement = (user) => {
  return checkFeatureAccess('GRADE_PERSONAL_STATEMENT', user);
};

// Export configuration for easy access
export const featureConfig = {
  ENABLE_APPLICATION_BUILDER,
  ENABLE_STUDY_BUDDY,
  ENABLE_GRADE_PERSONAL_STATEMENT,
  TEST_USER_EMAILS
};

// Function to get all active feature flags for debugging
export const getActiveFeatureFlags = (user) => {
  return {
    applicationBuilder: shouldShowApplicationBuilder(user),
    studyBuddy: shouldShowStudyBuddy(user),
    gradePersonalStatement: shouldShowGradePersonalStatement(user),
    isTestUser: user?.email && TEST_USER_EMAILS.includes(user.email),
    urlParams: Object.fromEntries(new URLSearchParams(window.location.search))
  };
};

// Log feature flags in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('Feature Flags Configuration:', {
    ENABLE_APPLICATION_BUILDER,
    ENABLE_STUDY_BUDDY,
    ENABLE_GRADE_PERSONAL_STATEMENT,
    TEST_USER_EMAILS
  });
}